import { NextRequest } from 'next/server';
import { proxyOrFallback } from '@/lib/backend';

const FALLBACK_REVIEWS = [
  {
    id: '1', rating: 5, title: 'Amazing quality!',
    comment: 'The print quality is incredible. Colors are vibrant and the paper feels premium. Will definitely order again!',
    createdAt: '2024-12-15T10:30:00.000Z',
    user: { name: 'Sarah Mitchell', avatar: null }
  },
  {
    id: '2', rating: 5, title: 'Perfect for gifts',
    comment: 'Ordered these as anniversary gifts. The customization options made them extra special. Fast delivery too!',
    createdAt: '2024-12-10T14:20:00.000Z',
    user: { name: 'James Wilson', avatar: null }
  },
  {
    id: '3', rating: 5, title: 'Beautiful memories',
    comment: 'My grandma cried when she saw the photos. The A4 poster size is stunning. Thank you for the quality!',
    createdAt: '2024-12-05T09:15:00.000Z',
    user: { name: 'Margaret Chen', avatar: null }
  },
  {
    id: '4', rating: 4, title: 'Great for parties',
    comment: 'Ordered 50 prints for my daughter\'s birthday. Everyone loved taking home instant photos. Quick turnaround!',
    createdAt: '2024-11-28T16:45:00.000Z',
    user: { name: 'Lisa Kumar', avatar: null }
  },
];

function backendPath(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of ['sizeId', 'userId', 'orderId']) {
    const val = searchParams.get(key);
    if (val) params.set(key, val);
  }
  const qs = params.toString();
  return `reviews${qs ? `?${qs}` : ''}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isScoped = Boolean(searchParams.get('orderId') || searchParams.get('userId'));

  return proxyOrFallback(backendPath(searchParams), {
    fallback: { success: true, reviews: isScoped ? [] : FALLBACK_REVIEWS },
    fallbackWhen: ({ ok, data }) => {
      const payload = data as { success?: boolean; reviews?: unknown } | null;
      return !ok || !payload?.success || !Array.isArray(payload.reviews);
    },
  });
}
