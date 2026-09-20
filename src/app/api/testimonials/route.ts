import { proxyOrFallback } from '@/lib/backend';

const FALLBACK_TESTIMONIALS = [
  { id: 1, name: 'Sarah Mitchell', location: 'New York, USA', text: 'Absolutely love my polaroid prints! The quality is amazing and they arrived so quickly. Perfect for my scrapbook!', printType: '4R Classic', imageUrl: '/images/customer-1.png', rating: 5 },
  { id: 2, name: 'James & Emily', location: 'London, UK', text: "We ordered prints for our anniversary and couldn't be happier. The custom text feature made them extra special!", printType: 'Mixed Sizes', imageUrl: '/images/customer-2.png', rating: 5 },
  { id: 3, name: 'Margaret & Tommy', location: 'Sydney, Australia', text: 'My grandson and I love looking through our polaroid memories together. Thank you for such beautiful quality!', printType: 'A4 Poster', imageUrl: '/images/customer-3.png', rating: 5 },
  { id: 4, name: 'Party Squad', location: 'Toronto, Canada', text: "Ordered 50 prints for our friend's birthday party. Everyone loved taking home a memory! Great prices too.", printType: '3R Standard', imageUrl: '/images/customer-4.png', rating: 5 },
];

export async function GET() {
  return proxyOrFallback('testimonials', {
    fallback: { success: true, testimonials: FALLBACK_TESTIMONIALS },
    fallbackWhen: ({ ok, data }) => {
      const payload = data as { success?: boolean; testimonials?: unknown } | null;
      return !ok || !payload?.success || !Array.isArray(payload.testimonials);
    },
  });
}
