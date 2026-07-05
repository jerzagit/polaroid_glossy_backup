'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Package, Clock, Loader2, CheckCircle, XCircle, Truck, RefreshCwIcon, PackageCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OrderItem {
  id: string;
  size: { id: string; name: string; price: number };
  quantity: number;
  images: string;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
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

export default function OrdersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/profile/orders');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !profile) return;
    fetchOrders();
  }, [user, profile]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/my', { headers: { 'Authorization': `Bearer ${localStorage.getItem('backend_jwt')}`, 'Content-Type': 'application/json' } });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'delivered', label: 'Delivered' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 md:h-9 px-2 gap-1">
            <Link href="/profile">
              <ArrowLeft className="w-4 h-4" /> <span className="text-xs md:text-sm">Profile</span>
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

      <div className="container mx-auto px-3 md:px-4 py-6 md:py-12 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Order History</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">Start by creating your first photo print order.</p>
              <Button asChild>
                <Link href="/">Create Your First Order</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
              const isDraft = order.status === 'draft';

              return (
                <Link key={order.id} href={`/profile/orders/${order.orderNumber}`}>
                  <Card className={`hover:shadow-md transition-shadow cursor-pointer ${isDraft ? 'ring-2 ring-yellow-400/50' : ''}`}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-sm md:text-base">{order.orderNumber}</span>
                            {isDraft && <Badge variant="outline" className="text-yellow-600 border-yellow-400">Draft</Badge>}
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            {itemCount} item{itemCount !== 1 ? 's' : ''} — RM {order.total?.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1 inline" />
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
