import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import productsMeta from '@/data/products-meta.json';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    let size;
    try {
      size = await db.printSize.findUnique({ where: { id } });
    } catch {
      size = null;
    }

    if (!size) {
      const fallback = [
        { id: '2r', name: '2R', displayName: '2R (2.5 x 3.5 inches)', width: 2.5, height: 3.5, price: 0.50, description: 'Wallet size - Perfect for keepsakes' },
        { id: '3r', name: '3R', displayName: '3R (3.5 x 5 inches)', width: 3.5, height: 5, price: 0.75, description: 'Standard photo size - Great for albums' },
        { id: '4r', name: '4R', displayName: '4R (4 x 6 inches)', width: 4, height: 6, price: 1.00, description: 'Most popular - Classic polaroid style' },
        { id: 'a4', name: 'A4', displayName: 'A4 (8.3 x 11.7 inches)', width: 8.3, height: 11.7, price: 3.50, description: 'Poster size - Perfect for displays' },
      ].find(s => s.id === id);

      if (!fallback) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }
      size = fallback;
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
      tiktokVideos: meta?.tiktokVideos ?? [],
    };

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}
