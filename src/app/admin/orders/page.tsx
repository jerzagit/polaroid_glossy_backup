'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, Loader2, Eye, ChevronDown, ChevronUp,
  AlertCircle, Package, Receipt, Upload, User, Users, Mail, Phone, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface OrderItem {
  id: string;
  sizeId: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  images: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: string;
  total: number;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentProofUrl?: string | null;
  paymentReference?: string | null;
  items: OrderItem[];
  createdAt: string;
}

type FilterTab = 'all' | 'pending_proof' | 'proof_submitted' | 'verified';

/* ─── Toast ─── */
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold',
        type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
      )}
    >
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {message}
    </motion.div>
  );
}

/* ─── Order card ─── */
function OrderCard({ order, onVerify, onReject, verifying }: {
  order: Order;
  onVerify: (orderNumber: string) => void;
  onReject: (orderNumber: string) => void;
  verifying: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const isVerifying = verifying === order.orderNumber;

  const hasProof = !!order.paymentProofUrl;
  const proofStatus = hasProof ? 'proof_submitted' : 'pending_proof';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-sm">{order.orderNumber}</span>
              <Badge variant="outline" className="text-xs">
                RM {order.total?.toFixed(2)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('en-MY', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              <span>{order.customerName}</span>
              {order.customerPhone && (
                <>
                  <Phone className="w-3 h-3 ml-2" />
                  <span>{order.customerPhone}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasProof ? (
              <Badge className="bg-blue-100 text-blue-800">
                <Receipt className="w-3 h-3 mr-1" />
                Proof Submitted
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800">
                <Clock className="w-3 h-3 mr-1" />
                Awaiting Proof
              </Badge>
            )}
          </div>
        </div>

        {/* Expand/Collapse details */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-between text-xs"
          onClick={() => setExpanded(!expanded)}
        >
          <span>{expanded ? 'Hide Details' : 'View Details'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3 border-t pt-3">
                {/* Customer info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium truncate">{order.customerEmail}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Method:</span>
                    <p className="font-medium capitalize">{order.paymentMethod?.replace('_', ' ') || 'Bank Transfer'}</p>
                  </div>
                </div>

                {/* Order items */}
                <div>
                  <span className="text-xs text-muted-foreground">Items ({order.items?.length || 0}):</span>
                  <div className="mt-1 space-y-1">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs bg-muted rounded px-2 py-1">
                        <span>{item.sizeName || item.sizeId} × {item.quantity}</span>
                        <span>RM {item.totalPrice?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment proof */}
                {hasProof && (
                  <div>
                    <span className="text-xs text-muted-foreground">Payment Proof:</span>
                    <div className="mt-1 flex gap-3 items-start">
                      <a href={order.paymentProofUrl!} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={order.paymentProofUrl!}
                          alt="Payment proof"
                          className="w-32 h-24 object-cover rounded-md border bg-muted"
                        />
                      </a>
                      <div className="text-xs space-y-1">
                        {order.paymentReference && (
                          <p>Reference: <span className="font-mono font-medium">{order.paymentReference}</span></p>
                        )}
                        <a
                          href={order.paymentProofUrl!}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View Full Image
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {hasProof && order.paymentStatus !== 'paid' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isVerifying}
                      onClick={() => onVerify(order.orderNumber)}
                    >
                      {isVerifying ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                      )}
                      Approve Payment
                    </Button>
                    {!showRejectForm ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isVerifying}
                        onClick={() => setShowRejectForm(true)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    ) : (
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Reason for rejection..."
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          className="text-xs min-h-[60px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isVerifying || !rejectNote.trim()}
                            onClick={() => {
                              onReject(order.orderNumber);
                              setShowRejectForm(false);
                              setRejectNote('');
                            }}
                          >
                            Confirm Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowRejectForm(false);
                              setRejectNote('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Already verified */}
                {order.paymentStatus === 'paid' && (
                  <Badge className="bg-green-100 text-green-800 w-full justify-center py-1">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Payment Verified
                  </Badge>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [verifying, setVerifying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('backend_jwt');
      const res = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (orderNumber: string) => {
    setVerifying(orderNumber);
    try {
      const token = localStorage.getItem('backend_jwt');
      const res = await fetch(`/api/admin/orders/${orderNumber}/verify-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Payment approved successfully', type: 'success' });
        fetchOrders();
      } else {
        setToast({ message: data.error || 'Failed to approve payment', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error', type: 'error' });
    } finally {
      setVerifying(null);
    }
  };

  const handleReject = async (orderNumber: string) => {
    setVerifying(orderNumber);
    try {
      const token = localStorage.getItem('backend_jwt');
      const res = await fetch(`/api/admin/orders/${orderNumber}/verify-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Payment rejected', type: 'success' });
        fetchOrders();
      } else {
        setToast({ message: data.error || 'Failed to reject payment', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error', type: 'error' });
    } finally {
      setVerifying(null);
    }
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending_proof') return !order.paymentProofUrl && order.paymentMethod === 'bank_transfer';
    if (activeTab === 'proof_submitted') return !!order.paymentProofUrl && order.paymentStatus !== 'paid';
    if (activeTab === 'verified') return order.paymentStatus === 'paid';
    return true;
  });

  const counts = {
    all: orders.length,
    pending_proof: orders.filter(o => !o.paymentProofUrl && o.paymentMethod === 'bank_transfer').length,
    proof_submitted: orders.filter(o => !!o.paymentProofUrl && o.paymentStatus !== 'paid').length,
    verified: orders.filter(o => o.paymentStatus === 'paid').length,
  };

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending_proof', label: 'Awaiting Proof' },
    { id: 'proof_submitted', label: 'Needs Review' },
    { id: 'verified', label: 'Verified' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 md:h-9 px-2 gap-1">
            <Link href="/admin/products">
              <Package className="w-4 h-4" /> <span className="text-xs md:text-sm">Products</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="h-8 md:h-9 px-2 gap-1">
            <Link href="/admin/users">
              <Users className="w-4 h-4" /> <span className="text-xs md:text-sm">Users</span>
            </Link>
          </Button>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-[10px] md:text-xs font-bold text-white">PG</span>
            </div>
            <span className="text-xs md:text-sm font-bold">Payment Verification</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-4 py-6 md:py-12 max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Payment Verification</h1>
        <p className="text-sm text-muted-foreground mb-6">Review and verify customer bank transfer payments</p>

        {/* Tabs */}
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
              <Badge variant="secondary" className="ml-2 text-xs">
                {counts[tab.id]}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {activeTab === 'pending_proof'
                  ? 'No orders awaiting payment proof.'
                  : activeTab === 'proof_submitted'
                  ? 'No payments to review.'
                  : 'No orders yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onVerify={handleVerify}
                onReject={handleReject}
                verifying={verifying}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
