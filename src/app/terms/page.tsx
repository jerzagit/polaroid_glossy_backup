import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: June 2025</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Service</h2>
              <p className="text-muted-foreground">Polaroid Glossy MY provides photo printing services. By using our service, you agree to these terms.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Order & Payment</h2>
              <p className="text-muted-foreground">Payment is required at checkout. Orders are processed after payment confirmation. We accept FPX, card, and e-wallet payments via ToyyibPay.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Shipping & Delivery</h2>
              <p className="text-muted-foreground">Delivery times are estimates. We are not responsible for delays beyond our control. Shipping costs are non-refundable.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Refunds & Cancellations</h2>
              <p className="text-muted-foreground">Cancellations are accepted before order processing. Refunds for defective or damaged items are handled through our warranty process.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">User Conduct</h2>
              <p className="text-muted-foreground">You agree not to upload infringing, offensive, or illegal content. We reserve the right to refuse service.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Contact</h2>
              <p className="text-muted-foreground">For questions about these terms, email support@polaroidglossy.my.</p>
            </CardContent>
          </Card>

          <div className="text-center pt-6">
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
