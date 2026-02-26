import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface OrderItemInput {
  sizeId: string;
  quantity: number;
  images: string[]; // Array of image URLs
  customTexts?: string[]; // Array of custom texts for each image
  unitPrice: number;
}

interface OrderInput {
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerState?: string;
  notes?: string;
  items: OrderItemInput[];
  subtotal: number;
  shipping?: number;
  total: number;
  paymentMethod?: string;
}

// Generate a unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PP-${timestamp}-${random}`;
}

// Ensure print sizes exist in database
async function ensurePrintSizes() {
  const defaultSizes = [
    { id: '2r', name: '2R', displayName: '2R (2.5 x 3.5 inches)', width: 2.5, height: 3.5, price: 0.50, description: 'Wallet size - Perfect for keepsakes' },
    { id: '3r', name: '3R', displayName: '3R (3.5 x 5 inches)', width: 3.5, height: 5, price: 0.75, description: 'Standard photo size - Great for albums' },
    { id: '4r', name: '4R', displayName: '4R (4 x 6 inches)', width: 4, height: 6, price: 1.00, description: 'Most popular - Classic polaroid style' },
    { id: 'a4', name: 'A4', displayName: 'A4 (8.3 x 11.7 inches)', width: 8.3, height: 11.7, price: 3.50, description: 'Poster size - Perfect for displays' }
  ];

  for (const size of defaultSizes) {
    await db.printSize.upsert({
      where: { id: size.id },
      update: {},
      create: size
    });
  }
}

// GET /api/orders - Get orders (for user or admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const orderNumber = searchParams.get('orderNumber');
    
    if (orderNumber) {
      // Get specific order by order number (for tracking)
      const order = await db.order.findUnique({
        where: { orderNumber },
        include: {
          items: {
            include: {
              size: true
            }
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, order });
    }

    let orders;
    if (userId) {
      // Get orders for specific user
      orders = await db.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              size: true
            }
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (email) {
      // Get orders by email (for guest users)
      orders = await db.order.findMany({
        where: { customerEmail: email },
        include: {
          items: {
            include: {
              size: true
            }
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Get all orders (admin - limited)
      orders = await db.order.findMany({
        include: {
          items: {
            include: {
              size: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
    }

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body: OrderInput = await request.json();
    console.log('Order request body:', JSON.stringify(body, null, 2));
    
    const { userId, customerName, customerEmail, customerPhone, customerState, notes, items, subtotal, shipping, total, paymentMethod } = body;

    // Validate required fields
    if (!customerName || !customerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Ensure print sizes exist in database
    await ensurePrintSizes();

    // Generate order number
    const orderNumber = generateOrderNumber();
    console.log('Creating order:', { orderNumber, customerName, customerEmail, total, paymentMethod });

    // Get shipping cost from request body or use default
    const shippingCost = shipping || 11;

    // Create order with items and status history in a transaction
    const order = await db.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          customerState: customerState || 'w',
          status: 'pending',
          subtotal,
          shipping: shippingCost,
          total,
          paymentMethod: paymentMethod || 'bank_transfer',
          notes: notes || null
        }
      });

      // Create initial status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: 'pending',
          message: 'Order placed successfully'
        }
      });

      // Create order items with multiple images
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            sizeId: item.sizeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            images: JSON.stringify(item.images), // Store as JSON string
            customTexts: item.customTexts ? JSON.stringify(item.customTexts) : null
          }
        });
      }

      // Return the order with items
      return await tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: {
            include: {
              size: true
            }
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order?.id,
        orderNumber: order?.orderNumber,
        customerName: order?.customerName,
        customerEmail: order?.customerEmail,
        status: order?.status,
        total: order?.total,
        itemCount: order?.items.length,
        createdAt: order?.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders - Update order status (for admin use)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, trackingNumber, message } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'processing', 'posted', 'on_delivery', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const order = await db.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          trackingNumber: trackingNumber || undefined,
          shippedAt: status === 'posted' ? new Date() : undefined,
          deliveredAt: status === 'delivered' ? new Date() : undefined,
          cancelledAt: status === 'cancelled' ? new Date() : undefined
        }
      });

      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          message: message || `Order status updated to ${status}`
        }
      });

      return updatedOrder;
    });

    return NextResponse.json({ 
      success: true, 
      order 
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders - Cancel an order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const cancelReason = searchParams.get('reason');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId' },
        { status: 400 }
      );
    }

    // Check if order can be cancelled
    const order = await db.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Can only cancel if status is pending or processing
    if (!['pending', 'processing'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Order cannot be cancelled at this stage' },
        { status: 400 }
      );
    }

    // Cancel the order
    const cancelledOrder = await db.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: cancelReason || null
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'cancelled',
          message: cancelReason || 'Order cancelled by customer'
        }
      });

      return updated;
    });

    return NextResponse.json({ 
      success: true, 
      order: cancelledOrder 
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
