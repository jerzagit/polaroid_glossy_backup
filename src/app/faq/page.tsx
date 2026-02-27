import { FAQAccordion } from '@/components/FAQAccordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our polaroid printing service, shipping, and warranty claims.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <FAQAccordion />
        </div>

        <div className="max-w-4xl mx-auto mt-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-2">Need to Claim Warranty?</h3>
              <p className="text-muted-foreground mb-6">
                If you have received a defective or damaged product, please contact us to initiate a warranty claim.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/">
                  <Button size="lg">
                    Place New Order
                  </Button>
                </Link>
                <Button size="lg" variant="outline" asChild>
                  <a href="mailto:support@polaroidglossy.my">
                    Contact Support
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
