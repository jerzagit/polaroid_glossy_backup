'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  ShoppingCart, 
  Upload, 
  Check, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  Truck, 
  Clock,
  Star,
  Image as _ImageIcon,
  ChevronRight,
  Sparkles,
  Heart,
  Package,
  ArrowRight,
  Trash2,
  Zap,
  Shield,
  RefreshCw,
  Play,
  Quote,
  Users,
  ChevronLeft,
  User,
  LogIn,
  LogOut,
  Settings,
  PackageOpen,
  MessageSquare,
  Search,
  Copy,
  PackageCheck,
  XCircle,
  RefreshCwIcon,
  CheckCircle,
  ClockIcon,
  TruckIcon,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage, WHATSAPP_HD_SETTINGS } from '@/lib/imageCompression';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductCatalog } from '@/components/ProductCatalog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types
interface PrintSize {
  id: string;
  name: string;
  displayName: string;
  width: number;
  height: number;
  price: number;
  description?: string;
}

interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  customText?: string;
}

interface CartItem {
  id: string;
  sizeId: string;
  size: PrintSize;
  quantity: number;
  photos: PhotoItem[];
  unitPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  statusHistory?: StatusHistory[];
}

interface OrderItem {
  id: string;
  size: PrintSize;
  quantity: number;
  images: string;
  totalPrice: number;
}

interface StatusHistory {
  status: string;
  message?: string;
  createdAt: string;
}

interface Review {
  id: string;
  userId: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  user?: {
    name: string | null;
    avatar: string | null;
  };
}

const malaysiaStates = [
  { id: 'w', name: 'West Malaysia (Semenanjung)', shippingCost: 7 },
  { id: 'e_sabah', name: 'Sabah', shippingCost: 11 },
  { id: 'e_sarawak', name: 'Sarawak', shippingCost: 11 },
];

const getShippingCost = (stateId: string): number => {
  const state = malaysiaStates.find(s => s.id === stateId);
  return state ? state.shippingCost : 11;
};

