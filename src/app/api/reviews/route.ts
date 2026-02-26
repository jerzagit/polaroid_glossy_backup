import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reviews - Get reviews for a print size or by user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sizeId = searchParams.get('sizeId');
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');

    if (orderId) {
      // Get review for specific order
      const review = await db.review.findUnique({
        where: { orderId },
        include: {
          user: true,
          size: true
        }
      });
      return NextResponse.json({ success: true, review });
    }

    if (userId) {
      // Get all reviews by user
      const reviews = await db.review.findMany({
        where: { userId },
        include: {
          size: true,
          order: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ success: true, reviews });
    }

    if (sizeId) {
      // Get all reviews for a print size
      const reviews = await db.review.findMany({
        where: { sizeId },
        include: {
          user: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ success: true, reviews });
    }

    // Get all reviews
    const reviews = await db.review.findMany({
      include: {
        user: true,
        size: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, orderId, sizeId, rating, title, comment, images } = body;

    // Validate required fields
    if (!userId || !orderId || !sizeId || !rating || !title || !comment) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to user
    const order = await db.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only review your own orders' },
        { status: 403 }
      );
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { success: false, error: 'You can only review delivered orders' },
        { status: 400 }
      );
    }

    // Check if already reviewed
    const existingReview = await db.review.findUnique({
      where: { orderId }
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'Order already reviewed' },
        { status: 400 }
      );
    }

    // Create review
    const review = await db.review.create({
      data: {
        userId,
        orderId,
        sizeId,
        rating,
        title,
        comment,
        images: images ? JSON.stringify(images) : null,
        isVerified: true // Since we verified the purchase
      },
      include: {
        user: true,
        size: true
      }
    });

    return NextResponse.json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

// PUT /api/reviews - Update a review
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, userId, rating, title, comment, images } = body;

    if (!reviewId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if review belongs to user
    const existingReview = await db.review.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    if (existingReview.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only edit your own reviews' },
        { status: 403 }
      );
    }

    // Update review
    const review = await db.review.update({
      where: { id: reviewId },
      data: {
        rating: rating ?? undefined,
        title: title ?? undefined,
        comment: comment ?? undefined,
        images: images ? JSON.stringify(images) : undefined
      },
      include: {
        user: true,
        size: true
      }
    });

    return NextResponse.json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews - Delete a review
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const userId = searchParams.get('userId');

    if (!reviewId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if review belongs to user
    const existingReview = await db.review.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    if (existingReview.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }

    // Delete review
    await db.review.delete({
      where: { id: reviewId }
    });

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
