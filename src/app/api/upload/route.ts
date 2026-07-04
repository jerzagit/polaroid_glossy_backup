import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080';
const API_BASE = `${BACKEND_API_BASE.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_UPLOADS_PER_WINDOW = 30;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const ORDER_NUMBER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]{5,63}$/;
const ORDER_ITEM_ID_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/;
const CLOSED_ORDER_STATUSES = new Set(['cancelled', 'refunded', 'delivered', 'posted', 'on_delivery']);
const BLOCKED_PAYMENT_STATUSES = new Set(['failed', 'cancelled', 'refunded']);
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

type OrderItemLike = {
  images?: unknown;
  customTexts?: unknown;
  expectedImageCount?: unknown;
  quantity?: unknown;
};

type OrderLike = {
  orderNumber?: unknown;
  customerEmail?: unknown;
  status?: unknown;
  paymentStatus?: unknown;
  items?: unknown;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (existing.count >= MAX_UPLOADS_PER_WINDOW) return false;

  existing.count += 1;
  return true;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getOrder(payload: unknown): OrderLike | null {
  if (!payload || typeof payload !== 'object') return null;

  const record = payload as Record<string, unknown>;
  const candidates = [record.order, record.data, payload];
  const order = candidates.find(candidate => (
    candidate
    && typeof candidate === 'object'
    && 'orderNumber' in candidate
  ));

  return order ? order as OrderLike : null;
}

function getUploadCounts(order: OrderLike) {
  if (!Array.isArray(order.items)) {
    return { expected: null as number | null, uploaded: null as number | null };
  }

  return order.items.reduce(
    (totals, rawItem) => {
      if (!rawItem || typeof rawItem !== 'object') return totals;

      const item = rawItem as OrderItemLike;
      const images = parseJsonArray(item.images);
      const customTexts = parseJsonArray(item.customTexts);
      const expectedImageCount = typeof item.expectedImageCount === 'number' ? item.expectedImageCount : null;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;

      totals.uploaded += images.length;
      totals.expected += expectedImageCount ?? Math.max(customTexts.length, images.length, quantity, 0);
      return totals;
    },
    { expected: 0, uploaded: 0 }
  );
}

async function hasValidImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return isJpeg || isPng || isWebp;
}

function validateFile(file: File) {
  if (file.size <= 0) return 'File is empty';
  if (file.size > MAX_FILE_BYTES) return 'File exceeds 25MB limit';

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
    return 'Unsupported file type';
  }

  return null;
}

async function fetchVerifiedOrder(request: NextRequest, orderId: string, customerEmail: string) {
  const headers: Record<string, string> = {};
  const cookie = request.headers.get('cookie');
  if (cookie) headers.cookie = cookie;

  const params = new URLSearchParams({ orderNumber: orderId });
  const res = await fetch(`${API_BASE}/orders?${params}`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Order could not be verified' }, { status: 403 }),
    };
  }

  const data = await res.json();
  const order = getOrder(data);
  if (!order) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 }),
    };
  }

  const orderEmail = asString(order.customerEmail).toLowerCase();
  if (!orderEmail || orderEmail !== customerEmail.toLowerCase()) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Order ownership could not be verified' }, { status: 403 }),
    };
  }

  const status = asString(order.status).toLowerCase();
  const paymentStatus = asString(order.paymentStatus).toLowerCase();
  if (CLOSED_ORDER_STATUSES.has(status) || BLOCKED_PAYMENT_STATUSES.has(paymentStatus)) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Order is not open for uploads' }, { status: 409 }),
    };
  }

  const counts = getUploadCounts(order);
  if (counts.expected !== null && counts.expected > 0 && counts.uploaded !== null && counts.uploaded >= counts.expected) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Order already has the expected number of uploads' }, { status: 409 }),
    };
  }

  return { ok: true, response: null };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const orderId = formData.get('orderId');
    const customerEmail = formData.get('customerEmail');
    const uploadToken = formData.get('uploadToken');
    const orderItemId = formData.get('orderItemId');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }
    if (!customerEmail || typeof customerEmail !== 'string') {
      return NextResponse.json({ success: false, error: 'customerEmail is required' }, { status: 400 });
    }
    if (!ORDER_NUMBER_PATTERN.test(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid orderId' }, { status: 400 });
    }
    if (typeof orderItemId === 'string' && orderItemId.trim() && !ORDER_ITEM_ID_PATTERN.test(orderItemId)) {
      return NextResponse.json({ success: false, error: 'Invalid orderItemId' }, { status: 400 });
    }

    const fileError = validateFile(file);
    if (fileError) {
      return NextResponse.json({ success: false, error: fileError }, { status: 415 });
    }
    if (!(await hasValidImageSignature(file))) {
      return NextResponse.json({ success: false, error: 'Invalid image file' }, { status: 415 });
    }

    const rateLimitKey = `${getClientIp(request)}:${orderId}`;
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ success: false, error: 'Too many upload attempts' }, { status: 429 });
    }

    const verification = await fetchVerifiedOrder(request, orderId, customerEmail);
    if (!verification.ok) return verification.response;

    const backendForm = new FormData();
    backendForm.append('file', file);

    const params = new URLSearchParams({ orderId, customerEmail });
    if (typeof uploadToken === 'string' && uploadToken.trim()) {
      params.set('uploadToken', uploadToken);
    }
    if (typeof orderItemId === 'string' && orderItemId.trim()) {
      params.set('orderItemId', orderItemId);
    }
    const res = await fetch(`${API_BASE}/files/upload?${params}`, {
      method: 'POST',
      body: backendForm,
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}
