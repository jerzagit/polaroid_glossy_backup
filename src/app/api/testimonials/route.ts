import { NextResponse } from 'next/server';

const BACKEND_API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_BASE || 'http://localhost:8080';
const API_BASE = `${BACKEND_API_BASE.replace(/\/+$/, '')}/api`;

const FALLBACK_TESTIMONIALS = [
  { id: 1, name: 'Sarah Mitchell', location: 'New York, USA', text: 'Absolutely love my polaroid prints! The quality is amazing and they arrived so quickly. Perfect for my scrapbook!', printType: '4R Classic', imageUrl: '/images/customer-1.png', rating: 5 },
  { id: 2, name: 'James & Emily', location: 'London, UK', text: "We ordered prints for our anniversary and couldn't be happier. The custom text feature made them extra special!", printType: 'Mixed Sizes', imageUrl: '/images/customer-2.png', rating: 5 },
  { id: 3, name: 'Margaret & Tommy', location: 'Sydney, Australia', text: 'My grandson and I love looking through our polaroid memories together. Thank you for such beautiful quality!', printType: 'A4 Poster', imageUrl: '/images/customer-3.png', rating: 5 },
  { id: 4, name: 'Party Squad', location: 'Toronto, Canada', text: "Ordered 50 prints for our friend's birthday party. Everyone loved taking home a memory! Great prices too.", printType: '3R Standard', imageUrl: '/images/customer-4.png', rating: 5 },
];

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/testimonials`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.testimonials)) {
        return NextResponse.json(data);
      }
    }
  } catch { /* fall through */ }

  return NextResponse.json({ success: true, testimonials: FALLBACK_TESTIMONIALS });
}
