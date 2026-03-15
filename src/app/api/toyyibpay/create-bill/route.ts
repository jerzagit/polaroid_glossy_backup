import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const body = await request.json();
    const { orderId, orderNumber, amount, customerEmail, customerName, customerPhone } = body;

    if (!orderId || !amount || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
    const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
    const returnUrl = process.env.TOYYIBPAY_RETURN_URL;
    const callbackUrl = process.env.TOYYIBPAY_CALLBACK_URL;

    if (!secretKey || !categoryCode) {
      return NextResponse.json(
        { success: false, error: 'ToyyibPay not configured' },
        { status: 500 }
      );
    }

    const billAmount = Math.round(amount * 100);
    const billName = `Order ${orderNumber}`;
    const billDescription = `Polaroid Glossy MY - Order ${orderNumber}`;

    const formData = new URLSearchParams();
    formData.append('userSecretKey', secretKey);
    formData.append('categoryCode', categoryCode);
    formData.append('billName', billName.substring(0, 30));
    formData.append('billDescription', billDescription.substring(0, 100));
    formData.append('billPriceSetting', '1');
    formData.append('billPayorInfo', '1');
    formData.append('billAmount', billAmount.toString());
    formData.append('billReturnUrl', returnUrl || '');
    formData.append('billCallbackUrl', callbackUrl || '');
    formData.append('billExternalReferenceNo', orderNumber);
    formData.append('billTo', customerName || '');
    formData.append('billEmail', customerEmail);
    formData.append('billPhone', customerPhone || '');
    formData.append('billPaymentChannel', '0');
    formData.append('billChargeToCustomer', '1');

    const baseUrl = process.env.TOYYIBPAY_BASE_URL ?? 'https://toyyibpay.com';

    const response = await fetch(`${baseUrl}/index.php/api/createBill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const rawText = await response.text();
    console.log('ToyyibPay raw response:', rawText);

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error('ToyyibPay non-JSON response:', rawText);
      return NextResponse.json(
        { success: false, error: `ToyyibPay error: ${rawText}` },
        { status: 502 }
      );
    }

    if (result && result[0] && result[0].BillCode) {
      const billCode = result[0].BillCode;
      const paymentUrl = `${baseUrl}/${billCode}`;

      await db.order.update({
        where: { id: orderId },
        data: {
          toyyibpayRef: billCode,
          paymentStatus: 'pending',
        },
      });

      return NextResponse.json({
        success: true,
        billCode,
        paymentUrl,
      });
    } else {
      console.error('ToyyibPay error:', result);
      return NextResponse.json(
        { success: false, error: 'Failed to create bill' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating ToyyibPay bill:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
