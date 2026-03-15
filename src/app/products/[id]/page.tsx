'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, CheckCircle2, Sparkles, Ruler, Clock, Package2,
  Zap, ChevronLeft, ChevronRight, ShoppingCart, ExternalLink,
  MessageSquare, Shield, Truck, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

/* ─── Types ─── */
interface ProductSpecs {
  dimensions: string; paper: string; finish: string;
  printMethod: string; processingTime: string; minQty: number;
}
interface TikTokVideo { videoId: string; url: string; caption: string; }
interface ProductDetail {
  id: string; name: string; displayName: string;
  width: number; height: number; price: number;
  description: string; shortDescription: string; fullDescription: string;
  images: string[]; popular: boolean; tag: string;
  features: string[]; accentColor: string;
  specs: ProductSpecs; rating: number; reviewCount: number;
  tiktokVideos: TikTokVideo[];
}
interface Review {
  id: string; rating: number; title: string; comment: string;
  createdAt: string; user?: { name: string | null; avatar: string | null };
}

/* ─── Star rating ─── */
function StarRating({ rating, count, large }: { rating: number; count: number; large?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} className={cn(large ? 'w-5 h-5' : 'w-4 h-4',
            s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')} />
        ))}
      </div>
      <span className={cn('font-bold', large ? 'text-lg' : 'text-sm')}>{rating.toFixed(1)}</span>
      <span className="text-muted-foreground text-sm">({count.toLocaleString()} reviews)</span>
    </div>
  );
}

