'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Loader2, Camera, ArrowLeft } from 'lucide-react';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080/api';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'pending' | 'failed' | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const refno = searchParams.get('refno');
    const billcode = searchParams.get('billcode');
    const order_id = searchParams.get('order_id') || searchParams.get('orderId');
    const statusParam = searchParams.get('status') || searchParams.get('status_id');

    if (order_id) {
      setOrderNumber(order_id);
    }

    if (statusParam === '1' || statusParam === '2') {
      setStatus(statusParam === '1' ? 'success' : 'pending');
      setLoading(false);
    } else if (refno && billcode) {
      setStatus('success');
      setLoading(false);
    } else if (order_id) {
      fetchOrderStatus(order_id);
    } else {
      setStatus('failed');
      setLoading(false);
    }
  }, [searchParams]);

  const fetchOrderStatus = async (orderNum: string) => {
    try {
      // First try Spring Boot backend
      const backendRes = await fetch(`${BACKEND_API_BASE}/orders/${encodeURIComponent(orderNum)}`);
      if (backendRes.ok) {
        const backendData = await backendRes.json();
        if (backendData.paymentStatus === 'PAID') {
          setStatus('success');
          setLoading(false);
          return;
        } else if (backendData.paymentStatus === 'PENDING') {
          setStatus('pending');
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through to Next.js API route
    }

    try {
      const res = await fetch(`/api/orders?orderNumber=${orderNum}`);
      const data = await res.json();
      if (data.success && data.order) {
        if (data.order.paymentStatus === 'paid') {
          setStatus('success');
        } else if (data.order.paymentStatus === 'pending') {
          setStatus('pending');
        } else {
          setStatus('failed');
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center">
          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground mb-6">
                Thank you for your payment. Your order is being processed.
              </p>
              {orderNumber && (
                <p className="text-sm text-muted-foreground mb-6">
                  Order Number: <span className="font-mono font-semibold">{orderNumber}</span>
                </p>
              )}
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Payment Pending</h1>
              <p className="text-muted-foreground mb-6">
                Your payment is being processed. Please wait a moment.
              </p>
              {orderNumber && (
                <p className="text-sm text-muted-foreground mb-6">
                  Order Number: <span className="font-mono font-semibold">{orderNumber}</span>
                </p>
              )}
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
              <p className="text-muted-foreground mb-6">
                Something went wrong with your payment. Please try again.
              </p>
            </>
          )}

          <div className="space-y-3">
            <Button onClick={() => router.push('/')} className="w-full">
              <Camera className="w-4 h-4 mr-2" /> Back to Home
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> View Order Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentStatusContent />
    </Suspense>
  );
}
