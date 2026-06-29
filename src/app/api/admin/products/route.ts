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
        { id: '2r', name: '2R', displayName: '2R (2.5 x 3.5 inches)', width: 2.5, height: 3.5, price: 0.50, description: 'Wallet size', isActive: true },
        { id: '3r', name: '3R', displayName: '3R (3.5 x 5 inches)', width: 3.5, height: 5, price: 0.75, description: 'Standard photo size', isActive: true },
        { id: '4r', name: '4R', displayName: '4R (4 x 6 inches)', width: 4, height: 6, price: 1.00, description: 'Most popular', isActive: true },
        { id: 'a4', name: 'A4', displayName: 'A4 (8.3 x 11.7 inches)', width: 8.3, height: 11.7, price: 3.50, description: 'Poster size', isActive: true },
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
