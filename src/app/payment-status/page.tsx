'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Loader2, Camera, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [verifiedStatus, setVerifiedStatus] = useState<'success' | 'pending' | 'failed' | null>(null);

  const refno = searchParams.get('refno');
  const billcode = searchParams.get('billcode');
  const order_id = searchParams.get('order_id') || searchParams.get('orderId');
  const statusParam = searchParams.get('status') || searchParams.get('status_id');

  // Derive the sync cases during render; only the backend verification case
  // is handled by the effect (all setState happens in async callbacks).
  let baseStatus: 'success' | 'pending' | 'failed' | null = null;
  if (statusParam === '1' || statusParam === '2') {
    baseStatus = statusParam === '1' ? 'success' : 'pending';
  } else if (refno && billcode) {
    baseStatus = 'success';
  } else if (!order_id) {
    baseStatus = 'failed';
  }

  const needVerification = baseStatus === null && Boolean(order_id);
  const status = baseStatus ?? verifiedStatus;
  const loading = needVerification && verifiedStatus === null;

  useEffect(() => {
    if (!needVerification) return;

    let cancelled = false;
    fetch(`/api/orders/${order_id}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data.success && data.order) {
          if (data.order.paymentStatus === 'paid') setVerifiedStatus('success');
          else if (data.order.paymentStatus === 'pending') setVerifiedStatus('pending');
          else setVerifiedStatus('failed');
        } else {
          setVerifiedStatus('failed');
        }
      })
      .catch(error => {
        if (!cancelled) {
          console.error('Error fetching order:', error);
          setVerifiedStatus('failed');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [order_id, needVerification]);

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
              <h1 className="text-2xl font-bold mb-2">{t.pay_success_title}</h1>
              <p className="text-muted-foreground mb-6">{t.pay_success_desc}</p>
              {searchParams.get('order_id') && (
                <p className="text-sm text-muted-foreground mb-6">
                  {t.pay_order_no} <span className="font-mono font-semibold">{searchParams.get('order_id')}</span>
                </p>
              )}
            </>
          )}
          {status === 'pending' && (
            <>
              <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{t.pay_pending_title}</h1>
              <p className="text-muted-foreground mb-6">{t.pay_pending_desc}</p>
            </>
          )}
          {status === 'failed' && (
            <>
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{t.pay_fail_title}</h1>
              <p className="text-muted-foreground mb-6">{t.pay_fail_desc}</p>
            </>
          )}
          <div className="space-y-3">
            <Button onClick={() => router.push('/')} className="w-full">
              <Camera className="w-4 h-4 mr-2" /> {t.btn_back_home}
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t.btn_view_status}
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
