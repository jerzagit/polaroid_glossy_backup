import { Card, CardContent } from '@/components/ui/card';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
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
          <FileText className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-primary" />
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-xs md:text-base text-muted-foreground">Last updated: June 2025</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3">Service</h2>
              <p className="text-muted-foreground">Polaroid Glossy MY provides photo printing services. By using our service, you agree to these terms.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3">Order & Payment</h2>
              <p className="text-xs md:text-base text-muted-foreground">Payment is required at checkout. Orders are processed after payment confirmation. We accept FPX, card, and e-wallet payments via ToyyibPay.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3">Shipping & Delivery</h2>
              <p className="text-xs md:text-base text-muted-foreground">Delivery times are estimates. We are not responsible for delays beyond our control. Shipping costs are non-refundable.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3">Refunds & Cancellations</h2>
              <p className="text-xs md:text-base text-muted-foreground">Cancellations are accepted before order processing. Refunds for defective or damaged items are handled through our warranty process.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3">User Conduct</h2>
              <p className="text-xs md:text-base text-muted-foreground">You agree not to upload infringing, offensive, or illegal content. We reserve the right to refuse service.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3">Contact</h2>
              <p className="text-xs md:text-base text-muted-foreground">For questions about these terms, email support@polaroidglossy.my.</p>
            </CardContent>
          </Card>

          <div className="text-center pt-4 md:pt-6">
            <Link href="/">
              <Button size="sm" className="w-full sm:w-auto">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
