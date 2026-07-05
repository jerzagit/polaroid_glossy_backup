'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Package, Clock, Loader2, CheckCircle, XCircle, Truck, RefreshCwIcon,
  PackageCheck, Copy, CreditCard, ImageIcon, Upload, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageCompression';

interface OrderItemType {
  id: string;
  sizeId: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  images: string | string[];
  customTexts: string | string[];
  expectedImageCount?: number;
}

interface StatusHistory {
  status: string;
  message?: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  customerEmail?: string;
  total: number;
  items: OrderItemType[];
  createdAt: string;
  trackingNumber?: string;
  statusHistory?: StatusHistory[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Package },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
  posted: { label: 'Posted', color: 'bg-purple-100 text-purple-800', icon: PackageCheck },
  on_delivery: { label: 'On Delivery', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: RefreshCwIcon },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const statusFlow = ['draft', 'pending', 'processing', 'posted', 'on_delivery', 'delivered'];
const UPLOAD_OPEN_STATUSES = new Set(['pending', 'processing']);

function normalizeStatus(status?: string) {
  return (status || '').toLowerCase();
}

function parseStringArray(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

function getExpectedImageCount(item: OrderItemType) {
  const images = parseStringArray(item.images);
  const customTexts = parseStringArray(item.customTexts);
  const quantity = Number.isFinite(Number(item.quantity)) ? Math.max(1, Number(item.quantity)) : 1;
  const explicitExpected = Number(item.expectedImageCount);

  if (Number.isFinite(explicitExpected) && explicitExpected > 0) {
    return Math.max(explicitExpected, images.length);
  }

  if (customTexts.length > 0) {
    return Math.max(customTexts.length * quantity, images.length);
  }

  return Math.max(quantity, images.length);
}

function getOrderImageProgress(order: Order | null) {
  if (!order?.items?.length) return { uploaded: 0, expected: 0, missing: 0, complete: true };

  const progress = order.items.reduce(
    (totals, item) => {
      const uploaded = parseStringArray(item.images).length;
      const expected = getExpectedImageCount(item);
      totals.uploaded += uploaded;
      totals.expected += expected;
      return totals;
    },
    { uploaded: 0, expected: 0 }
  );

  return {
    ...progress,
    missing: Math.max(0, progress.expected - progress.uploaded),
    complete: progress.expected > 0 && progress.uploaded >= progress.expected,
  };
}

function OrderTimeline({ history, currentStatus }: { history?: StatusHistory[]; currentStatus: string }) {
  if (!history || history.length === 0) {
    const currentIdx = statusFlow.indexOf(normalizeStatus(currentStatus));
    if (currentIdx === -1) return null;

    return (
      <div className="space-y-0">
        {statusFlow.slice(0, currentIdx + 1).map((status, i) => {
          const cfg = statusConfig[normalizeStatus(status)];
          const Icon = cfg?.icon || Clock;
          return (
            <div key={status} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                {i < currentIdx && <div className="w-0.5 flex-1 bg-primary/20 mt-1" />}
              </div>
              <div className="pt-1">
                <p className="text-sm font-medium">{cfg?.label || status}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {history.map((entry, i) => {
        const cfg = statusConfig[normalizeStatus(entry.status)];
        const Icon = cfg?.icon || Clock;
        return (
          <div key={i} className="flex gap-3 pb-4 last:pb-0">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              {i < history.length - 1 && <div className="w-0.5 flex-1 bg-primary/20 mt-1" />}
            </div>
            <div className="pt-1">
              <p className="text-sm font-medium">{cfg?.label || entry.status}</p>
              {entry.message && <p className="text-xs text-muted-foreground">{entry.message}</p>}
              <p className="text-xs text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString('en-MY')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/profile/orders/${orderNumber}`);
    }
  }, [user, authLoading, router, orderNumber]);

  useEffect(() => {
    if (!user) return;
    fetchOrder();
  }, [user, orderNumber]);

  useEffect(() => {
    if (!user || !order) return;

    const status = normalizeStatus(order.status);
    const progress = getOrderImageProgress(order);
    if (!UPLOAD_OPEN_STATUSES.has(status) || progress.complete) return;

    const interval = window.setInterval(() => {
      void fetchOrder({ silent: true });
    }, 10000);

    return () => window.clearInterval(interval);
  }, [user, order]);

  const fetchOrder = async (options?: { silent?: boolean }) => {
    try {
      const response = await fetch(`/api/orders/${orderNumber}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('backend_jwt')}`, 'Content-Type': 'application/json' } });
      const data = await response.json();
      if (data.success && data.order) {
        setOrder(data.order);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleUploadImages = async (item: OrderItemType, files: FileList | null) => {
    if (!order || !files || files.length === 0) return;

    const uploadedCount = parseStringArray(item.images).length;
    const expectedImageCount = getExpectedImageCount(item);
    const remainingCount = Math.max(0, expectedImageCount - uploadedCount);
    const selectedFiles = Array.from(files);

    if (remainingCount === 0) {
      toast.success('All required images are already uploaded');
      return;
    }

    if (selectedFiles.length > remainingCount) {
      toast.error(`Only ${remainingCount} more image${remainingCount === 1 ? '' : 's'} needed for this item`);
      return;
    }

    setUploadingItemId(item.id);
    try {
      let successCount = 0;

      for (const file of selectedFiles) {
        const compressedFile = await compressImage(file);
        const formData = new FormData();
        const token = localStorage.getItem('backend_jwt');
        formData.append('file', compressedFile);
        formData.append('orderId', order.orderNumber);
        formData.append('customerEmail', order.customerEmail || profile?.email || user?.email || '');
        formData.append('orderItemId', item.id);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Upload failed');
        }

        successCount += 1;
      }

      toast.success(`${successCount} image${successCount === 1 ? '' : 's'} uploaded`);
      await fetchOrder();
    } catch (error) {
      console.error('Order image upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingItemId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const normalizedStatus = normalizeStatus(order?.status);
  const canUploadImages = UPLOAD_OPEN_STATUSES.has(normalizedStatus);
  const status = order ? statusConfig[normalizedStatus] || statusConfig.pending : null;
  const StatusIcon = status?.icon || Clock;
  const imageProgress = getOrderImageProgress(order);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 md:h-9 px-2 gap-1">
            <Link href="/profile/orders">
              <ArrowLeft className="w-4 h-4" /> <span className="text-xs md:text-sm">Orders</span>
            </Link>
          </Button>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-[10px] md:text-xs font-bold text-white">PG</span>
            </div>
            <span className="text-xs md:text-sm font-bold">Polaroid Glossy MY</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-4 py-6 md:py-12 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !order ? (
          <Card>
            <CardContent className="p-12 text-center">
              <XCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Order not found</h3>
              <Button asChild>
                <Link href="/profile/orders">Back to Orders</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold font-mono">{order.orderNumber}</h1>
                {status && (
                  <Badge className={status.color + ' mt-1'}>
                    <StatusIcon className="w-3 h-3 mr-1 inline" />
                    {status.label}
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => handleCopy(order.orderNumber)}>
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTimeline history={order.statusHistory} currentStatus={order.status} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`rounded-md border p-3 text-sm ${imageProgress.complete ? 'border-green-200 bg-green-50 text-green-800' : 'border-yellow-200 bg-yellow-50 text-yellow-900'}`}>
                  <div className="flex items-center gap-2 font-medium">
                    {imageProgress.complete ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {imageProgress.complete
                      ? 'All required images uploaded'
                      : `${imageProgress.missing} image${imageProgress.missing === 1 ? '' : 's'} still missing`}
                  </div>
                  <p className="mt-1 text-xs opacity-80">
                    Uploaded {imageProgress.uploaded} / {imageProgress.expected}
                  </p>
                </div>

                {order.items?.map((item) => {
                  const images = parseStringArray(item.images);
                  const customTexts = parseStringArray(item.customTexts);
                  const expectedImageCount = getExpectedImageCount(item);
                  const missingImageCount = Math.max(0, expectedImageCount - images.length);
                  const canUploadMore = canUploadImages && missingImageCount > 0;

                  return (
                    <div key={item.id} className="space-y-3 rounded-md border p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.sizeName || item.sizeId}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-xs text-muted-foreground">
                            Images: {images.length} / {expectedImageCount}
                          </p>
                          <p className={`text-xs ${missingImageCount === 0 ? 'text-green-600' : 'text-yellow-700'}`}>
                            {missingImageCount === 0
                              ? 'Complete'
                              : `${missingImageCount} more image${missingImageCount === 1 ? '' : 's'} needed`}
                          </p>
                        </div>
                        <p className="font-medium">RM {item.totalPrice?.toFixed(2)}</p>
                      </div>

                      {customTexts.length > 0 && (
                        <div className="space-y-1">
                          {customTexts.map((text, index) => text && (
                            <p key={`${item.id}-text-${index}`} className="text-xs text-muted-foreground">
                              Photo {index + 1}: {text}
                            </p>
                          ))}
                        </div>
                      )}

                      {images.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {images.map((imageUrl, index) => (
                            <a
                              key={`${item.id}-image-${index}`}
                              href={imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block aspect-square overflow-hidden rounded-md border bg-muted"
                            >
                              <img src={imageUrl} alt={`${item.sizeName || item.sizeId} photo ${index + 1}`} className="h-full w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                          No images uploaded yet
                        </div>
                      )}

                      {canUploadMore && (
                        <div>
                          <input
                            id={`upload-${item.id}`}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                            multiple
                            className="sr-only"
                            disabled={uploadingItemId !== null}
                            onChange={(event) => {
                              void handleUploadImages(item, event.target.files);
                              event.currentTarget.value = '';
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingItemId !== null}
                            onClick={() => document.getElementById(`upload-${item.id}`)?.click()}
                          >
                            {uploadingItemId === item.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            Upload {missingImageCount} Image{missingImageCount === 1 ? '' : 's'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>RM {order.total?.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-sm">{order.trackingNumber}</p>
                </CardContent>
              </Card>
            )}

            {normalizedStatus === 'draft' && (
              <Button className="w-full" size="lg" asChild>
                <Link href={`/?pay=${order.orderNumber}`}>
                  <CreditCard className="w-4 h-4 mr-2" /> Pay Now
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