export default function PolaroidPrintPage() {
  const { lang, setLang, t } = useLanguage();
  const { user, profile, loading: authLoading, signInWithGoogle, signOut } = useAuth();

  // Derived from translations
  const printSizes: PrintSize[] = [
    { id: '2r', name: '2R', displayName: t.size_2r_display, width: 2.5, height: 3.5, price: 0.50, description: t.size_2r_desc },
    { id: '3r', name: '3R', displayName: t.size_3r_display, width: 3.5, height: 5, price: 0.75, description: t.size_3r_desc },
    { id: '4r', name: '4R', displayName: t.size_4r_display, width: 4, height: 6, price: 1.00, description: t.size_4r_desc },
    { id: 'a4', name: 'A4', displayName: t.size_a4_display, width: 8.3, height: 11.7, price: 3.50, description: t.size_a4_desc },
  ];
  const customerTestimonials = t.testimonials.map((item, i) => ({
    ...item,
    image: `/images/customer-${i + 1}.png`,
    rating: 5,
  }));
  const productVideos = t.videos.map((item, i) => ({
    ...item,
    thumbnail: ['/images/product-collection.png', '/images/product-printing.png', '/images/product-custom.png'][i],
  }));
  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: t.status_pending, color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    processing: { label: t.status_processing, color: 'bg-blue-100 text-blue-800', icon: Loader2 },
    posted: { label: t.status_posted, color: 'bg-purple-100 text-purple-800', icon: Package },
    on_delivery: { label: t.status_on_delivery, color: 'bg-indigo-100 text-indigo-800', icon: Truck },
    delivered: { label: t.status_delivered, color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: t.status_cancelled, color: 'bg-red-100 text-red-800', icon: XCircle },
    refunded: { label: t.status_refunded, color: 'bg-gray-100 text-gray-800', icon: RefreshCwIcon },
  };
  
  // State
  const [currentStep, setCurrentStep] = useState(-1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSize, setSelectedSize] = useState<PrintSize>(printSizes[2]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  // Modals
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showOAuthErrorModal, setShowOAuthErrorModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  
  // Data
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'toyyibpay'>('bank_transfer');
  
  // Form
  const [orderFormData, setOrderFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerState: 'w',
    notes: ''
  });
  
  // Review form
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const cartTotal = cart.reduce((sum, item) => sum + item.size.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPhotos = cart.reduce((sum, item) => sum + item.photos.length * item.quantity, 0);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('polaroid_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem('polaroid_cart');
      }
    }
  }, []);

  // Check for OAuth error or product deep-link in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // ?product=4r → pre-select size and open upload step
    const productId = urlParams.get('product');
    if (productId) {
      const match = printSizes.find(s => s.id === productId);
      if (match) setSelectedSize(match);
      setCurrentStep(0);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const error = urlParams.get('error');
    if (error === 'OAuthSignin' || error === 'OAuthCallback' || error === 'OAuthCreateAccount') {
      setShowOAuthErrorModal(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('polaroid_cart', JSON.stringify(cart));
  }, [cart]);

  // Load user orders
  useEffect(() => {
    if (user && showOrdersModal) {
      fetchUserOrders();
    }
  }, [user, showOrdersModal]);

  // Load reviews
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchUserOrders = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/orders?userId=${profile?.id}`);
      const data = await response.json();
      if (data.success) {
        setUserOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileCount = files.length;
    
    const processFile = async (file: File): Promise<PhotoItem> => {
      try {
        const compressedFile = await compressImage(file, WHATSAPP_HD_SETTINGS);
        
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              file: compressedFile,
              preview: event.target?.result as string,
              customText: ''
            });
          };
          reader.onerror = () => {
            resolve({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              file,
              preview: '',
              customText: ''
            });
          };
          reader.readAsDataURL(compressedFile);
        });
      } catch (error) {
        // Re-throw so Promise.allSettled can track this file as failed
        throw error;
      }
    };

    try {
      const results = await Promise.allSettled(Array.from(files).map(processFile));
      const processedPhotos = results
        .filter((r): r is PromiseFulfilledResult<PhotoItem> => r.status === 'fulfilled')
        .map(r => r.value);
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (processedPhotos.length > 0) {
        setPhotos(prev => [...prev, ...processedPhotos]);
        toast.success(t.toast_photos_added(processedPhotos.length));
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} file(s) could not be processed. HEIC/HEIF may not be supported on this browser.`);
      }
    } catch (error) {
      toast.error(t.toast_compress_fail);
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }, []);

  const updatePhotoText = useCallback((photoId: string, text: string) => {
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, customText: text } : p
    ));
  }, []);

  const addToCart = useCallback(() => {
    if (photos.length === 0) {
      toast.error(t.toast_no_photo);
      return;
    }

    const newItem: CartItem = {
      id: Date.now().toString(),
      sizeId: selectedSize.id,
      size: selectedSize,
      quantity,
      photos: photos.map(p => ({
        ...p,
        preview: p.preview // Keep the base64 preview
      })),
      unitPrice: selectedSize.price
    };

    setCart(prev => [...prev, newItem]);
    toast.success(t.toast_cart_added(photos.length, quantity));
    
    // Reset
    setPhotos([]);
    setQuantity(1);
    setCurrentStep(2);
  }, [photos, selectedSize, quantity]);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    toast.success(t.toast_removed);
  }, []);

  const updateCartQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  }, []);

  const handleCheckout = useCallback(async () => {
    console.log('handleCheckout clicked, paymentMethod:', paymentMethod);
    
    if (!orderFormData.customerName || !orderFormData.customerEmail) {
      toast.error(t.toast_fill_required);
      return;
    }

    if (!orderFormData.customerState) {
      toast.error(t.toast_select_state);
      return;
    }

    const shippingCost = getShippingCost(orderFormData.customerState);
    setIsProcessing(true);

    console.log('Starting checkout with paymentMethod:', paymentMethod);

    try {
      const items = cart.map(item => ({
        sizeId: item.sizeId,
        quantity: item.quantity,
        images: item.photos.map(p => p.preview),
        customTexts: item.photos.map(p => p.customText || ''),
        unitPrice: item.unitPrice
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.id,
          ...orderFormData,
          items,
          subtotal: cartTotal,
          shipping: shippingCost,
          total: cartTotal + shippingCost,
          paymentMethod
        })
      });

      const data = await response.json();
      console.log('Order API response:', data);

      if (data.success) {
        if (paymentMethod === 'toyyibpay') {
          console.log('Creating ToyyibPay bill...');
          const billResponse = await fetch('/api/toyyibpay/create-bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.order.id,
              orderNumber: data.order.orderNumber,
              amount: cartTotal + shippingCost,
              customerEmail: orderFormData.customerEmail,
              customerName: orderFormData.customerName,
              customerPhone: orderFormData.customerPhone
            })
          });

          const billData = await billResponse.json();
          console.log('ToyyibPay bill response:', billData);

          if (billData.success && billData.paymentUrl) {
            setOrderNumber(data.order.orderNumber);
            setCart([]);
            localStorage.removeItem('polaroid_cart');
            window.location.href = billData.paymentUrl;
            return;
          } else {
            console.error('Bill creation failed:', billData);
            throw new Error(billData.error || 'Failed to create payment');
          }
        }

        setOrderNumber(data.order.orderNumber);
        setOrderComplete(true);
        setCurrentStep(4);
        setCart([]);
        localStorage.removeItem('polaroid_cart');
        toast.success(t.toast_order_success);
      } else {
        console.error('Order creation failed:', data);
        throw new Error(data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t.toast_order_fail);
    } finally {
      setIsProcessing(false);
    }
  }, [orderFormData, cart, cartTotal, profile?.id, paymentMethod]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders?orderId=${orderId}&reason=Customer requested cancellation`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(t.toast_cancel_success);
        fetchUserOrders();
      } else {
        toast.error(data.error || t.toast_cancel_fail);
      }
    } catch {
      toast.error(t.toast_cancel_fail);
    }
  }, [fetchUserOrders]);

  const handleTrackOrder = useCallback(async () => {
    if (!trackingInput.trim()) {
      toast.error(t.toast_enter_order);
      return;
    }

    try {
      const response = await fetch(`/api/orders?orderNumber=${trackingInput}`);
      const data = await response.json();
      
      if (data.success && data.order) {
        setTrackingOrder(data.order);
      } else {
        toast.error(t.toast_not_found);
      }
    } catch {
      toast.error(t.toast_track_fail);
    }
  }, [trackingInput]);

  const handleSubmitReview = useCallback(async () => {
    if (!selectedOrderForReview || !profile) return;
    
    if (!reviewForm.title || !reviewForm.comment) {
      toast.error(t.toast_fill_all);
      return;
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          orderId: selectedOrderForReview.id,
          sizeId: selectedOrderForReview.items[0]?.size.id,
          ...reviewForm
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(t.toast_review_success);
        setShowReviewModal(false);
        setSelectedOrderForReview(null);
        setReviewForm({ rating: 5, title: '', comment: '' });
        fetchReviews();
        fetchUserOrders();
      } else {
        toast.error(data.error || t.toast_review_fail);
      }
    } catch {
      toast.error(t.toast_review_fail);
    }
  }, [selectedOrderForReview, profile, reviewForm, fetchReviews, fetchUserOrders]);

  const handleCopyTrackingNumber = useCallback((trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    toast.success(t.toast_tracking_copied);
  }, []);

  // Render functions
  const renderHeroSection = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 rounded-3xl" />
      <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-12 lg:py-20 px-6 lg:px-12">
        <div className="space-y-6 text-center lg:text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 mr-2" /> {t.badge_premium}
            </Badge>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            {t.hero_title1}{' '}<span className="text-primary">{t.hero_title2}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
            {t.hero_desc}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button size="lg" className="text-lg px-8" onClick={() => setCurrentStep(0)}>
              {t.btn_start} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8" onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}>
              {t.btn_pricing}
            </Button>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center justify-center lg:justify-start gap-8 pt-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">{[1, 2, 3, 4].map((i) => (<div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary border-2 border-background" />))}</div>
              <span className="text-sm text-muted-foreground">{t.hero_customers}</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />))}
              <span className="text-sm text-muted-foreground ml-1">4.9/5</span>
            </div>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="relative flex justify-center">
          <div className="relative">
            <img src="/images/hero-polaroids.png" alt="Beautiful polaroid prints" className="w-full max-w-lg rounded-2xl shadow-2xl" />
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="absolute -left-4 top-1/4 bg-card shadow-lg rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.hero_delivery_title}</p>
                  <p className="text-xs text-muted-foreground">{t.hero_delivery_sub}</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="absolute -right-4 bottom-1/4 bg-card shadow-lg rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.hero_quality_title}</p>
                  <p className="text-xs text-muted-foreground">{t.hero_quality_sub}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderFeaturesSection = () => (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t.features_title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t.features_desc}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: t.feat1_title, description: t.feat1_desc },
            { icon: Shield, title: t.feat2_title, description: t.feat2_desc },
            { icon: Heart, title: t.feat3_title, description: t.feat3_desc },
            { icon: Truck, title: t.feat4_title, description: t.feat4_desc },
            { icon: RefreshCw, title: t.feat5_title, description: t.feat5_desc },
            { icon: Sparkles, title: t.feat6_title, description: t.feat6_desc }
          ].map((feature, index) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderCustomerGallery = () => (
    <section className="py-16 px-6 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <Badge variant="secondary" className="mb-4"><Users className="w-3.5 h-3.5 mr-2" />{t.badge_happy}</Badge>
          <h2 className="text-3xl font-bold mb-4">{t.gallery_title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t.gallery_desc}</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {customerTestimonials.map((testimonial, index) => (
            <motion.div key={testimonial.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <Card className="h-full hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <img src={testimonial.image} alt={testimonial.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" />
                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{testimonial.printType}</div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">{[...Array(testimonial.rating)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />))}</div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="mt-4 relative">
                    <Quote className="absolute -top-2 -left-1 w-6 h-6 text-primary/20" />
                    <p className="text-muted-foreground pl-6 italic">&ldquo;{testimonial.text}&rdquo;</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative overflow-hidden rounded-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {customerTestimonials.map((customer, index) => (
              <motion.div key={customer.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="relative group cursor-pointer">
                <img src={customer.image} alt={`Customer ${customer.id}`} className="w-full h-48 md:h-64 object-cover rounded-lg transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-4">
                  <div className="text-white">
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-sm text-white/80">{customer.printType}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          {[{ value: '10,000+', label: t.stat1 }, { value: '500,000+', label: t.stat2 }, { value: '4.9/5', label: t.stat3 }, { value: '30+', label: t.stat4 }].map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );

  const renderProductVideos = () => (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <Badge variant="secondary" className="mb-4"><Play className="w-3.5 h-3.5 mr-2" />{t.badge_showcase}</Badge>
          <h2 className="text-3xl font-bold mb-4">{t.videos_title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t.videos_desc}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <Card className="overflow-hidden group cursor-pointer">
            <div className="relative aspect-video">
              <img src={productVideos[0].thumbnail} alt={productVideos[0].title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                <motion.div whileHover={{ scale: 1.1 }} className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
                </motion.div>
              </div>
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">{productVideos[0].duration}</div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h3 className="text-xl font-bold text-white">{productVideos[0].title}</h3>
                <p className="text-white/80">{productVideos[0].description}</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-6">
          {productVideos.slice(1).map((video, index) => (
            <motion.div key={video.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                <div className="relative aspect-video">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <motion.div whileHover={{ scale: 1.1 }} className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 text-primary ml-1" fill="currentColor" />
                    </motion.div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs">{video.duration}</div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{video.title}</h3>
                  <p className="text-sm text-muted-foreground">{video.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">{t.process_title}</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[{ step: 1, title: t.proc1_title, description: t.proc1_desc, icon: Upload }, { step: 2, title: t.proc2_title, description: t.proc2_desc, icon: Sparkles }, { step: 3, title: t.proc3_title, description: t.proc3_desc, icon: Camera }, { step: 4, title: t.proc4_title, description: t.proc4_desc, icon: Truck }].map((item, index) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="relative">
                <Card className="text-center p-6 h-full">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">{item.step}</div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
                {index < 3 && <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-6 h-6 text-muted-foreground" />}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );

  const renderPricingSection = () => (
    <section id="pricing-section" className="py-16 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t.pricing_title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t.pricing_desc}</p>
        </div>
        <ProductCatalog
          onSelect={(size) => {
            setSelectedSize(size as typeof printSizes[0]);
            setCurrentStep(0);
          }}
        />
        <p className="text-center text-muted-foreground mt-8">{t.shipping_note}</p>
        
        {/* Customer Reviews */}
        {reviews.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8">{t.reviews_title}</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (<Star key={i} className={cn("w-4 h-4", i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted")} />))}
                    </div>
                    <h4 className="font-semibold">{review.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-2">{t.review_by} {review.user?.name || t.review_anon}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );

  const renderUploadStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">{t.upload_title}</h2>
        <p className="text-muted-foreground">{t.upload_desc}</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
            "hover:border-primary hover:bg-primary/5",
            photos.length > 0 ? "border-primary bg-primary/5" : "border-border"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif,image/heic,image/heif"
            multiple
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              {isUploading ? (
                <p className="text-lg font-medium">{t.upload_compressing}</p>
              ) : (
                <>
                  <p className="text-lg font-medium">{t.upload_drop}</p>
                  <p className="text-sm text-muted-foreground">{t.upload_browse}</p>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t.upload_formats}</p>
          </div>
        </div>

        {/* Photo Grid */}
        {photos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t.upload_count(photos.length)}</h3>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Plus className="w-4 h-4 mr-2" /> {t.btn_addmore}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-border">
                    <img src={photo.preview} alt="Uploaded" className="w-full h-full object-cover" />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <input
                    type="text"
                    placeholder={t.caption_placeholder}
                    value={photo.customText || ''}
                    onChange={(e) => updatePhotoText(photo.id, e.target.value)}
                    className="mt-1 w-full text-xs px-2 py-1 border rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Size Selection & Quantity */}
        {photos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{t.select_size_title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {printSizes.map((size) => (
                  <Card
                    key={size.id}
                    className={cn("cursor-pointer transition-all", selectedSize.id === size.id ? "ring-2 ring-primary" : "hover:shadow-md")}
                    onClick={() => setSelectedSize(size)}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold">{size.name}</p>
                      <p className="text-2xl font-bold text-primary">RM{size.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{t.per_print}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Label className="text-lg">{t.qty_label}</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center text-xl font-semibold">{quantity}</span>
                <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold">{t.summary_prints(photos.length, quantity)}</p>
                    <p className="text-sm text-muted-foreground">{t.summary_total(photos.length * quantity)}</p>
                  </div>
                  <span className="font-bold text-primary text-3xl">
                    RM{(selectedSize.price * photos.length * quantity).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" onClick={addToCart}>
              <ShoppingCart className="w-5 h-5 mr-2" /> {t.btn_addcart}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const renderCartStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">{t.cart_title}</h2>
        <p className="text-muted-foreground">{t.cart_desc}</p>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t.cart_empty_title}</h3>
          <p className="text-muted-foreground mb-6">{t.cart_empty_desc}</p>
          <Button onClick={() => setCurrentStep(0)}>
            <Upload className="w-4 h-4 mr-2" /> {t.btn_upload}
          </Button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4">
            {cart.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex -space-x-2">
                        {item.photos.slice(0, 4).map((photo, i) => (
                          <img key={photo.id} src={photo.preview} alt="Cart item" className="w-12 h-12 rounded-lg object-cover border-2 border-background" style={{ zIndex: 4 - i }} />
                        ))}
                        {item.photos.length > 4 && (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border-2 border-background text-sm font-medium">
                            +{item.photos.length - 4}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{item.size.displayName}</h4>
                            <p className="text-sm text-muted-foreground">{t.cart_item_desc(item.photos.length, item.quantity)}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <span className="font-bold text-lg">RM{(item.size.price * item.photos.length * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.cart_total_label(totalPhotos)}</span>
                  <span>RM{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.label_shipping}</span>
                  <span>RM{getShippingCost(orderFormData.customerState).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t.label_total}</span>
                  <span className="text-primary">RM{(cartTotal + getShippingCost(orderFormData.customerState)).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-6">
            <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(0)}>
              <Plus className="w-4 h-4 mr-2" /> {t.btn_addmore_photos}
            </Button>
            <Button className="flex-1" onClick={() => setCurrentStep(3)}>
              {t.btn_checkout} <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderCheckoutStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">{t.checkout_title}</h2>
        <p className="text-muted-foreground">{t.checkout_desc}</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t.label_contact}</CardTitle>
            {user && (
              <CardDescription>{t.logged_as(profile?.email || user.email || '')}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.label_fullname}</Label>
              <Input id="name" placeholder={t.placeholder_name} value={orderFormData.customerName} onChange={(e) => setOrderFormData(prev => ({ ...prev, customerName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.label_email}</Label>
              <Input id="email" type="email" placeholder={t.placeholder_email} value={orderFormData.customerEmail} onChange={(e) => setOrderFormData(prev => ({ ...prev, customerEmail: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.label_phone}</Label>
              <Input id="phone" type="tel" placeholder="+60 123 456789" value={orderFormData.customerPhone} onChange={(e) => setOrderFormData(prev => ({ ...prev, customerPhone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">{t.label_state}</Label>
              <Select value={orderFormData.customerState} onValueChange={(value) => setOrderFormData(prev => ({ ...prev, customerState: value }))}>
                <SelectTrigger id="state">
                  <SelectValue placeholder={t.placeholder_state} />
                </SelectTrigger>
                <SelectContent>
                  {malaysiaStates.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name} {t.state_shipping(state.shippingCost)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t.label_notes}</Label>
              <Textarea id="notes" placeholder={t.placeholder_notes} value={orderFormData.notes} onChange={(e) => setOrderFormData(prev => ({ ...prev, notes: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t.label_payment}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={cn(
                  "border-2 rounded-lg p-4 cursor-pointer transition-all",
                  paymentMethod === 'bank_transfer' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onClick={() => setPaymentMethod('bank_transfer')}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'bank_transfer' ? "border-primary bg-primary" : "border-muted-foreground")}>
                    {paymentMethod === 'bank_transfer' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="font-semibold">{t.pay_bank}</p>
                    <p className="text-xs text-muted-foreground">Maybank</p>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "border-2 rounded-lg p-4 cursor-pointer transition-all",
                  paymentMethod === 'toyyibpay' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onClick={() => setPaymentMethod('toyyibpay')}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'toyyibpay' ? "border-primary bg-primary" : "border-muted-foreground")}>
                    {paymentMethod === 'toyyibpay' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="font-semibold">ToyyibPay</p>
                    <p className="text-xs text-muted-foreground">{t.pay_online}</p>
                  </div>
                </div>
              </div>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
                <p className="font-semibold">{t.bank_details_title}</p>
                <p><span className="text-muted-foreground">{t.bank_name}</span> Maybank</p>
                <p><span className="text-muted-foreground">{t.bank_account_name}</span> Acachiaa Empire</p>
                <p><span className="text-muted-foreground">{t.bank_account_no}</span> 123456789012</p>
                <p className="text-xs text-muted-foreground mt-2">{t.bank_note}</p>
              </div>
            )}

            {paymentMethod === 'toyyibpay' && (
              <div className="bg-muted rounded-lg p-4 text-sm">
                <p className="font-semibold">{t.toyyibpay_title}</p>
                <p className="text-muted-foreground">{t.toyyibpay_desc}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t.order_summary_title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{t.checkout_item(item.size.name, item.photos.length, item.quantity)}</span>
                  <span>RM{(item.size.price * item.photos.length * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.label_subtotal}</span>
                <span>RM{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.label_shipping}</span>
                <span>RM{getShippingCost(orderFormData.customerState).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{t.label_total}</span>
                <span className="text-primary">RM{(cartTotal + getShippingCost(orderFormData.customerState)).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(2)}>{t.btn_back_cart}</Button>
          <Button className="flex-1" onClick={handleCheckout} disabled={isProcessing}>
            {isProcessing ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />{t.btn_processing}</>) : (<><CreditCard className="w-4 h-4 mr-2" />{paymentMethod === 'toyyibpay' ? t.btn_pay_toyyibpay : t.btn_place_order}</>)}
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const renderConfirmationStep = () => (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
      {paymentMethod === 'bank_transfer' ? (
        <>
          <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">{t.confirm_await_title}</h2>
          <p className="text-muted-foreground mb-2">{t.confirm_await_desc('24')}</p>
          <p className="text-sm text-muted-foreground mb-6">{t.confirm_await_sub}</p>
          <Card className="max-w-md mx-auto">
            <CardContent className="py-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.label_order_no}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{orderNumber}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyTrackingNumber(orderNumber)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.label_email_short}</span>
                  <span>{orderFormData.customerEmail}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="bg-muted rounded-lg p-4 text-sm max-w-md mx-auto mt-6">
            <p className="font-semibold mb-2">{t.bank_details_title}</p>
            <p><span className="text-muted-foreground">{t.bank_name}</span> Maybank</p>
            <p><span className="text-muted-foreground">{t.bank_account_name}</span> Acachiaa Empire</p>
            <p><span className="text-muted-foreground">{t.bank_account_no}</span> 123456789012</p>
            <p className="font-semibold mt-2">{t.confirm_total((cartTotal + getShippingCost(orderFormData.customerState)).toFixed(2))}</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">{t.confirm_success_title}</h2>
          <p className="text-muted-foreground mb-6">{t.confirm_success_desc}</p>
          <Card className="max-w-md mx-auto">
            <CardContent className="py-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.label_order_no}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{orderNumber}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyTrackingNumber(orderNumber)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.label_email_short}</span>
                  <span>{orderFormData.customerEmail}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Order Status Progress Bar */}
      <div className="mt-8">
        <p className="text-sm text-muted-foreground mb-4">
          {paymentMethod === 'bank_transfer' ? t.label_order_status : t.label_track_order}
        </p>
        <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
          {[
            { key: 'received', label: t.step_received, icon: Check },
            { key: 'pending', label: t.step_pending_pay, icon: Clock },
            { key: 'processing', label: t.step_processing_conf, icon: Sparkles },
            { key: 'delivery', label: t.step_delivery, icon: Truck },
          ].map((step, index) => {
            const isActive = paymentMethod === 'bank_transfer' 
              ? index <= 1  // Show pending as current for bank transfer
              : index <= (index === 0 ? 0 : 1); // For toyyibpay, show processing
            
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex flex-col items-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs mt-1 hidden sm:block">{step.label}</span>
                </div>
                {index < 3 && (
                  <div className={`w-8 h-0.5 mx-1 ${index < (paymentMethod === 'bank_transfer' ? 1 : 1) ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 mt-8 justify-center">
        <Button variant="outline" onClick={() => { setShowTrackingModal(true); setTrackingInput(orderNumber); }}>
          <Search className="w-4 h-4 mr-2" /> {t.btn_track}
        </Button>
        <Button onClick={() => { setCurrentStep(-1); setOrderComplete(false); setPhotos([]); setOrderFormData({ customerName: '', customerEmail: '', customerPhone: '', customerState: 'w', notes: '' }); }}>
          <Plus className="w-4 h-4 mr-2" /> {t.btn_new_order}
        </Button>
      </div>
    </motion.div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderUploadStep();
      case 2: return renderCartStep();
      case 3: return renderCheckoutStep();
      case 4: return renderConfirmationStep();
      default: return null;
    }
  };

  // User Menu Component
  const renderUserMenu = () => (
    <div className="relative">
      {authLoading ? (
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      ) : user ? (
        <>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
          </Button>
          <AnimatePresence>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-56 rounded-lg bg-card border shadow-lg z-50"
                >
                  <div className="p-3 border-b">
                    <p className="font-medium">{profile?.name || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email || user.email}</p>
                  </div>
                  <div className="p-2">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { setShowUserMenu(false); setShowOrdersModal(true); }}>
                      <PackageOpen className="w-4 h-4 mr-2" /> {t.menu_orders}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { setShowUserMenu(false); setShowTrackingModal(true); }}>
                      <Search className="w-4 h-4 mr-2" /> {t.menu_track}
                    </Button>
                    <Separator className="my-2" />
                    <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => { setShowUserMenu(false); signOut(); }}>
                      <LogOut className="w-4 h-4 mr-2" /> {t.btn_signout}
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      ) : (
        <Button onClick={signInWithGoogle}>
          <LogIn className="w-4 h-4 mr-2" /> {t.btn_signin}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2" onClick={() => setCurrentStep(-1)}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold">Polaroid Glossy MY</h1>
                <p className="text-xs text-muted-foreground">{t.tagline}</p>
              </div>
            </button>

            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  className={cn("px-2 py-1 text-xs font-semibold transition-colors", lang === 'en' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  onClick={() => setLang('en')}
                >
                  ENG
                </button>
                <button
                  className={cn("px-2 py-1 text-xs font-semibold transition-colors", lang === 'my' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  onClick={() => setLang('my')}
                >
                  MY
                </button>
              </div>
              <ThemeSwitcher />
              <Button variant="ghost" asChild>
                <Link href="/faq">
                  <MessageSquare className="w-4 h-4 mr-2" /> {t.nav_faq}
                </Link>
              </Button>
              <Button variant="ghost" onClick={() => setShowTrackingModal(true)}>
                <Search className="w-4 h-4 mr-2" /> {t.nav_track}
              </Button>
              {currentStep >= 0 && !orderComplete && (
                <Button variant="ghost" onClick={() => setCurrentStep(-1)}>{t.nav_home}</Button>
              )}
              {renderUserMenu()}
              <Button variant="outline" className="relative" onClick={() => setShowCart(!showCart)}>
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">{cartCount}</Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      {currentStep >= 0 && !orderComplete && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-2 md:gap-4">
              {[{ id: 'upload', title: t.step_upload, icon: Upload }, { id: 'cart', title: t.step_cart, icon: ShoppingCart }, { id: 'checkout', title: t.step_checkout, icon: CreditCard }].map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => { if (index <= currentStep || (index === 1 && cart.length > 0)) setCurrentStep(index === 1 ? 2 : index); }}
                    disabled={index > currentStep && !(index === 1 && cart.length > 0)}
                    className={cn("flex items-center gap-2 px-3 py-2 rounded-lg transition-colors", currentStep === (index === 1 ? 2 : index) ? "bg-primary text-primary-foreground" : index < currentStep ? "text-primary hover:bg-primary/10" : "text-muted-foreground")}
                  >
                    <step.icon className="w-4 h-4" />
                    <span className="hidden md:inline">{step.title}</span>
                  </button>
                  {index < 2 && <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentStep === -1 ? (
            <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderHeroSection()}
              {renderFeaturesSection()}
              {renderCustomerGallery()}
              {renderProductVideos()}
              {renderPricingSection()}
            </motion.div>
          ) : (
            <motion.div key={`step-${currentStep}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderStepContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCart(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 20 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl z-50 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">{t.drawer_title(totalPhotos)}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}><X className="w-5 h-5" /></Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t.drawer_empty}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-3">
                          <div className="flex gap-3">
                            <div className="flex -space-x-2">
                              {item.photos.slice(0, 2).map((photo, i) => (
                                <img key={photo.id} src={photo.preview} alt="" className="w-10 h-10 rounded object-cover border border-background" style={{ zIndex: 2 - i }} />
                              ))}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{item.size.name}</p>
                              <p className="text-xs text-muted-foreground">{t.drawer_item(item.photos.length, item.quantity)}</p>
                              <p className="text-sm font-bold">RM{(item.size.price * item.photos.length * item.quantity).toFixed(2)}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.id)}><X className="w-4 h-4" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {cart.length > 0 && (
                <div className="border-t p-4 space-y-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t.drawer_total(totalPhotos)}</span>
                    <span>RM{(cartTotal + getShippingCost(orderFormData.customerState)).toFixed(2)}</span>
                  </div>
                  <Button className="w-full" onClick={() => { setShowCart(false); setCurrentStep(2); }}>{t.btn_view_cart}</Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Orders Modal */}
      <Dialog open={showOrdersModal} onOpenChange={setShowOrdersModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.orders_title}</DialogTitle>
            <DialogDescription>{t.orders_desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {userOrders.length === 0 ? (
              <div className="text-center py-8">
                <PackageOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t.orders_empty}</p>
              </div>
            ) : (
              userOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-mono font-semibold">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge className={cn("font-medium", statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800')}>
                        {statusConfig[order.status]?.label || order.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-lg">RM{order.total.toFixed(2)}</p>
                      <div className="flex gap-2">
                        {order.trackingNumber && (
                          <Button variant="outline" size="sm" onClick={() => handleCopyTrackingNumber(order.trackingNumber!)}>
                            <Copy className="w-3 h-3 mr-1" /> {t.btn_copy_tracking}
                          </Button>
                        )}
                        {order.status === 'delivered' && !reviews.find(r => r.orderId === order.id) && (
                          <Button size="sm" onClick={() => { setSelectedOrderForReview(order); setShowReviewModal(true); setShowOrdersModal(false); }}>
                            <MessageSquare className="w-3 h-3 mr-1" /> {t.btn_write_review}
                          </Button>
                        )}
                        {['pending', 'processing'].includes(order.status) && (
                          <Button variant="destructive" size="sm" onClick={() => handleCancelOrder(order.id)}>
                            <XCircle className="w-3 h-3 mr-1" /> {t.btn_cancel}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tracking Modal */}
      <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.track_title}</DialogTitle>
            <DialogDescription>{t.track_desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input placeholder="PP-XXXXXXXXXX" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value.toUpperCase())} />
              <Button onClick={handleTrackOrder}><Search className="w-4 h-4" /></Button>
            </div>
            {trackingOrder && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-mono font-semibold">{trackingOrder.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{new Date(trackingOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge className={cn("font-medium", statusConfig[trackingOrder.status]?.color || 'bg-gray-100 text-gray-800')}>
                      {statusConfig[trackingOrder.status]?.label || trackingOrder.status}
                    </Badge>
                  </div>
                  {trackingOrder.trackingNumber && (
                    <div className="bg-muted p-2 rounded mb-4">
                      <p className="text-xs text-muted-foreground">{t.label_tracking_no}</p>
                      <p className="font-mono">{trackingOrder.trackingNumber}</p>
                    </div>
                  )}
                  {/* Status Timeline */}
                  {trackingOrder.statusHistory && trackingOrder.statusHistory.length > 0 && (
                    <div className="space-y-3">
                      {trackingOrder.statusHistory.map((history, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn("w-3 h-3 rounded-full", statusConfig[history.status]?.color?.split(' ')[0] || 'bg-gray-200')} />
                            {index < trackingOrder.statusHistory!.length - 1 && <div className="w-0.5 h-8 bg-muted" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{statusConfig[history.status]?.label || history.status}</p>
                            <p className="text-xs text-muted-foreground">{new Date(history.createdAt).toLocaleString()}</p>
                            {history.message && <p className="text-xs text-muted-foreground">{history.message}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.review_title}</DialogTitle>
            <DialogDescription>{t.review_desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{t.label_rating}</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}>
                    <Star className={cn("w-8 h-8", star <= reviewForm.rating ? "fill-yellow-400 text-yellow-400" : "text-muted")} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review-title">{t.label_review_title}</Label>
              <Input id="review-title" placeholder={t.placeholder_review_title} value={reviewForm.title} onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="review-comment">{t.label_review_comment}</Label>
              <Textarea id="review-comment" placeholder={t.placeholder_review_comment} rows={4} value={reviewForm.comment} onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleSubmitReview}>{t.btn_submit_review}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* OAuth Error Modal */}
      <Dialog open={showOAuthErrorModal} onOpenChange={setShowOAuthErrorModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              {t.oauth_title}
            </DialogTitle>
            <DialogDescription>
              {t.oauth_desc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <p className="font-medium">{t.oauth_step1}</p>
              <a 
                href="https://console.cloud.google.com/apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                https://console.cloud.google.com/apis/credentials
              </a>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-medium">{t.oauth_step2}</p>
              <p className="text-sm text-muted-foreground">{t.oauth_step2_desc} <code className="bg-background px-1 rounded">912176079688-q853e78d3l9n6tpatt72fj86iepato98</code></p>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-medium">{t.oauth_step3}</p>
              <p className="text-sm text-muted-foreground">{t.oauth_step3_desc}</p>
              <p className="text-xs bg-background p-2 rounded font-mono break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-medium">{t.oauth_step4}</p>
              <p className="text-sm text-muted-foreground">{t.oauth_step4_desc}</p>
              <p className="text-xs bg-background p-2 rounded font-mono break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/google` : ''}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`${window.location.origin}/api/auth/callback/google`);
                    toast.success(t.toast_uri_copied);
                  }
                }}
              >
                <Copy className="w-3 h-3 mr-2" /> {t.btn_copy_uri}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-medium">{t.oauth_step5}</p>
              <p className="text-sm text-muted-foreground">{t.oauth_step5_desc}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowOAuthErrorModal(false)}>
              {t.btn_close}
            </Button>
            <Button onClick={() => {
              setShowOAuthErrorModal(false);
              signInWithGoogle();
            }}>
              {t.btn_try_again}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-muted/50 border-t mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-6 h-6 text-primary" />
                <span className="font-bold">Polaroid Glossy MY</span>
              </div>
              <p className="text-sm text-muted-foreground">{t.footer_desc}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t.footer_sizes}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {printSizes.map(size => (<li key={size.id}>{size.displayName} - RM{size.price.toFixed(2)}</li>))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t.footer_features}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> {t.feat_premium}</li>
                <li className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> {t.feat_shipping}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t.feat_text}</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {t.feat_days}</li>
                <li><Link href="/faq" className="hover:underline">{t.footer_faq}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t.footer_why}</h4>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />))}
                <span className="text-sm ml-2">4.9/5</span>
              </div>
              <p className="text-sm text-muted-foreground">{t.footer_trust}</p>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-sm text-muted-foreground">{t.footer_copy}</div>
        </div>
      </footer>
    </div>
  );
}
