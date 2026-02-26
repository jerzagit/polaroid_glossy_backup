import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/print-sizes - Get all available print sizes
export async function GET() {
  try {
    const printSizes = await db.printSize.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    // If no print sizes exist, seed them
    if (printSizes.length === 0) {
      const seededSizes = await seedPrintSizes();
      return NextResponse.json({ success: true, printSizes: seededSizes });
    }

    return NextResponse.json({ success: true, printSizes });
  } catch (error) {
    console.error('Error fetching print sizes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch print sizes' },
      { status: 500 }
    );
  }
}

async function seedPrintSizes() {
  const sizes = [
    {
      id: '2r',
      name: '2R',
      displayName: '2R (2.5 x 3.5 inches)',
      width: 2.5,
      height: 3.5,
      price: 0.50,
      description: 'Wallet size - Perfect for keepsakes'
    },
    {
      id: '3r',
      name: '3R',
      displayName: '3R (3.5 x 5 inches)',
      width: 3.5,
      height: 5,
      price: 0.75,
      description: 'Standard photo size - Great for albums'
    },
    {
      id: '4r',
      name: '4R',
      displayName: '4R (4 x 6 inches)',
      width: 4,
      height: 6,
      price: 1.00,
      description: 'Most popular - Classic polaroid style'
    },
    {
      id: 'a4',
      name: 'A4',
      displayName: 'A4 (8.3 x 11.7 inches)',
      width: 8.3,
      height: 11.7,
      price: 3.50,
      description: 'Poster size - Perfect for displays'
    }
  ];

  const created = await Promise.all(
    sizes.map(size => 
      db.printSize.create({
        data: size
      })
    )
  );

  return created;
}
