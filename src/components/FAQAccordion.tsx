'use client';

import { Shield, Clock, Truck, MessageSquare } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const faqData = [
  {
    title: 'Order & Processing',
    icon: Clock,
    faqs: [
      {
        question: 'How long does it take to process an order?',
        answer: 'All orders take 3-4 working days to process. Please note that we do not accommodate fussy buyers or urgent orders. We take our time to ensure each print is made with care and attention to detail.'
      },
      {
        question: 'How do I place an order?',
        answer: 'Simply upload your photos, select your preferred print size and quantity, add any custom text if desired, and proceed to checkout. You can pay using your preferred payment method.'
      },
      {
        question: 'Can I modify my order after placing it?',
        answer: 'Once an order is placed, it enters processing immediately. Please double-check your photos and details before completing your order as modifications are not possible after submission.'
      },
      {
        question: 'Can I cancel my order?',
        answer: 'NO CANCELLATION will be made once the order is created. Please ensure all details are correct before placing your order. We begin processing immediately after order confirmation.'
      }
    ]
  },
  {
    title: 'Shipping & Delivery',
    icon: Truck,
    faqs: [
      {
        question: 'How will my order be shipped?',
        answer: 'All orders are shipped via registered mail with tracking number. You will receive your tracking number once your order is dispatched.'
      },
      {
        question: 'Do you offer international shipping?',
        answer: 'Currently, we only ship within Malaysia. For international orders, please contact us to discuss arrangements.'
      }
    ]
  },
  {
    title: 'Warranty & Claims',
    icon: Shield,
    faqs: [
      {
        question: 'What is covered under warranty?',
        answer: 'Our warranty covers manufacturing defects such as printing errors, damage during shipping, or quality issues with the materials used. We ensure every print meets our quality standards.'
      },
      {
        question: 'How do I claim warranty?',
        answer: 'To claim warranty, please contact us with your order number and description of the issue. We may request photos of the damaged or defective print for assessment. Valid claims will be replaced or refunded.'
      },
      {
        question: 'What is not covered under warranty?',
        answer: 'Warranty does not cover damage caused by customer handling, color variations due to monitor settings, or issues arising from low-quality source images provided by the customer.'
      },
      {
        question: 'How long is the warranty period?',
        answer: 'Warranty claims must be made within 7 days of receiving your order. Please inspect your order immediately upon delivery and report any issues promptly.'
      }
    ]
  },
  {
    title: 'Customization',
    icon: MessageSquare,
    faqs: [
      {
        question: 'Can I add custom text to my polaroid?',
        answer: 'Yes! You can add custom text to each photo during the ordering process. The text will be printed at the bottom of your polaroid.'
      },
      {
        question: 'What file formats do you accept?',
        answer: 'We accept JPG, PNG, and WEBP formats. For best results, we recommend using high-resolution images (at least 1000x1000 pixels).'
      }
    ]
  }
];

export function FAQAccordion() {
  return (
    <Accordion type="single" collapsible className="space-y-4">
      {faqData.map((category, categoryIndex) => (
        <Card key={categoryIndex} className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-3 text-xl">
              <category.icon className="w-6 h-6 text-primary" />
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
      ))}
    </Accordion>
  );
}
