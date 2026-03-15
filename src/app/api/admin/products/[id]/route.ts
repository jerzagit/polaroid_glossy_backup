import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// PUT /api/admin/products/[id] — update print size pricing + product metadata
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    const body = await request.json();
    const { price, description, isActive,
            tag, accentColor, shortDescription, fullDescription,
            features, tiktokVideos, popular, rating, reviewCount } = body;

    // Update PrintSize if pricing fields present
    const sizeUpdate: Record<string, unknown> = {};
    if (price !== undefined) sizeUpdate.price = parseFloat(price);
    if (description !== undefined) sizeUpdate.description = description;
    if (isActive !== undefined) sizeUpdate.isActive = isActive;

    if (Object.keys(sizeUpdate).length > 0) {
      try {
        await db.printSize.update({ where: { id }, data: sizeUpdate });
      } catch { /* size might not be in DB (fallback only) — skip */ }
    }

    // Upsert ProductMeta
    const metaData = {
      tag: tag ?? 'STANDARD',
      accentColor: accentColor ?? '#6366f1',
      features: JSON.stringify(features ?? []),
      tiktokVideos: JSON.stringify(tiktokVideos ?? []),
      shortDescription: shortDescription ?? '',
      fullDescription: fullDescription ?? '',
      popular: popular ?? false,
      rating: rating ?? 4.8,
      reviewCount: reviewCount ?? 0,
    };

    const meta = await db.productMeta.upsert({
      where: { id },
      update: metaData,
      create: { id, images: '[]', ...metaData },
    });

    return NextResponse.json({ success: true, meta });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
  }
}

// PATCH /api/admin/products/[id] — toggle isActive on PrintSize
export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const current = await db.printSize.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ success: false, error: 'Print size not found in DB' }, { status: 404 });
    }
    const updated = await db.printSize.update({ where: { id }, data: { isActive: !current.isActive } });
    return NextResponse.json({ success: true, isActive: updated.isActive });
  } catch (error) {
    console.error('Error toggling product:', error);
    return NextResponse.json({ success: false, error: 'Failed to toggle product' }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] — soft delete (set isActive: false)
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.printSize.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: 'Failed to deactivate product' }, { status: 500 });
  }
}
