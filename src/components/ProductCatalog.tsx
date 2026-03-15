'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Zap, CheckCircle2, Star,
  ChevronLeft, ChevronRight, Info, Ruler, Clock, Package2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProductListing } from '@/app/api/products/route';
import Link from 'next/link';

interface ProductCatalogProps {
  onSelect: (size: {
    id: string; name: string; displayName: string;
    width: number; height: number; price: number; description?: string;
  }) => void;
}

/* ---------- Skeleton ---------- */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden animate-pulse">
      <div className="bg-muted h-64 w-full" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-muted rounded w-1/4" />
        <div className="flex justify-between">
          <div className="h-7 bg-muted rounded w-1/3" />
          <div className="h-7 bg-muted rounded w-1/4" />
        </div>
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-4/5" />
        <div className="flex gap-2 mt-1">
          {[1, 2, 3].map(i => <div key={i} className="h-5 bg-muted rounded-full w-16" />)}
        </div>
        <div className="h-9 bg-muted rounded-lg mt-3" />
      </div>
    </div>
  );
}

/* ---------- Star rating ---------- */
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(s => (
          <Star
            key={s}
            className={cn('w-3.5 h-3.5', s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30')}
          />
        ))}
      </div>
      <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count.toLocaleString()})</span>
    </div>
  );
}

/* ---------- Image carousel ---------- */
function ImageCarousel({ images, name, accentColor }: { images: string[]; name: string; accentColor: string }) {
  const [idx, setIdx] = useState(0);

  const prev = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); };
  const next = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIdx(i => (i + 1) % images.length); };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={images[idx]}
          alt={`${name} – view ${idx + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35 }}
        />
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 110%, ${accentColor}33 0%, transparent 65%)` }}
      />

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(i); }}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === idx ? accentColor : 'rgba(255,255,255,0.4)', width: i === idx ? 18 : 6 }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Specs row ---------- */
function SpecsRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

/* ---------- Main card ---------- */
function ProductCard({ product, onSelect }: { product: ProductListing; onSelect: ProductCatalogProps['onSelect'] }) {
  const { t } = useLanguage();
  const [showSpecs, setShowSpecs] = useState(false);

  const sizeDescMap: Record<string, string> = {
    '2r': t.size_2r_desc,
    '3r': t.size_3r_desc,
    '4r': t.size_4r_desc,
    'a4': t.size_a4_desc,
  };

  return (
    <Link href={`/products/${product.id}`} className="relative group h-full block">
      {/* Animated glow border */}
      <div
        className={cn(
          "absolute -inset-[1.5px] rounded-2xl transition-opacity duration-400 blur-[2px]",
          product.popular ? "opacity-100" : "opacity-0 group-hover:opacity-70"
        )}
        style={{ background: `linear-gradient(135deg, ${product.accentColor}cc, ${product.accentColor}33, ${product.accentColor}cc)` }}
      />

      <div
        className={cn(
          "relative rounded-2xl border overflow-hidden h-full flex flex-col bg-card transition-shadow duration-300",
          product.popular ? "border-transparent" : "border-border group-hover:shadow-2xl"
        )}
      >
        {/* ── Image header ── */}
        <div className="relative h-56 overflow-hidden shrink-0">
          {/* Dark tech background behind image */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, #0f172a 0%, #1e293b 100%)`,
            }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(${product.accentColor} 1px, transparent 1px), linear-gradient(90deg, ${product.accentColor} 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }}
          />

          <ImageCarousel images={product.images} name={product.name} accentColor={product.accentColor} />

          {/* Tag chip */}
          <div className="absolute top-3 left-3 z-10">
            <span
              className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase"
              style={{ background: `${product.accentColor}33`, color: product.accentColor, border: `1px solid ${product.accentColor}55` }}
            >
              {product.tag}
            </span>
          </div>

          {/* Popular badge */}
          {product.popular && (
            <div className="absolute top-3 right-3 z-10">
              <motion.div animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}>
                <Sparkles className="w-5 h-5" style={{ color: product.accentColor }} />
              </motion.div>
            </div>
          )}

          {/* Dimension badge */}
          <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white/70 text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/10">
            {product.width}″ × {product.height}″
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 p-5 flex flex-col gap-3">

          {/* Name + Price */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-black tracking-tight leading-none">{product.name}</h3>
              <p className="text-[11px] font-mono text-muted-foreground mt-1">{product.specs.dimensions}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-black leading-none" style={{ color: product.accentColor }}>
                RM{product.price.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">{t.per_print}</p>
            </div>
          </div>

          {/* Star rating */}
          <StarRating rating={product.rating} count={product.reviewCount} />

          {/* Short description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{sizeDescMap[product.id] ?? product.shortDescription}</p>

          {/* Full description toggle */}
          <div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSpecs(s => !s); }}
              className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              style={{ color: showSpecs ? product.accentColor : undefined }}
            >
              <Info className="w-3 h-3" />
              {showSpecs ? 'Hide details' : 'Full description & specs'}
            </button>
            <AnimatePresence>
              {showSpecs && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2 mb-3">{product.fullDescription}</p>
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <SpecsRow icon={Ruler} label="Size" value={product.specs.dimensions} />
                    <SpecsRow icon={Package2} label="Paper" value={product.specs.paper} />
                    <SpecsRow icon={Sparkles} label="Finish" value={product.specs.finish} />
                    <SpecsRow icon={Zap} label="Method" value={product.specs.printMethod} />
                    <SpecsRow icon={Clock} label="Processing" value={product.specs.processingTime} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-1.5">
            {product.features.map(feat => (
              <span
                key={feat}
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${product.accentColor}18`, color: product.accentColor, border: `1px solid ${product.accentColor}30` }}
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                {feat}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-auto">
            <Button
              className="w-full font-bold group/btn"
              style={product.popular ? {
                background: `linear-gradient(135deg, ${product.accentColor}, ${product.accentColor}bb)`,
                boxShadow: `0 4px 24px ${product.accentColor}50`,
                border: 'none',
              } : {}}
              variant={product.popular ? 'default' : 'outline'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect({
                  id: product.id,
                  name: product.name,
                  displayName: product.displayName,
                  width: product.width,
                  height: product.height,
                  price: product.price,
                  description: product.description,
                });
              }}
            >
              {t.btn_getstarted}
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ---------- Catalog ---------- */
export function ProductCatalog({ onSelect }: ProductCatalogProps) {
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { if (data.success) setProducts(data.products); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Zap className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Failed to load products. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1, duration: 0.45 }}
          className="h-full"
        >
          <ProductCard product={product} onSelect={onSelect} />
        </motion.div>
      ))}
    </div>
  );
}
