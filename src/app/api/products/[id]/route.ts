import { NextResponse } from 'next/server';
import productsMeta from '@/data/products-meta.json';

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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const size = FALLBACK_SIZES.find(s => s.id === id);

  if (!size) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
  }

  const meta = productsMeta.products.find(m => m.id === id);

  const product = {
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
    tiktokVideos: meta?.tiktokVideos ?? [],
  };

  return NextResponse.json({ success: true, product });
}
