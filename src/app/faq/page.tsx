'use client';

import { FAQAccordion } from '@/components/FAQAccordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FAQPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 md:h-9 px-2 gap-1">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" /> <span className="text-xs md:text-sm">Home</span>
            </Link>
          </Button>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-[10px] md:text-xs font-bold text-white">PG</span>
            </div>
            <span className="text-xs md:text-sm font-bold">Polaroid Glossy MY</span>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-12">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">{t.faq_page_title}</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">{t.faq_page_desc}</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <FAQAccordion />
        </div>

        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 md:p-8 text-center">
              <Shield className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-primary" />
              <h3 className="text-lg md:text-2xl font-bold mb-2">{t.faq_warranty_title}</h3>
              <p className="text-xs md:text-base text-muted-foreground mb-4 md:mb-6">{t.faq_warranty_desc}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link href="/">
                  <Button size="sm" className="w-full sm:w-auto">{t.btn_new_order_faq}</Button>
                </Link>
                <Button size="sm" variant="outline" asChild className="w-full sm:w-auto">
                  <a href="mailto:support@polaroidglossy.my">{t.btn_contact}</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
