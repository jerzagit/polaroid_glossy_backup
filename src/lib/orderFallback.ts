type FallbackOrderItemInput = {
  sizeId?: unknown;
  quantity?: unknown;
  imageUrls?: unknown;
  images?: unknown;
  customTexts?: unknown;
  unitPrice?: unknown;
  expectedImageCount?: unknown;
};

type FallbackOrderInput = {
  customerName?: unknown;
  customerEmail?: unknown;
  customerPhone?: unknown;
  customerHouseUnitNo?: unknown;
  customerAddressLine1?: unknown;
  customerAddressLine2?: unknown;
  customerPostcode?: unknown;
  customerCity?: unknown;
  customerState?: unknown;
  customerCountry?: unknown;
  notes?: unknown;
  customerNotes?: unknown;
  paymentMethod?: unknown;
  paymentStatus?: unknown;
  paymentProofUrl?: unknown;
  paymentReference?: unknown;
  subtotal?: unknown;
  shipping?: unknown;
  total?: unknown;
  items?: unknown;
};

export type FallbackOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerHouseUnitNo: string;
  customerAddressLine1: string;
  customerAddressLine2: string;
  customerPostcode: string;
  customerCity: string;
  customerState: string;
  customerCountry: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentProofUrl: string | null;
  paymentReference: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    sizeId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    images: string;
    customTexts: string;
    expectedImageCount: number;
  }>;
  statusHistory: Array<{
    id: string;
    status: string;
    message: string;
    createdAt: string;
  }>;
};

const FALLBACK_PRICES: Record<string, number> = {
  '4r': 1,
  a4: 3.5,
};

const globalForOrders = globalThis as typeof globalThis & {
  __polaroidFallbackOrders?: Map<string, FallbackOrder>;
};

const fallbackOrders = globalForOrders.__polaroidFallbackOrders ?? new Map<string, FallbackOrder>();
globalForOrders.__polaroidFallbackOrders = fallbackOrders;

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  return [];
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PG-${stamp}-${suffix}`;
}

export function createFallbackOrder(input: FallbackOrderInput) {
  const now = new Date().toISOString();
  const orderNumber = makeOrderNumber();
  const rawItems = Array.isArray(input.items) ? input.items as FallbackOrderItemInput[] : [];

  const items = rawItems.map((item, index) => {
    const sizeId = asString(item.sizeId, '4r').toLowerCase();
    const quantity = Math.max(1, asNumber(item.quantity, 1));
    const unitPrice = asNumber(item.unitPrice, FALLBACK_PRICES[sizeId] ?? 1);
    const imageUrls = asStringArray(item.imageUrls).length > 0
      ? asStringArray(item.imageUrls)
      : asStringArray(item.images);
    const customTexts = asStringArray(item.customTexts);
    const expectedImageCount = Math.max(
      asNumber(item.expectedImageCount, 0),
      imageUrls.length,
      customTexts.length,
      quantity,
    );

    return {
      id: makeId(`item${index + 1}`),
      sizeId,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      images: JSON.stringify(imageUrls),
      customTexts: JSON.stringify(customTexts),
      expectedImageCount,
    };
  });

  const subtotal = asNumber(
    input.subtotal,
    items.reduce((sum, item) => sum + item.totalPrice, 0),
  );
  const shipping = asNumber(input.shipping, 0);
  const total = asNumber(input.total, subtotal + shipping);

  const order: FallbackOrder = {
    id: makeId('order'),
    orderNumber,
    customerName: asString(input.customerName),
    customerEmail: asString(input.customerEmail),
    customerPhone: asString(input.customerPhone),
    customerHouseUnitNo: asString(input.customerHouseUnitNo, '-'),
    customerAddressLine1: asString(input.customerAddressLine1),
    customerAddressLine2: asString(input.customerAddressLine2, '-'),
    customerPostcode: asString(input.customerPostcode),
    customerCity: asString(input.customerCity),
    customerState: asString(input.customerState, 'selangor'),
    customerCountry: asString(input.customerCountry, 'Malaysia'),
    status: 'pending',
    paymentMethod: asString(input.paymentMethod, 'bank_transfer'),
    paymentStatus: asString(input.paymentStatus, 'pending'),
    paymentProofUrl: asString(input.paymentProofUrl) || null,
    paymentReference: asString(input.paymentReference) || null,
    subtotal,
    shipping,
    total,
    notes: asString(input.notes, asString(input.customerNotes)),
    createdAt: now,
    updatedAt: now,
    items,
    statusHistory: [{
      id: makeId('history'),
      status: 'pending',
      message: 'Order placed successfully',
      createdAt: now,
    }],
  };

  fallbackOrders.set(orderNumber, order);
  return order;
}

export function getFallbackOrder(orderNumber: string) {
  return fallbackOrders.get(orderNumber) ?? null;
}

export function appendFallbackOrderImage(orderNumber: string, orderItemId: string | null, url: string) {
  const order = getFallbackOrder(orderNumber);
  if (!order) return false;

  const item = orderItemId
    ? order.items.find(candidate => candidate.id === orderItemId)
    : order.items[0];
  if (!item) return false;

  const images = JSON.parse(item.images) as string[];
  images.push(url);
  item.images = JSON.stringify(images);
  order.updatedAt = new Date().toISOString();
  return true;
}

export function updateFallbackOrderPaymentProof(
  orderNumber: string,
  paymentProofUrl: string,
  paymentReference?: string
) {
  const order = getFallbackOrder(orderNumber);
  if (!order) return null;

  order.paymentProofUrl = paymentProofUrl;
  if (paymentReference) {
    order.paymentReference = paymentReference;
  }
  order.updatedAt = new Date().toISOString();
  return order;
}
