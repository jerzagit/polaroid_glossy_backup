'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Upload, Sparkles, Camera, Truck, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductCatalog } from '@/components/ProductCatalog';
import Link from 'next/link';

const FALLBACK_SIZES = [
  { id: '2r', name: '2R', displayName: '2R', width: 2.5, height: 3.5, price: 0.50 },
  { id: '3r', name: '3R', displayName: '3R', width: 3.5, height: 5, price: 0.75 },
  { id: '4r', name: '4R', displayName: '4R', width: 4, height: 6, price: 1.00 },
  { id: 'a4', name: 'A4', displayName: 'A4', width: 8.3, height: 11.7, price: 3.50 },
];

export default function ProductsPage() {
  const { t } = useLanguage();
  const [selectedSize, setSelectedSize] = useState(FALLBACK_SIZES[2]);

  const productVideos = t.videos.map((item, i) => ({
    ...item,
    thumbnail: ['/images/product-collection.png', '/images/product-printing.png', '/images/product-custom.png'][i],
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 py-2 flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 px-2 gap-1">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" /> <span className="text-xs">Home</span>
            </Link>
          </Button>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">PG</span>
            </div>
            <span className="text-xs font-bold">Polaroid Glossy MY</span>
          </div>
        </div>
      </header>

      {/* Product Showcase */}
      <section className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <Badge variant="secondary" className="mb-3"><Play className="w-3.5 h-3.5 mr-2" />{t.badge_showcase}</Badge>
            <h1 className="text-2xl font-bold mb-2">{t.videos_title}</h1>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">{t.videos_desc}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <Card className="overflow-hidden">
              <div className="relative aspect-video">
                <img src={productVideos[0].thumbnail} alt={productVideos[0].title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-primary ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-0.5 rounded text-xs">{productVideos[0].duration}</div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-base font-bold text-white">{productVideos[0].title}</h3>
                  <p className="text-xs text-white/80">{productVideos[0].description}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="grid gap-4 mb-6">
            {productVideos.slice(1).map((video, index) => (
              <motion.div key={video.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.1 }}>
                <Card className="overflow-hidden">
                  <div className="relative aspect-video">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-primary ml-1" fill="currentColor" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-[10px]">{video.duration}</div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm">{video.title}</h3>
                    <p className="text-xs text-muted-foreground">{video.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Process Steps */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
            <h3 className="text-base font-bold text-center mb-3">{t.process_title}</h3>
            <Card className="p-3">
              <div className="flex flex-col gap-2">
                {[{ step: 1, title: t.proc1_title, icon: Upload }, { step: 2, title: t.proc2_title, icon: Sparkles }, { step: 3, title: t.proc3_title, icon: Camera }, { step: 4, title: t.proc4_title, icon: Truck }].map((item, index) => (
                  <div key={item.step} className="flex items-center gap-2">
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <item.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-[9px]">{item.step}</div>
                    </div>
                    <span className="text-xs font-semibold">{item.title}</span>
                    {index < 3 && <ChevronRight className="ml-auto w-3 h-3 text-muted-foreground shrink-0" />}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Pricing / Product Catalog */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <h2 className="text-xl font-bold text-center mb-4">{t.pricing_title}</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">{t.pricing_desc}</p>
            <ProductCatalog onSelect={(size) => {
              setSelectedSize(size as typeof FALLBACK_SIZES[0]);
              window.location.href = '/';
            }} />
            <p className="text-center text-muted-foreground mt-4 text-xs">{t.shipping_note}</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function ChevronRight(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
