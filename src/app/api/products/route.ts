import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import productsMeta from '@/data/products-meta.json';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080';
const API_BASE = `${BACKEND_API_BASE.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;

let cache: { data: unknown; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface ProductSpecs {
  dimensions: string;
  paper: string;
  finish: string;
  printMethod: string;
  processingTime: string;
  minQty: number;
}

export interface PricingTier {
  quantity: number;
  regularPrice: number;
  discountedPrice: number;
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
  pricingTiers?: PricingTier[];
}

const FALLBACK_SIZES = [
  { id: 'ic', name: 'Polaroid Full', displayName: 'Polaroid (5.5 × 8.9 cm) · Full', width: 5.5, height: 8.9, price: 2.00, description: 'Polaroid full print without a white border' },
  { id: 'ic-border', name: 'Polaroid Border', displayName: 'Polaroid (5.5 × 8.9 cm) · White border', width: 5.5, height: 8.9, price: 2.50, description: 'Polaroid with a white border' },
  { id: 'polaroid-mini', name: 'Polaroid Mini', displayName: 'Polaroid Mini (5.0 × 8.9 cm) · White border', width: 5, height: 8.9, price: 1.50, description: 'Mini Polaroid with a white border' },
  { id: '2r-no-border', name: '2R Full', displayName: '2R (6.3 × 8.9 cm) · Full', width: 6.3, height: 8.9, price: 2.50, description: '2R full print without a white border' },
  { id: '2r-border', name: '2R Border', displayName: '2R (6.3 × 8.9 cm) · White border', width: 6.3, height: 8.9, price: 2.00, description: '2R Polaroid style with a white border' },
  { id: '3r-no-border', name: '3R Full', displayName: '3R (8.9 × 12.7 cm) · Full', width: 8.9, height: 12.7, price: 2.50, description: '3R full print without a white border' },
  { id: '3r-border', name: '3R Border', displayName: '3R (8.9 × 12.7 cm) · White border', width: 8.9, height: 12.7, price: 2.40, description: '3R Polaroid style with a white border' },
  { id: '4r', name: '4R', displayName: '4R (10 × 15 cm)', width: 10, height: 15, price: 2.50, description: 'Classic full-print album photo' },
  { id: '5r', name: '5R', displayName: '5R (12.7 × 17.8 cm)', width: 12.7, height: 17.8, price: 4.00, description: 'Large full-print photo' },
  { id: '6r', name: '6R', displayName: '6R (15.2 × 20.3 cm)', width: 15.2, height: 20.3, price: 5.00, description: 'Extra-large full-print photo' },
  { id: 'strip-3', name: 'Strip 3', displayName: '3-Photo Strip', width: 6, height: 8.9, price: 1.80, description: 'Three photos in a single strip' },
  { id: 'strip-4', name: 'Strip 4', displayName: '4-Photo Strip', width: 6, height: 11.9, price: 1.80, description: 'Four photos in a single strip' },
];

async function fetchFromBackend(): Promise<ProductListing[] | null> {
  try {
    const res = await fetch(`${API_BASE}/print-sizes`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = await res.json();

    const raw: Array<Record<string, unknown>> = Array.isArray(data) ? data
      : (data?.success && Array.isArray(data.products)) ? data.products
      : [];
    if (raw.length === 0) return null;

    const jsonMetaMap = new Map(productsMeta.products.map(m => [m.id, m]));
    const fallbackMap = new Map(FALLBACK_SIZES.map(s => [s.id.toLowerCase(), s]));

    const backendProducts = raw.map(item => {
      const rawId = String(item.id ?? '').toLowerCase();
      const meta = jsonMetaMap.get(rawId) ?? jsonMetaMap.get(String(item.id ?? ''));
      const fallback = fallbackMap.get(rawId);
      const id = meta?.id ?? fallback?.id ?? rawId;
      const width = Number(item.width ?? fallback?.width ?? 0);
      const height = Number(item.height ?? fallback?.height ?? 0);
      const price = Number(item.price ?? fallback?.price ?? 0);
      const description = String(item.description ?? fallback?.description ?? '');

      return {
        id,
        name: String(item.name ?? id.toUpperCase()),
        displayName: String(item.displayName ?? meta?.specs?.dimensions ?? `${id.toUpperCase()} (${width} × ${height} inches)`),
        width,
        height,
        price,
        description,
        shortDescription: meta?.shortDescription ?? description,
        fullDescription: meta?.fullDescription ?? description,
        images: meta?.images ?? ['/images/product-collection.png'],
        image: meta?.images?.[0] ?? '/images/product-collection.png',
        popular: meta?.popular ?? false,
        tag: meta?.tag ?? String(item.tag ?? 'STANDARD'),
        features: meta?.features ?? [],
        accentColor: meta?.accentColor ?? '#6366f1',
        specs: meta?.specs ?? {
          dimensions: `${width} × ${height} inches`,
          paper: 'Glossy photo-grade 230gsm',
          finish: 'Glossy',
          printMethod: 'Dye-sublimation',
          processingTime: '3–4 working days',
          minQty: 1,
        },
        rating: meta?.rating ?? 4.8,
        reviewCount: meta?.reviewCount ?? 100,
        pricingTiers: meta?.pricingTiers,
      } satisfies ProductListing;
    });

    // Keep locally configured promotional products visible until the backend
    // catalog has been seeded with them.
    const localPromotions = buildFromFallback().filter(product =>
      product.pricingTiers && !backendProducts.some(existing => existing.id === product.id),
    );

    return [...backendProducts, ...localPromotions];
  } catch {
    return null;
  }
}

function buildFromFallback(): ProductListing[] {
  const jsonMetaMap = new Map(productsMeta.products.map(m => [m.id, m]));
  return FALLBACK_SIZES.map(size => {
    const meta = jsonMetaMap.get(size.id);
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
      pricingTiers: meta?.pricingTiers,
    };
  });
}

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
    });
  }

  let products: ProductListing[] | null = null;

  // 1. Try Spring Boot backend
  products = await fetchFromBackend();

  // 2. Fall back to local fallback data
  if (!products) {
    try {
      const sizes = await db.printSize.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } });
      if (sizes && sizes.length > 0) {
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

        products = (sizes as Array<Record<string, unknown>>).map(size => {
          const meta = (dbMetaMap.get(size.id as string) ?? jsonMetaMap.get(size.id as string)) as typeof productsMeta.products[0] | undefined;
          return {
            id: size.id as string,
            name: size.name as string,
            displayName: size.displayName as string,
            width: size.width as number,
            height: size.height as number,
            price: size.price as number,
            description: (size.description as string) ?? '',
            shortDescription: meta?.shortDescription ?? (size.description as string) ?? '',
            fullDescription: meta?.fullDescription ?? (size.description as string) ?? '',
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
            pricingTiers: meta?.pricingTiers,
          };
        });
      }
    } catch { /* fall through */ }
  }

  // 3. Ultimate fallback: products-meta.json + hardcoded sizes
  if (!products) {
    products = buildFromFallback();
  }

  const responseData = { success: true, products };
  cache = { data: responseData, expiresAt: Date.now() + CACHE_TTL_MS };

  return NextResponse.json(responseData, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
  });
}