/* ─── Image gallery ─── */
function ImageGallery({ images, name, accentColor }: { images: string[]; name: string; accentColor: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: `linear-gradient(${accentColor} 1px,transparent 1px),linear-gradient(90deg,${accentColor} 1px,transparent 1px)`, backgroundSize: '28px 28px' }} />
        <AnimatePresence mode="wait">
          <motion.img key={active} src={images[active]} alt={`${name} view ${active + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3 }} />
        </AnimatePresence>
        {images.length > 1 && (
          <>
            <button onClick={() => setActive(i => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 z-10">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setActive(i => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 z-10">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-xs font-mono px-2.5 py-1 rounded-full">
          {active + 1} / {images.length}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((img, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={cn('shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all',
              i === active ? 'scale-105' : 'border-border opacity-60 hover:opacity-100')}
            style={i === active ? { borderColor: accentColor } : {}}>
            <img src={img} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── TikTok embed ─── */
function TikTokEmbed({ video, viewLabel }: { video: TikTokVideo; viewLabel: string }) {
  useEffect(() => {
    const existing = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
    if (!existing) {
      const s = document.createElement('script');
      s.src = 'https://www.tiktok.com/embed.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <blockquote className="tiktok-embed" cite={video.url}
        data-video-id={video.videoId} style={{ maxWidth: 325, minWidth: 325 }}>
        <section>
          <a href={video.url} target="_blank" rel="noopener noreferrer">{video.caption}</a>
        </section>
      </blockquote>
      <a href={video.url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ExternalLink className="w-3 h-3" /> {viewLabel}
      </a>
    </div>
  );
}

/* ─── Review card ─── */
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} className={cn('w-3.5 h-3.5', s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')} />
        ))}
      </div>
      <p className="font-semibold text-sm">{review.title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
      <div className="flex items-center gap-2 pt-1">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
          {(review.user?.name ?? 'A')[0].toUpperCase()}
        </div>
        <span className="text-xs text-muted-foreground">{review.user?.name ?? 'Anonymous'}</span>
        <span className="text-xs text-muted-foreground ml-auto">{new Date(review.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

/* ─── TikTok icon ─── */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.84a8.17 8.17 0 0 0 4.78 1.52V6.91a4.85 4.85 0 0 1-1.01-.22z" />
    </svg>
  );
}

type Tab = 'description' | 'specs' | 'reviews' | 'tiktok';

/* ─── Page ─── */
export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();
  const id = params.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('description');

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${id}`).then(r => r.json()),
      fetch('/api/reviews').then(r => r.json()),
    ]).then(([pData, rData]) => {
      if (pData.success) setProduct(pData.product);
      if (rData.success) setReviews(rData.reviews);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-5xl px-6">
          <div className="h-8 bg-muted rounded w-32 animate-pulse" />
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-[4/3] bg-muted rounded-2xl animate-pulse" />
            <div className="space-y-4">
              {[80, 60, 100, 50, 70].map((w, i) => (
                <div key={i} className="h-6 bg-muted rounded animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
        <p className="text-xl font-semibold">{t.prod_not_found}</p>
        <Button onClick={() => router.push('/')}>{t.btn_back_home}</Button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'description', label: t.tab_description, Icon: Info },
    { id: 'specs', label: t.tab_specs, Icon: Ruler },
    { id: 'reviews', label: `${t.tab_reviews} (${reviews.length})`, Icon: MessageSquare },
    { id: 'tiktok', label: t.tab_tiktok, Icon: TikTokIcon },
  ];

  const sizeDescMap: Record<string, string> = {
    '2r': t.size_2r_desc, '3r': t.size_3r_desc, '4r': t.size_4r_desc, 'a4': t.size_a4_desc,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> {t.btn_back}
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-1">
            <Link href="/" className="hover:text-foreground transition-colors">{t.nav_home}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{product.name} {t.label_print}</span>
          </nav>
          {/* ENG / MY toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden text-xs font-semibold">
            <button
              className={cn('px-2.5 py-1 transition-colors', lang === 'en' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              onClick={() => setLang('en')}
            >ENG</button>
            <button
              className={cn('px-2.5 py-1 transition-colors', lang === 'my' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              onClick={() => setLang('my')}
            >MY</button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ── Hero ── */}
        <div className="grid lg:grid-cols-2 gap-10 mb-16">
          {/* Gallery */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <ImageGallery images={product.images} name={product.name} accentColor={product.accentColor} />
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }} className="lg:sticky lg:top-20 space-y-5 self-start">

            {/* Tag + popular */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black tracking-widest px-3 py-1 rounded-full uppercase"
                style={{ background: `${product.accentColor}22`, color: product.accentColor, border: `1px solid ${product.accentColor}44` }}>
                {product.tag}
              </span>
              {product.popular && (
                <Badge className="gap-1 animate-pulse" style={{ background: product.accentColor }}>
                  <Sparkles className="w-3 h-3" /> {t.prod_bestseller}
                </Badge>
              )}
            </div>

            {/* Name */}
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                {product.name} <span className="text-muted-foreground font-normal text-2xl">Print</span>
              </h1>
              <p className="text-muted-foreground mt-1">{product.displayName}</p>
            </div>

            {/* Rating */}
            <StarRating rating={product.rating} count={product.reviewCount} />

            {/* Price */}
            <div className="text-5xl font-black" style={{ color: product.accentColor }}>
              RM{product.price.toFixed(2)}
              <span className="text-lg font-normal text-muted-foreground ml-2">{t.per_print}</span>
            </div>

            {/* Short desc */}
            <p className="text-muted-foreground leading-relaxed">{sizeDescMap[product.id] ?? product.shortDescription}</p>

            {/* Features */}
            <div className="flex flex-wrap gap-2">
              {product.features.map(f => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: `${product.accentColor}18`, color: product.accentColor, border: `1px solid ${product.accentColor}33` }}>
                  <CheckCircle2 className="w-3 h-3" />{f}
                </span>
              ))}
            </div>

            <Separator />

            {/* Quick specs */}
            <div className="space-y-2">
              {[
                { Icon: Ruler, label: 'Size', value: product.specs.dimensions },
                { Icon: Package2, label: 'Paper', value: product.specs.paper },
                { Icon: Clock, label: 'Processing', value: product.specs.processingTime },
                { Icon: Truck, label: 'Shipping', value: 'RM7 (West) · RM11 (East)' },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <Button size="lg" className="w-full text-base font-bold gap-2 h-12"
                style={{ background: `linear-gradient(135deg,${product.accentColor},${product.accentColor}bb)`, boxShadow: `0 4px 20px ${product.accentColor}40`, border: 'none' }}
                onClick={() => router.push(`/?product=${product.id}`)}>
                <ShoppingCart className="w-5 h-5" /> {t.btn_start} — {product.name}
              </Button>
              <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> {t.prod_quality_guarantee}
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Tabs ── */}
        <div>
          <div className="flex gap-1 border-b mb-8 overflow-x-auto">
            {tabs.map(({ id: tabId, label, Icon }) => (
              <button key={tabId} onClick={() => setActiveTab(tabId)}
                className={cn('flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors',
                  activeTab === tabId ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
                style={activeTab === tabId ? { borderColor: product.accentColor, color: product.accentColor } : {}}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>

              {/* Description */}
              {activeTab === 'description' && (
                <div className="max-w-3xl space-y-6">
                  <p className="text-foreground leading-relaxed text-base">{product.fullDescription}</p>
                  <div className="rounded-xl p-5 border space-y-3"
                    style={{ background: `${product.accentColor}08`, borderColor: `${product.accentColor}30` }}>
                    <h3 className="font-bold flex items-center gap-2" style={{ color: product.accentColor }}>
                      <Zap className="w-4 h-4" /> {t.prod_what_makes(product.name)}
                    </h3>
                    <ul className="space-y-2">
                      {product.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: product.accentColor }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Specs */}
              {activeTab === 'specs' && (
                <div className="max-w-2xl">
                  <div className="rounded-xl border overflow-hidden">
                    {[
                      [t.spec_size, product.specs.dimensions],
                      [t.spec_paper, product.specs.paper],
                      [t.spec_finish, product.specs.finish],
                      [t.spec_method, product.specs.printMethod],
                      [t.spec_processing, product.specs.processingTime],
                      [t.spec_min_qty, `${product.specs.minQty} ${t.spec_print}`],
                      [t.spec_custom_text, t.spec_custom_text_value],
                      [t.spec_file_formats, 'JPG, PNG, WEBP, HEIC'],
                      [t.spec_max_size, '25MB per photo'],
                    ].map(([label, value], i) => (
                      <div key={label} className={cn('flex gap-4 px-5 py-3 text-sm', i % 2 === 0 ? 'bg-muted/30' : 'bg-background')}>
                        <span className="text-muted-foreground w-36 shrink-0">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-8 p-6 rounded-xl border bg-card flex-wrap">
                    <div className="text-center">
                      <p className="text-6xl font-black" style={{ color: product.accentColor }}>{product.rating.toFixed(1)}</p>
                      <StarRating rating={product.rating} count={product.reviewCount} />
                    </div>
                    <div className="flex-1 min-w-48 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(star => {
                        const pct = star === 5 ? 72 : star === 4 ? 18 : star === 3 ? 6 : star === 2 ? 3 : 1;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-4 text-right text-muted-foreground">{star}</span>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: product.accentColor }} />
                            </div>
                            <span className="w-7 text-muted-foreground">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>{t.prod_no_reviews}</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                    </div>
                  )}
                </div>
              )}

              {/* TikTok */}
              {activeTab === 'tiktok' && (
                <div className="space-y-6">
                  <div className="rounded-xl border bg-muted/30 p-4 flex items-start gap-3 text-sm">
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">{t.prod_tiktok_title}</p>
                      <p>{t.prod_tiktok_desc} <strong>@polaroidglossymy</strong> {t.prod_tiktok_tag}</p>
                    </div>
                  </div>
                  {product.tiktokVideos.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <TikTokIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>{t.prod_no_tiktok}</p>
                      <p className="text-xs mt-1">{t.prod_no_tiktok_tag}</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                      {product.tiktokVideos.map(video => <TikTokEmbed key={video.videoId} video={video} viewLabel={t.prod_view_tiktok} />)}
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
