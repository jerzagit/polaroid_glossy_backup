import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import productsMeta from '@/data/products-meta.json';

// In-memory cache — avoids repeated DB hits for data that rarely changes
let cache: { data: unknown; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface ProductSpecs {
  dimensions: string;
  paper: string;
  finish: string;
  printMethod: string;
  processingTime: string;
  minQty: number;
}

export interface ProductListing {
  id: string;
  name: string;
  displayName: string;
  width: number;
  height: number;
  price: number;
  description: string;
  shortDescription: string;
  fullDescription: string;
  images: string[];
  image: string;
  popular: boolean;
  tag: string;
  features: string[];
  accentColor: string;
  specs: ProductSpecs;
  rating: number;
  reviewCount: number;
}

const FALLBACK_SIZES = [
  { id: '2r', name: '2R', displayName: '2R (2.5 x 3.5 inches)', width: 2.5, height: 3.5, price: 0.50, description: 'Wallet size - Perfect for keepsakes' },
  { id: '3r', name: '3R', displayName: '3R (3.5 x 5 inches)', width: 3.5, height: 5, price: 0.75, description: 'Standard photo size - Great for albums' },
  { id: '4r', name: '4R', displayName: '4R (4 x 6 inches)', width: 4, height: 6, price: 1.00, description: 'Most popular - Classic polaroid style' },
  { id: 'a4', name: 'A4', displayName: 'A4 (8.3 x 11.7 inches)', width: 8.3, height: 11.7, price: 3.50, description: 'Poster size - Perfect for displays' },
];

export async function GET() {
  // Serve from cache if still fresh
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
    });
  }

  try {
    let sizes;
    try {
      sizes = await db.printSize.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } });
      if (!sizes || sizes.length === 0) sizes = FALLBACK_SIZES;
    } catch {
      sizes = FALLBACK_SIZES;
    }

    // DB ProductMeta takes priority over products-meta.json
    let dbMetaMap = new Map<string, Record<string, unknown>>();
    try {
      const dbMeta = await db.productMeta.findMany();
      dbMetaMap = new Map(dbMeta.map(m => [m.id, {
        ...m,
        images: JSON.parse(m.images as string),
        features: JSON.parse(m.features as string),
        tiktokVideos: JSON.parse(m.tiktokVideos as string),
      }]));
    } catch { /* fall through to JSON */ }

    const jsonMetaMap = new Map(productsMeta.products.map(m => [m.id, m]));

    const products: ProductListing[] = sizes.map(size => {
      const meta = (dbMetaMap.get(size.id) ?? jsonMetaMap.get(size.id)) as typeof productsMeta.products[0] | undefined;
      return {
        id: size.id,
        name: size.name,
        displayName: size.displayName,
        width: size.width,
        height: size.height,
        price: size.price,
        description: size.description,
        shortDescription: meta?.shortDescription ?? size.description,
        fullDescription: meta?.fullDescription ?? size.description,
        images: meta?.images ?? ['/images/product-collection.png'],
        image: meta?.images?.[0] ?? '/images/product-collection.png',
        popular: meta?.popular ?? false,
        tag: meta?.tag ?? 'STANDARD',
        features: meta?.features ?? [],
        accentColor: meta?.accentColor ?? '#6366f1',
        specs: meta?.specs ?? {
          dimensions: `${size.width} × ${size.height} inches`,
          paper: 'Glossy photo-grade 230gsm',
          finish: 'Glossy',
          printMethod: 'Dye-sublimation',
          processingTime: '3–4 working days',
          minQty: 1,
        },
        rating: meta?.rating ?? 4.8,
        reviewCount: meta?.reviewCount ?? 100,
      };
    });

    const responseData = { success: true, products };
    cache = { data: responseData, expiresAt: Date.now() + CACHE_TTL_MS };

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
