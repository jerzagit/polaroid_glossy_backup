'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Package, Clock, Loader2, CheckCircle, XCircle, Truck, RefreshCwIcon,
  PackageCheck, Copy, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItemType {
  id: string;
  sizeId: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  images: string;
  customTexts: string;
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
  total: number;
  items: OrderItemType[];
  createdAt: string;
  trackingNumber?: string;
  statusHistory?: StatusHistory[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Package },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
  POSTED: { label: 'Posted', color: 'bg-purple-100 text-purple-800', icon: PackageCheck },
  ON_DELIVERY: { label: 'On Delivery', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: RefreshCwIcon },
  EXPIRED: { label: 'Expired', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const statusFlow = ['draft', 'pending', 'processing', 'posted', 'on_delivery', 'delivered'];

function OrderTimeline({ history, currentStatus }: { history?: StatusHistory[]; currentStatus: string }) {
  if (!history || history.length === 0) {
    const currentIdx = statusFlow.indexOf(currentStatus);
    if (currentIdx === -1) return null;

    return (
      <div className="space-y-0">
        {statusFlow.slice(0, currentIdx + 1).map((status, i) => {
          const cfg = statusConfig[status];
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
        const cfg = statusConfig[entry.status];
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
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/profile/orders/${orderNumber}`);
    }
  }, [user, authLoading, router, orderNumber]);

  useEffect(() => {
    if (!user) return;
    fetchOrder();
  }, [user, orderNumber]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderNumber}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('backend_jwt')}`, 'Content-Type': 'application/json' } });
      const data = await response.json();
      if (data.success && data.order) {
        setOrder(data.order);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const status = order ? statusConfig[order.status] || statusConfig.PENDING : null;

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
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{item.sizeName || item.sizeId}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">RM {item.totalPrice?.toFixed(2)}</p>
                  </div>
                ))}
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

            {order.status === 'draft' && (
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
