'use client';

import { FAQAccordion } from '@/components/FAQAccordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FAQPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t.faq_page_title}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t.faq_page_desc}</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <FAQAccordion />
        </div>

        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-2">{t.faq_warranty_title}</h3>
              <p className="text-muted-foreground mb-6">{t.faq_warranty_desc}</p>
              <div className="flex justify-center gap-4">
                <Link href="/">
                  <Button size="lg">{t.btn_new_order_faq}</Button>
                </Link>
                <Button size="lg" variant="outline" asChild>
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
