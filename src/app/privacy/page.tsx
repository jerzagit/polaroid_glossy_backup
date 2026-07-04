import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
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
          <ShieldCheck className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-primary" />
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-xs md:text-base text-muted-foreground">Last updated: June 2025</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3">Information We Collect</h2>
              <p className="text-xs md:text-base text-muted-foreground">We collect information you provide directly: name, email address, shipping address, phone number, and photos you upload for printing.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3">How We Use Your Information</h2>
              <p className="text-xs md:text-base text-muted-foreground">We use your information to process orders, communicate with you about your orders, and improve our services. We do not sell your personal data.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3">Google Sign-In</h2>
              <p className="text-xs md:text-base text-muted-foreground">When you sign in with Google, we receive your name, email address, and profile picture. This is used only for authentication and order tracking.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3">Data Security</h2>
              <p className="text-xs md:text-base text-muted-foreground">We implement appropriate security measures to protect your personal information. Photos are stored securely and deleted after order fulfillment.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="text-base md:text-xl font-semibold mb-2 md:mb-3">Contact</h2>
              <p className="text-xs md:text-base text-muted-foreground">For privacy-related inquiries, contact us at support@polaroidglossy.my.</p>
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
