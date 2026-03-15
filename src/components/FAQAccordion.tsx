'use client';

import { Shield, Clock, Truck, MessageSquare } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const categoryIcons = [Clock, Truck, Shield, MessageSquare];

export function FAQAccordion() {
  const { t } = useLanguage();
  return (
    <Accordion type="single" collapsible className="space-y-4">
      {t.faqCategories.map((category, categoryIndex) => {
        const Icon = categoryIcons[categoryIndex] ?? MessageSquare;
        return (
          <Card key={categoryIndex} className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Icon className="w-6 h-6 text-primary" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                {category.faqs.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`} className="px-6">
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}
    </Accordion>
  );
}
