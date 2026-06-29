import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    
    const refno = body.get('refno') as string;
    const status = body.get('status') as string;
    const reason = body.get('reason') as string;
    const billcode = body.get('billcode') as string;
    const order_id = body.get('order_id') as string;
    const amount = body.get('amount') as string;
    const transaction_time = body.get('transaction_time') as string;
    const receivedHash = body.get('hash') as string;

    console.log('ToyyibPay callback received:', {
      refno,
      status,
      reason,
      billcode,
      order_id,
      amount,
      transaction_time,
    });

    const VALID_STATUSES = ['1', '2', '3'];
    if (!order_id || !status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const expectedHash = crypto
      .createHash('md5')
      .update(secretKey + status + order_id + refno + 'ok')
      .digest('hex');

    if (!receivedHash || receivedHash !== expectedHash) {
      console.error('Hash validation failed');
      return NextResponse.json(
        { success: false, error: 'Invalid hash' },
        { status: 400 }
      );
    }

    const paymentStatus = status === '1' ? 'paid' : status === '2' ? 'pending' : 'failed';
    const updateData: any = {
      paymentStatus,
    };

    if (paymentStatus === 'paid') {
      updateData.paidAt = new Date();
      updateData.status = 'processing';
    }

    const order = await db.order.update({
      where: { orderNumber: order_id },
      data: updateData,
    });

    if (!order) {
      console.error('Order not found:', order_id);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    await db.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: paymentStatus === 'paid' ? 'processing' : 'pending',
        message: paymentStatus === 'paid' 
          ? 'Payment received via ToyyibPay' 
          : `Payment ${paymentStatus}: ${reason || 'Pending payment'}`,
      },
    });

    console.log('Order updated successfully:', order.orderNumber, 'paymentStatus:', paymentStatus);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing ToyyibPay callback:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
