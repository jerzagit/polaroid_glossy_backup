import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import productsMeta from '@/data/products-meta.json';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/products — all products (active + inactive) merged with metadata
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    let sizes;
    try {
      sizes = await db.printSize.findMany({ orderBy: { price: 'asc' } });
      if (!sizes || sizes.length === 0) throw new Error('empty');
    } catch {
      sizes = [
        { id: 'ic', name: 'Polaroid Full', displayName: 'Polaroid (5.5 × 8.9 cm) · Full', width: 5.5, height: 8.9, price: 2.00, description: 'Polaroid full print', isActive: true },
        { id: 'ic-border', name: 'Polaroid Border', displayName: 'Polaroid (5.5 × 8.9 cm) · White border', width: 5.5, height: 8.9, price: 2.50, description: 'Polaroid with a white border', isActive: true },
        { id: 'polaroid-mini', name: 'Polaroid Mini', displayName: 'Polaroid Mini (5.0 × 8.9 cm) · White border', width: 5, height: 8.9, price: 1.50, description: 'Mini Polaroid with a white border', isActive: true },
        { id: '2r-no-border', name: '2R Full', displayName: '2R (6.3 × 8.9 cm) · Full', width: 6.3, height: 8.9, price: 2.50, description: '2R full print', isActive: true },
        { id: '2r-border', name: '2R Border', displayName: '2R (6.3 × 8.9 cm) · White border', width: 6.3, height: 8.9, price: 2.00, description: '2R Polaroid style', isActive: true },
        { id: '3r-no-border', name: '3R Full', displayName: '3R (8.9 × 12.7 cm) · Full', width: 8.9, height: 12.7, price: 2.50, description: '3R full print', isActive: true },
        { id: '3r-border', name: '3R Border', displayName: '3R (8.9 × 12.7 cm) · White border', width: 8.9, height: 12.7, price: 2.40, description: '3R Polaroid style', isActive: true },
        { id: '4r', name: '4R', displayName: '4R (10 × 15 cm)', width: 10, height: 15, price: 2.50, description: 'Classic full-print album photo', isActive: true },
        { id: '5r', name: '5R', displayName: '5R (12.7 × 17.8 cm)', width: 12.7, height: 17.8, price: 4.00, description: 'Large full-print photo', isActive: true },
        { id: '6r', name: '6R', displayName: '6R (15.2 × 20.3 cm)', width: 15.2, height: 20.3, price: 5.00, description: 'Extra-large full-print photo', isActive: true },
        { id: 'strip-3', name: 'Strip 3', displayName: '3-Photo Strip', width: 6, height: 8.9, price: 1.80, description: 'Three photos in a single strip', isActive: true },
        { id: 'strip-4', name: 'Strip 4', displayName: '4-Photo Strip', width: 6, height: 11.9, price: 1.80, description: 'Four photos in a single strip', isActive: true },
      ];
    }

    let dbMetaMap = new Map<string, Record<string, unknown>>();
    try {
      const dbMeta = await db.productMeta.findMany();
      dbMetaMap = new Map(dbMeta.map(m => [m.id, {
        ...m,
        images: JSON.parse(m.images as string),
        features: JSON.parse(m.features as string),
        tiktokVideos: JSON.parse(m.tiktokVideos as string),
      }]));
    } catch { /* fall through */ }

    const jsonMetaMap = new Map(productsMeta.products.map(m => [m.id, m]));

    const products = sizes.map(size => {
      const meta = dbMetaMap.get(size.id) ?? jsonMetaMap.get(size.id);
      return {
        id: size.id,
        name: size.name,
        displayName: size.displayName,
        width: size.width,
        height: size.height,
        price: size.price,
        description: size.description,
        isActive: (size as { isActive?: boolean }).isActive ?? true,
        shortDescription: (meta as { shortDescription?: string })?.shortDescription ?? '',
        fullDescription: (meta as { fullDescription?: string })?.fullDescription ?? '',
        images: (meta as { images?: string[] })?.images ?? [],
        tag: (meta as { tag?: string })?.tag ?? 'STANDARD',
        accentColor: (meta as { accentColor?: string })?.accentColor ?? '#6366f1',
        features: (meta as { features?: string[] })?.features ?? [],
        tiktokVideos: (meta as { tiktokVideos?: unknown[] })?.tiktokVideos ?? [],
        rating: (meta as { rating?: number })?.rating ?? 4.8,
        reviewCount: (meta as { reviewCount?: number })?.reviewCount ?? 0,
        popular: (meta as { popular?: boolean })?.popular ?? false,
        metaSource: dbMetaMap.has(size.id) ? 'db' : 'json',
      };
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/admin/products — create a new print size + optional metadata
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { name, displayName, width, height, price, description, isActive,
            tag, accentColor, shortDescription, fullDescription, features, popular } = body;

    if (!name || !displayName || !width || !height || !price) {
      return NextResponse.json({ success: false, error: 'Missing required fields: name, displayName, width, height, price' }, { status: 400 });
    }

    // Generate a slug-style id from name
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Create PrintSize in DB
    let size;
    try {
      size = await db.printSize.create({
        data: { id, name, displayName, width: parseFloat(width), height: parseFloat(height), price: parseFloat(price), description: description ?? '', isActive: isActive ?? true },
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Product ID already exists or DB error' }, { status: 409 });
    }

    // Create ProductMeta
    await db.productMeta.create({
      data: {
        id,
        tag: tag ?? 'STANDARD',
        accentColor: accentColor ?? '#6366f1',
        images: '[]',
        features: JSON.stringify(features ?? []),
        tiktokVideos: '[]',
        shortDescription: shortDescription ?? '',
        fullDescription: fullDescription ?? '',
        popular: popular ?? false,
      },
    });

    return NextResponse.json({ success: true, product: size }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
  }
}
