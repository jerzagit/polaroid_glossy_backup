export type Lang = 'en' | 'my';

export interface FAQ { question: string; answer: string; }
export interface FAQCategory { title: string; faqs: FAQ[]; }
export interface Testimonial { id: number; name: string; location: string; text: string; printType: string; }
export interface Video { id: number; title: string; description: string; duration: string; }

export interface Trans {
  // Header
  tagline: string; nav_faq: string; nav_track: string; nav_home: string;
  btn_signin: string; btn_signout: string; menu_orders: string; menu_track: string;
  // Steps
  step_upload: string; step_cart: string; step_checkout: string;
  // Hero
  badge_premium: string; hero_title1: string; hero_title2: string; hero_desc: string;
  btn_start: string; btn_pricing: string; hero_customers: string;
  hero_delivery_title: string; hero_delivery_sub: string;
  hero_quality_title: string; hero_quality_sub: string;
  // Features
  features_title: string; features_desc: string;
  feat1_title: string; feat1_desc: string; feat2_title: string; feat2_desc: string;
  feat3_title: string; feat3_desc: string; feat4_title: string; feat4_desc: string;
  feat5_title: string; feat5_desc: string; feat6_title: string; feat6_desc: string;
  // Gallery
  badge_happy: string; gallery_title: string; gallery_desc: string;
  stat1: string; stat2: string; stat3: string; stat4: string;
  // Videos
  badge_showcase: string; videos_title: string; videos_desc: string; process_title: string;
  proc1_title: string; proc1_desc: string; proc2_title: string; proc2_desc: string;
  proc3_title: string; proc3_desc: string; proc4_title: string; proc4_desc: string;
  // Pricing
  pricing_title: string; pricing_desc: string; badge_popular: string; per_print: string;
  btn_getstarted: string; shipping_note: string; reviews_title: string;
  review_by: string; review_anon: string;
  // Upload
  upload_title: string; upload_desc: string; upload_compressing: string;
  upload_drop: string; upload_browse: string; upload_formats: string;
  upload_count: (n: number) => string;
  btn_addmore: string; caption_placeholder: string; select_size_title: string;
  qty_label: string;
  summary_prints: (photos: number, qty: number) => string;
  summary_total: (n: number) => string;
  btn_addcart: string;
  // Cart
  cart_title: string; cart_desc: string; cart_empty_title: string; cart_empty_desc: string;
  btn_upload: string;
  cart_item_desc: (photos: number, qty: number) => string;
  cart_total_label: (n: number) => string;
  label_shipping: string; label_total: string; btn_addmore_photos: string; btn_checkout: string;
  // Checkout
  checkout_title: string; checkout_desc: string; label_contact: string;
  logged_as: (email: string) => string;
  label_fullname: string; placeholder_name: string; label_email: string; placeholder_email: string;
  label_phone: string; label_state: string; placeholder_state: string;
  state_shipping: (cost: number) => string;
  label_notes: string; placeholder_notes: string; label_payment: string;
  pay_bank: string; pay_online: string; bank_details_title: string;
  bank_name: string; bank_account_name: string; bank_account_no: string; bank_note: string;
  toyyibpay_title: string; toyyibpay_desc: string; order_summary_title: string;
  label_subtotal: string; btn_back_cart: string; btn_processing: string;
  btn_pay_toyyibpay: string; btn_place_order: string;
  checkout_item: (size: string, photos: number, qty: number) => string;
  // Confirmation
  confirm_await_title: string; confirm_await_sub: string;
  confirm_await_desc: (hours: string) => string;
  label_order_no: string; label_email_short: string;
  confirm_total: (amount: string) => string;
  confirm_success_title: string; confirm_success_desc: string;
  label_order_status: string; label_track_order: string;
  step_received: string; step_pending_pay: string; step_processing_conf: string; step_delivery: string;
  btn_track: string; btn_new_order: string;
  // Status labels
  status_pending: string; status_processing: string; status_posted: string;
  status_on_delivery: string; status_delivered: string; status_cancelled: string; status_refunded: string;
  // Cart drawer
  drawer_title: (n: number) => string;
  drawer_empty: string;
  drawer_item: (photos: number, qty: number) => string;
  drawer_total: (n: number) => string;
  btn_view_cart: string;
  // Orders modal
  orders_title: string; orders_desc: string; orders_empty: string;
  btn_copy_tracking: string; btn_write_review: string; btn_cancel: string; label_tracking_no: string;
  // Track modal
  track_title: string; track_desc: string;
  // Review modal
  review_title: string; review_desc: string; label_rating: string;
  label_review_title: string; placeholder_review_title: string;
  label_review_comment: string; placeholder_review_comment: string; btn_submit_review: string;
  // OAuth modal
  oauth_title: string; oauth_desc: string;
  oauth_step1: string; oauth_step2: string; oauth_step2_desc: string;
  oauth_step3: string; oauth_step3_desc: string; oauth_step4: string; oauth_step4_desc: string;
  btn_copy_uri: string; oauth_step5: string; oauth_step5_desc: string;
  btn_close: string; btn_try_again: string;
  // Footer
  footer_desc: string; footer_sizes: string; footer_features: string;
  feat_premium: string; feat_shipping: string; feat_text: string; feat_days: string;
  footer_faq: string; footer_why: string; footer_trust: string; footer_copy: string;
  // Toasts
  toast_photos_added: (n: number) => string;
  toast_compress_fail: string; toast_no_photo: string;
  toast_cart_added: (photos: number, qty: number) => string;
  toast_removed: string; toast_fill_required: string; toast_select_state: string;
  toast_order_success: string; toast_order_fail: string;
  toast_cancel_success: string; toast_cancel_fail: string;
  toast_enter_order: string; toast_not_found: string; toast_track_fail: string;
  toast_fill_all: string; toast_review_success: string; toast_review_fail: string;
  toast_tracking_copied: string; toast_uri_copied: string;
  // Print sizes
  size_2r_desc: string; size_3r_desc: string; size_4r_desc: string; size_a4_desc: string;
  size_2r_display: string; size_3r_display: string; size_4r_display: string; size_a4_display: string;
  // Data arrays
  testimonials: Testimonial[];
  videos: Video[];
  faqCategories: FAQCategory[];
  // FAQ page
  faq_page_title: string; faq_page_desc: string;
  faq_warranty_title: string; faq_warranty_desc: string;
  btn_new_order_faq: string; btn_contact: string;
  // Payment status page
  pay_success_title: string; pay_success_desc: string; pay_order_no: string;
  pay_pending_title: string; pay_pending_desc: string;
  pay_fail_title: string; pay_fail_desc: string;
  btn_back_home: string; btn_view_status: string;
  // Product detail page
  btn_back: string;
  label_print: string;
  prod_bestseller: string;
  prod_not_found: string;
  prod_what_makes: (name: string) => string;
  tab_description: string; tab_specs: string; tab_reviews: string; tab_tiktok: string;
  prod_no_reviews: string;
  prod_tiktok_title: string; prod_tiktok_desc: string; prod_tiktok_tag: string;
  prod_no_tiktok: string; prod_no_tiktok_tag: string;
  prod_quality_guarantee: string; prod_view_tiktok: string;
  spec_size: string; spec_paper: string; spec_finish: string; spec_method: string;
  spec_processing: string; spec_min_qty: string; spec_custom_text: string;
  spec_file_formats: string; spec_max_size: string;
  spec_custom_text_value: string; spec_print: string;
}

const en: Trans = {
  tagline: 'Turn memories into art', nav_faq: 'FAQ', nav_track: 'Track Order',
  nav_home: 'Home', btn_signin: 'Sign In', btn_signout: 'Sign Out',
  menu_orders: 'My Orders', menu_track: 'Track Order',
  step_upload: 'Upload Photos', step_cart: 'Cart', step_checkout: 'Checkout',
  badge_premium: 'Premium Polaroid Prints', hero_title1: 'Turn Your Memories Into',
  hero_title2: 'Timeless Art',
  hero_desc: 'Transform your digital photos into beautiful physical polaroid prints. Choose from multiple sizes, add custom text, and create memories that last forever.',
  btn_start: 'Start Creating', btn_pricing: 'View Pricing', hero_customers: '10,000+ happy customers',
  hero_delivery_title: 'Fast Delivery', hero_delivery_sub: '3-5 business days',
  hero_quality_title: 'Premium Quality', hero_quality_sub: 'Photo-grade paper',
  features_title: 'Why Choose Polaroid Glossy MY?',
  features_desc: 'We make printing your memories easy, affordable, and beautiful',
  feat1_title: 'Quick & Easy', feat1_desc: 'Upload your photos, choose a size, and checkout in under 2 minutes',
  feat2_title: 'Quality Guaranteed', feat2_desc: 'Premium photo paper with vibrant colors that last for years',
  feat3_title: 'Personal Touch', feat3_desc: 'Add custom text to make each print uniquely yours',
  feat4_title: 'Fast Shipping', feat4_desc: 'RM7 for East Malaysia, RM11 for West Malaysia, delivered in 3-5 business days',
  feat5_title: 'Easy Reorders', feat5_desc: 'Your uploaded photos are saved for quick reordering anytime',
  feat6_title: 'Multiple Sizes', feat6_desc: 'From wallet-size 2R to poster-size A4, we have you covered',
  badge_happy: 'Happy Customers', gallery_title: 'Loved by Thousands',
  gallery_desc: 'See what our customers are saying about their polaroid prints',
  stat1: 'Happy Customers', stat2: 'Photos Printed', stat3: 'Average Rating', stat4: 'Countries Served',
  badge_showcase: 'Product Showcase', videos_title: 'See Our Products in Action',
  videos_desc: 'Discover how we create beautiful polaroid prints from your digital memories',
  process_title: 'Our Simple Process',
  proc1_title: 'Upload', proc1_desc: 'Choose your favorite photos',
  proc2_title: 'Customize', proc2_desc: 'Select size & add text',
  proc3_title: 'Print', proc3_desc: 'We print with premium quality',
  proc4_title: 'Deliver', proc4_desc: 'Fast shipping to your door',
  pricing_title: 'Simple, Transparent Pricing',
  pricing_desc: 'Choose from our range of print sizes, all at affordable prices',
  badge_popular: 'Most Popular', per_print: '/print', btn_getstarted: 'Get Started',
  shipping_note: 'RM7 flat-rate shipping for East Malaysia • RM11 flat-rate shipping for West Malaysia',
  reviews_title: 'Customer Reviews', review_by: 'By', review_anon: 'Anonymous',
  upload_title: 'Upload Your Photos',
  upload_desc: 'Upload multiple photos to transform into beautiful polaroid prints',
  upload_compressing: 'Compressing photos...', upload_drop: 'Drop your photos here',
  upload_browse: 'or click to browse • Select multiple photos at once',
  upload_formats: 'Supports: JPG, PNG, WEBP, HEIC (Max 25MB each)',
  upload_count: (n) => `${n} photo${n > 1 ? 's' : ''} uploaded`,
  btn_addmore: 'Add More', caption_placeholder: 'Add caption...',
  select_size_title: 'Select Print Size', qty_label: 'Quantity per photo:',
  summary_prints: (p, q) => `${p} photo${p > 1 ? 's' : ''} × ${q} print${q > 1 ? 's' : ''} each`,
  summary_total: (n) => `Total: ${n} prints`, btn_addcart: 'Add to Cart',
  cart_title: 'Your Cart', cart_desc: 'Review your items before checkout',
  cart_empty_title: 'Your cart is empty', cart_empty_desc: 'Upload some photos to get started',
  btn_upload: 'Upload Photos',
  cart_item_desc: (p, q) => `${p} photo${p > 1 ? 's' : ''} × ${q} print${q > 1 ? 's' : ''} each`,
  cart_total_label: (n) => `Total Photos (${n} prints)`,
  label_shipping: 'Shipping', label_total: 'Total',
  btn_addmore_photos: 'Add More Photos', btn_checkout: 'Proceed to Checkout',
  checkout_title: 'Checkout', checkout_desc: 'Complete your order',
  label_contact: 'Contact Information', logged_as: (e) => `Logged in as ${e}`,
  label_fullname: 'Full Name *', placeholder_name: 'Ahmad bin Ali',
  label_email: 'Email Address *', placeholder_email: 'ahmad@example.com',
  label_phone: 'Phone Number', label_state: 'State *', placeholder_state: 'Select your state',
  state_shipping: (c) => `(RM${c} shipping)`,
  label_notes: 'Special Instructions', placeholder_notes: 'Any special requests for your order...',
  label_payment: 'Payment Method', pay_bank: 'Bank Transfer', pay_online: 'Online Payment',
  bank_details_title: 'Bank Transfer Details:', bank_name: 'Bank:',
  bank_account_name: 'Account Name:', bank_account_no: 'Account Number:',
  bank_note: 'Please transfer the exact amount and upload your receipt after placing order.',
  toyyibpay_title: 'Pay with ToyyibPay:',
  toyyibpay_desc: 'You will be redirected to ToyyibPay to complete your payment securely.',
  order_summary_title: 'Order Summary', label_subtotal: 'Subtotal',
  btn_back_cart: 'Back to Cart', btn_processing: 'Processing...',
  btn_pay_toyyibpay: 'Pay with ToyyibPay', btn_place_order: 'Place Order',
  checkout_item: (s, p, q) => `${s} - ${p} photo${p > 1 ? 's' : ''} × ${q}`,
  confirm_await_title: 'Awaiting Payment',
  confirm_await_desc: (h) => `Please make your payment within ${h} hours.`,
  confirm_await_sub: 'Your order will be processed once we receive your payment.',
  label_order_no: 'Order Number:', label_email_short: 'Email:',
  confirm_total: (a) => `Total: RM${a}`,
  confirm_success_title: 'Order Confirmed!',
  confirm_success_desc: "Thank you for your order. We'll start printing your beautiful polaroids right away!",
  label_order_status: 'Order Status:', label_track_order: 'Track your order:',
  step_received: 'Order Received', step_pending_pay: 'Pending Payment',
  step_processing_conf: 'Processing', step_delivery: 'Delivery',
  btn_track: 'Track Order', btn_new_order: 'Create Another Order',
  status_pending: 'Pending', status_processing: 'Processing', status_posted: 'Posted',
  status_on_delivery: 'On Delivery', status_delivered: 'Delivered',
  status_cancelled: 'Cancelled', status_refunded: 'Refunded',
  drawer_title: (n) => `Cart (${n} photos)`, drawer_empty: 'Your cart is empty',
  drawer_item: (p, q) => `${p} photos × ${q}`,
  drawer_total: (n) => `Total (${n} prints)`, btn_view_cart: 'View Cart & Checkout',
  orders_title: 'My Orders', orders_desc: 'View and manage your orders', orders_empty: 'No orders yet',
  btn_copy_tracking: 'Copy Tracking', btn_write_review: 'Write Review', btn_cancel: 'Cancel',
  label_tracking_no: 'Tracking Number',
  track_title: 'Track Your Order', track_desc: 'Enter your order number to track status',
  review_title: 'Write a Review', review_desc: 'Share your experience with this order',
  label_rating: 'Rating', label_review_title: 'Title',
  placeholder_review_title: 'Great quality prints!',
  label_review_comment: 'Your Review', placeholder_review_comment: 'Tell us about your experience...',
  btn_submit_review: 'Submit Review',
  oauth_title: 'Google Sign-In Setup Required',
  oauth_desc: 'The Google OAuth is not configured for this domain. Please follow the steps below to fix this.',
  oauth_step1: 'Step 1: Go to Google Cloud Console',
  oauth_step2: 'Step 2: Edit your OAuth 2.0 Client ID',
  oauth_step2_desc: 'Find the client ID that starts with:',
  oauth_step3: 'Step 3: Add Authorized JavaScript origins',
  oauth_step3_desc: 'Add your current domain (the URL you see in your browser address bar)',
  oauth_step4: 'Step 4: Add Authorized redirect URI',
  oauth_step4_desc: 'Add this exact redirect URI:',
  btn_copy_uri: 'Copy Redirect URI',
  oauth_step5: 'Step 5: Save and wait',
  oauth_step5_desc: 'After saving, wait a few minutes for changes to propagate, then try signing in again.',
  btn_close: 'Close', btn_try_again: 'Try Again',
  footer_desc: 'Transform your digital memories into beautiful physical polaroid prints.',
  footer_sizes: 'Print Sizes', footer_features: 'Features',
  feat_premium: 'Premium Quality', feat_shipping: 'Fast Shipping',
  feat_text: 'Custom Text', feat_days: '3-4 Working Days',
  footer_faq: 'FAQ & Warranty', footer_why: 'Why Choose Us?',
  footer_trust: 'Trusted by over 10,000+ happy customers worldwide',
  footer_copy: '© 2024 Polaroid Glossy MY. All rights reserved.',
  toast_photos_added: (n) => `${n} photo${n > 1 ? 's' : ''} added!`,
  toast_compress_fail: 'Failed to process some photos',
  toast_no_photo: 'Please upload at least one photo',
  toast_cart_added: (p, q) => `${p} photo${p > 1 ? 's' : ''} × ${q} added to cart!`,
  toast_removed: 'Item removed from cart', toast_fill_required: 'Please fill in required fields',
  toast_select_state: 'Please select your state', toast_order_success: 'Order placed successfully!',
  toast_order_fail: 'Failed to place order. Please try again.',
  toast_cancel_success: 'Order cancelled successfully', toast_cancel_fail: 'Failed to cancel order',
  toast_enter_order: 'Please enter an order number', toast_not_found: 'Order not found',
  toast_track_fail: 'Failed to track order', toast_fill_all: 'Please fill in all fields',
  toast_review_success: 'Review submitted successfully!', toast_review_fail: 'Failed to submit review',
  toast_tracking_copied: 'Tracking number copied!', toast_uri_copied: 'Redirect URI copied!',
  size_2r_desc: 'Wallet size - Perfect for keepsakes',
  size_3r_desc: 'Standard photo size - Great for albums',
  size_4r_desc: 'Most popular - Classic polaroid style',
  size_a4_desc: 'Poster size - Perfect for displays',
  size_2r_display: '2R (2.5 x 3.5 inches)', size_3r_display: '3R (3.5 x 5 inches)',
  size_4r_display: '4R (4 x 6 inches)', size_a4_display: 'A4 (8.3 x 11.7 inches)',
  testimonials: [
    { id: 1, name: 'Sarah Mitchell', location: 'New York, USA', text: 'Absolutely love my polaroid prints! The quality is amazing and they arrived so quickly. Perfect for my scrapbook!', printType: '4R Classic' },
    { id: 2, name: 'James & Emily', location: 'London, UK', text: "We ordered prints for our anniversary and couldn't be happier. The custom text feature made them extra special!", printType: 'Mixed Sizes' },
    { id: 3, name: 'Margaret & Tommy', location: 'Sydney, Australia', text: 'My grandson and I love looking through our polaroid memories together. Thank you for such beautiful quality!', printType: 'A4 Poster' },
    { id: 4, name: 'Party Squad', location: 'Toronto, Canada', text: "Ordered 50 prints for our friend's birthday party. Everyone loved taking home a memory! Great prices too.", printType: '3R Standard' }
  ],
  videos: [
    { id: 1, title: 'How It Works', description: 'Watch how we transform your digital photos into beautiful polaroid prints', duration: '1:30' },
    { id: 2, title: 'Premium Quality', description: 'See our printing process and premium photo paper in action', duration: '2:15' },
    { id: 3, title: 'Custom Text Feature', description: 'Learn how to add personal messages to your polaroid prints', duration: '1:45' }
  ],
  faqCategories: [
    { title: 'Order & Processing', faqs: [
      { question: 'How long does it take to process an order?', answer: 'All orders take 3-4 working days to process. Please note that we do not accommodate fussy buyers or urgent orders. We take our time to ensure each print is made with care and attention to detail.' },
      { question: 'How do I place an order?', answer: 'Simply upload your photos, select your preferred print size and quantity, add any custom text if desired, and proceed to checkout. You can pay using your preferred payment method.' },
      { question: 'Can I modify my order after placing it?', answer: 'Once an order is placed, it enters processing immediately. Please double-check your photos and details before completing your order as modifications are not possible after submission.' },
      { question: 'Can I cancel my order?', answer: 'NO CANCELLATION will be made once the order is created. Please ensure all details are correct before placing your order. We begin processing immediately after order confirmation.' }
    ]},
    { title: 'Shipping & Delivery', faqs: [
      { question: 'How will my order be shipped?', answer: 'All orders are shipped via registered mail with tracking number. You will receive your tracking number once your order is dispatched.' },
      { question: 'Do you offer international shipping?', answer: 'Currently, we only ship within Malaysia. For international orders, please contact us to discuss arrangements.' }
    ]},
    { title: 'Warranty & Claims', faqs: [
      { question: 'What is covered under warranty?', answer: 'Our warranty covers manufacturing defects such as printing errors, damage during shipping, or quality issues with the materials used. We ensure every print meets our quality standards.' },
      { question: 'How do I claim warranty?', answer: 'To claim warranty, please contact us with your order number and description of the issue. We may request photos of the damaged or defective print for assessment. Valid claims will be replaced or refunded.' },
      { question: 'What is not covered under warranty?', answer: 'Warranty does not cover damage caused by customer handling, color variations due to monitor settings, or issues arising from low-quality source images provided by the customer.' },
      { question: 'How long is the warranty period?', answer: 'Warranty claims must be made within 7 days of receiving your order. Please inspect your order immediately upon delivery and report any issues promptly.' }
    ]},
    { title: 'Customization', faqs: [
      { question: 'Can I add custom text to my polaroid?', answer: 'Yes! You can add custom text to each photo during the ordering process. The text will be printed at the bottom of your polaroid.' },
      { question: 'What file formats do you accept?', answer: 'We accept JPG, PNG, and WEBP formats. For best results, we recommend using high-resolution images (at least 1000x1000 pixels).' }
    ]}
  ],
  faq_page_title: 'Frequently Asked Questions',
  faq_page_desc: 'Find answers to common questions about our polaroid printing service, shipping, and warranty claims.',
  faq_warranty_title: 'Need to Claim Warranty?',
  faq_warranty_desc: 'If you have received a defective or damaged product, please contact us to initiate a warranty claim.',
  btn_new_order_faq: 'Place New Order', btn_contact: 'Contact Support',
  pay_success_title: 'Payment Successful!',
  pay_success_desc: 'Thank you for your payment. Your order is being processed.',
  pay_order_no: 'Order Number:', pay_pending_title: 'Payment Pending',
  pay_pending_desc: 'Your payment is being processed. Please wait a moment.',
  pay_fail_title: 'Payment Failed',
  pay_fail_desc: 'Something went wrong with your payment. Please try again.',
  btn_back_home: 'Back to Home', btn_view_status: 'View Order Status',
  // Product detail page
  btn_back: 'Back',
  label_print: 'Print',
  prod_bestseller: 'Bestseller',
  prod_not_found: 'Product not found',
  prod_what_makes: (name) => `What makes ${name} special`,
  tab_description: 'Description', tab_specs: 'Specifications',
  tab_reviews: 'Reviews', tab_tiktok: 'TikTok Reviews',
  prod_no_reviews: 'No reviews yet. Be the first!',
  prod_tiktok_title: 'Real customer videos from TikTok',
  prod_tiktok_desc: 'These are genuine reviews posted on TikTok. Tag us',
  prod_tiktok_tag: 'to be featured here.',
  prod_no_tiktok: 'No TikTok reviews yet for this product.',
  prod_no_tiktok_tag: 'Tag @polaroidglossymy in your TikTok to be featured.',
  prod_quality_guarantee: 'Quality guaranteed · Free replacement for defects',
  prod_view_tiktok: 'View on TikTok',
  spec_size: 'Print Size', spec_paper: 'Paper Weight', spec_finish: 'Finish',
  spec_method: 'Print Method', spec_processing: 'Processing Time',
  spec_min_qty: 'Minimum Order', spec_custom_text: 'Custom Text',
  spec_file_formats: 'File Formats', spec_max_size: 'Max File Size',
  spec_custom_text_value: 'Supported (printed at bottom)',
  spec_print: 'print',
};

const my: Trans = {
  tagline: 'Jadikan kenangan menjadi seni', nav_faq: 'Soalan Lazim', nav_track: 'Jejak Pesanan',
  nav_home: 'Laman Utama', btn_signin: 'Log Masuk', btn_signout: 'Log Keluar',
  menu_orders: 'Pesanan Saya', menu_track: 'Jejak Pesanan',
  step_upload: 'Muat Naik Foto', step_cart: 'Troli', step_checkout: 'Pembayaran',
  badge_premium: 'Cetakan Polaroid Premium', hero_title1: 'Jadikan Kenangan Anda',
  hero_title2: 'Karya Seni Abadi',
  hero_desc: 'Tukar foto digital anda menjadi cetakan polaroid fizikal yang cantik. Pilih pelbagai saiz, tambah teks khas, dan cipta kenangan yang kekal selamanya.',
  btn_start: 'Mula Cipta', btn_pricing: 'Lihat Harga', hero_customers: '10,000+ pelanggan gembira',
  hero_delivery_title: 'Penghantaran Pantas', hero_delivery_sub: '3-5 hari bekerja',
  hero_quality_title: 'Kualiti Premium', hero_quality_sub: 'Kertas gred foto',
  features_title: 'Mengapa Pilih Polaroid Glossy MY?',
  features_desc: 'Kami menjadikan percetakan kenangan anda mudah, mampu milik, dan cantik',
  feat1_title: 'Pantas & Mudah', feat1_desc: 'Muat naik foto anda, pilih saiz, dan daftar keluar dalam masa kurang dari 2 minit',
  feat2_title: 'Kualiti Terjamin', feat2_desc: 'Kertas foto premium dengan warna cerah yang tahan bertahun-tahun',
  feat3_title: 'Sentuhan Peribadi', feat3_desc: 'Tambah teks khas untuk menjadikan setiap cetakan unik milik anda',
  feat4_title: 'Penghantaran Pantas', feat4_desc: 'RM7 untuk Malaysia Timur, RM11 untuk Malaysia Barat, dihantar dalam 3-5 hari bekerja',
  feat5_title: 'Tempah Semula Mudah', feat5_desc: 'Foto yang dimuat naik disimpan untuk tempahan semula yang cepat pada bila-bila masa',
  feat6_title: 'Pelbagai Saiz', feat6_desc: 'Dari saiz dompet 2R hingga saiz poster A4, kami ada untuk anda',
  badge_happy: 'Pelanggan Gembira', gallery_title: 'Disukai Ribuan Pelanggan',
  gallery_desc: 'Lihat apa yang pelanggan kami katakan tentang cetakan polaroid mereka',
  stat1: 'Pelanggan Gembira', stat2: 'Foto Dicetak', stat3: 'Penilaian Purata', stat4: 'Negara Dilayan',
  badge_showcase: 'Pameran Produk', videos_title: 'Lihat Produk Kami Beraksi',
  videos_desc: 'Ketahui cara kami menghasilkan cetakan polaroid yang cantik daripada kenangan digital anda',
  process_title: 'Proses Mudah Kami',
  proc1_title: 'Muat Naik', proc1_desc: 'Pilih foto kegemaran anda',
  proc2_title: 'Sesuaikan', proc2_desc: 'Pilih saiz & tambah teks',
  proc3_title: 'Cetak', proc3_desc: 'Kami mencetak dengan kualiti premium',
  proc4_title: 'Hantar', proc4_desc: 'Penghantaran pantas ke pintu anda',
  pricing_title: 'Harga Mudah & Telus',
  pricing_desc: 'Pilih daripada pelbagai saiz cetakan kami, semua dengan harga yang berpatutan',
  badge_popular: 'Paling Popular', per_print: '/cetakan', btn_getstarted: 'Mulakan',
  shipping_note: 'Penghantaran rata RM7 untuk Malaysia Timur • Penghantaran rata RM11 untuk Malaysia Barat',
  reviews_title: 'Ulasan Pelanggan', review_by: 'Oleh', review_anon: 'Tanpa Nama',
  upload_title: 'Muat Naik Foto Anda',
  upload_desc: 'Muat naik berbilang foto untuk diubah menjadi cetakan polaroid yang cantik',
  upload_compressing: 'Memampatkan foto...', upload_drop: 'Letakkan foto anda di sini',
  upload_browse: 'atau klik untuk melayari • Pilih berbilang foto sekaligus',
  upload_formats: 'Sokong: JPG, PNG, WEBP, HEIC (Maks 25MB setiap satu)',
  upload_count: (n) => `${n} foto dimuat naik`,
  btn_addmore: 'Tambah Lagi', caption_placeholder: 'Tambah kapsyen...',
  select_size_title: 'Pilih Saiz Cetakan', qty_label: 'Kuantiti per foto:',
  summary_prints: (p, q) => `${p} foto × ${q} cetakan setiap satu`,
  summary_total: (n) => `Jumlah: ${n} cetakan`, btn_addcart: 'Tambah ke Troli',
  cart_title: 'Troli Anda', cart_desc: 'Semak item anda sebelum daftar keluar',
  cart_empty_title: 'Troli anda kosong', cart_empty_desc: 'Muat naik beberapa foto untuk bermula',
  btn_upload: 'Muat Naik Foto',
  cart_item_desc: (p, q) => `${p} foto × ${q} cetakan setiap satu`,
  cart_total_label: (n) => `Jumlah Foto (${n} cetakan)`,
  label_shipping: 'Penghantaran', label_total: 'Jumlah',
  btn_addmore_photos: 'Tambah Lagi Foto', btn_checkout: 'Teruskan ke Pembayaran',
  checkout_title: 'Pembayaran', checkout_desc: 'Lengkapkan pesanan anda',
  label_contact: 'Maklumat Hubungan', logged_as: (e) => `Log masuk sebagai ${e}`,
  label_fullname: 'Nama Penuh *', placeholder_name: 'Ahmad bin Ali',
  label_email: 'Alamat E-mel *', placeholder_email: 'ahmad@contoh.com',
  label_phone: 'Nombor Telefon', label_state: 'Negeri *', placeholder_state: 'Pilih negeri anda',
  state_shipping: (c) => `(RM${c} penghantaran)`,
  label_notes: 'Arahan Khas', placeholder_notes: 'Sebarang permintaan khas untuk pesanan anda...',
  label_payment: 'Kaedah Pembayaran', pay_bank: 'Pindahan Bank', pay_online: 'Pembayaran Dalam Talian',
  bank_details_title: 'Butiran Pindahan Bank:', bank_name: 'Bank:',
  bank_account_name: 'Nama Akaun:', bank_account_no: 'Nombor Akaun:',
  bank_note: 'Sila pindahkan jumlah yang tepat dan muat naik resit anda selepas membuat pesanan.',
  toyyibpay_title: 'Bayar dengan ToyyibPay:',
  toyyibpay_desc: 'Anda akan diarahkan ke ToyyibPay untuk melengkapkan pembayaran anda dengan selamat.',
  order_summary_title: 'Ringkasan Pesanan', label_subtotal: 'Subjumlah',
  btn_back_cart: 'Kembali ke Troli', btn_processing: 'Sedang Diproses...',
  btn_pay_toyyibpay: 'Bayar dengan ToyyibPay', btn_place_order: 'Buat Pesanan',
  checkout_item: (s, p, q) => `${s} - ${p} foto × ${q}`,
  confirm_await_title: 'Menunggu Pembayaran',
  confirm_await_desc: (h) => `Sila buat pembayaran dalam masa ${h} jam.`,
  confirm_await_sub: 'Pesanan anda akan diproses setelah kami menerima pembayaran anda.',
  label_order_no: 'Nombor Pesanan:', label_email_short: 'E-mel:',
  confirm_total: (a) => `Jumlah: RM${a}`,
  confirm_success_title: 'Pesanan Disahkan!',
  confirm_success_desc: 'Terima kasih atas pesanan anda. Kami akan mula mencetak polaroid cantik anda dengan segera!',
  label_order_status: 'Status Pesanan:', label_track_order: 'Jejak pesanan anda:',
  step_received: 'Pesanan Diterima', step_pending_pay: 'Menunggu Pembayaran',
  step_processing_conf: 'Sedang Diproses', step_delivery: 'Penghantaran',
  btn_track: 'Jejak Pesanan', btn_new_order: 'Buat Pesanan Lain',
  status_pending: 'Menunggu', status_processing: 'Sedang Diproses', status_posted: 'Telah Dihantar',
  status_on_delivery: 'Dalam Penghantaran', status_delivered: 'Telah Diterima',
  status_cancelled: 'Dibatalkan', status_refunded: 'Telah Dipulangkan',
  drawer_title: (n) => `Troli (${n} foto)`, drawer_empty: 'Troli anda kosong',
  drawer_item: (p, q) => `${p} foto × ${q}`,
  drawer_total: (n) => `Jumlah (${n} cetakan)`, btn_view_cart: 'Lihat Troli & Pembayaran',
  orders_title: 'Pesanan Saya', orders_desc: 'Lihat dan urus pesanan anda', orders_empty: 'Belum ada pesanan',
  btn_copy_tracking: 'Salin Penjejakan', btn_write_review: 'Tulis Ulasan', btn_cancel: 'Batal',
  label_tracking_no: 'Nombor Penjejakan',
  track_title: 'Jejak Pesanan Anda', track_desc: 'Masukkan nombor pesanan anda untuk jejak status',
  review_title: 'Tulis Ulasan', review_desc: 'Kongsi pengalaman anda dengan pesanan ini',
  label_rating: 'Penilaian', label_review_title: 'Tajuk',
  placeholder_review_title: 'Cetakan berkualiti tinggi!',
  label_review_comment: 'Ulasan Anda', placeholder_review_comment: 'Ceritakan pengalaman anda...',
  btn_submit_review: 'Hantar Ulasan',
  oauth_title: 'Persediaan Log Masuk Google Diperlukan',
  oauth_desc: 'Google OAuth tidak dikonfigurasi untuk domain ini. Sila ikut langkah-langkah di bawah untuk membetulkannya.',
  oauth_step1: 'Langkah 1: Pergi ke Google Cloud Console',
  oauth_step2: 'Langkah 2: Edit ID Klien OAuth 2.0 anda',
  oauth_step2_desc: 'Cari ID klien yang bermula dengan:',
  oauth_step3: 'Langkah 3: Tambah Asal JavaScript yang Dibenarkan',
  oauth_step3_desc: 'Tambah domain semasa anda (URL yang anda lihat di bar alamat pelayar)',
  oauth_step4: 'Langkah 4: Tambah URI Ubah Hala yang Dibenarkan',
  oauth_step4_desc: 'Tambah URI ubah hala yang tepat ini:',
  btn_copy_uri: 'Salin URI Ubah Hala',
  oauth_step5: 'Langkah 5: Simpan dan tunggu',
  oauth_step5_desc: 'Selepas menyimpan, tunggu beberapa minit untuk perubahan disebarkan, kemudian cuba log masuk semula.',
  btn_close: 'Tutup', btn_try_again: 'Cuba Lagi',
  footer_desc: 'Tukar kenangan digital anda menjadi cetakan polaroid fizikal yang cantik.',
  footer_sizes: 'Saiz Cetakan', footer_features: 'Ciri-ciri',
  feat_premium: 'Kualiti Premium', feat_shipping: 'Penghantaran Pantas',
  feat_text: 'Teks Khas', feat_days: '3-4 Hari Bekerja',
  footer_faq: 'Soalan Lazim & Waranti', footer_why: 'Mengapa Pilih Kami?',
  footer_trust: 'Dipercayai oleh lebih 10,000+ pelanggan gembira di seluruh dunia',
  footer_copy: '© 2024 Polaroid Glossy MY. Hak cipta terpelihara.',
  toast_photos_added: (n) => `${n} foto berjaya ditambah!`,
  toast_compress_fail: 'Gagal memproses beberapa foto',
  toast_no_photo: 'Sila muat naik sekurang-kurangnya satu foto',
  toast_cart_added: (p, q) => `${p} foto × ${q} telah ditambah ke troli!`,
  toast_removed: 'Item telah dibuang dari troli', toast_fill_required: 'Sila isi medan yang diperlukan',
  toast_select_state: 'Sila pilih negeri anda', toast_order_success: 'Pesanan berjaya dibuat!',
  toast_order_fail: 'Gagal membuat pesanan. Sila cuba lagi.',
  toast_cancel_success: 'Pesanan berjaya dibatalkan', toast_cancel_fail: 'Gagal membatalkan pesanan',
  toast_enter_order: 'Sila masukkan nombor pesanan', toast_not_found: 'Pesanan tidak dijumpai',
  toast_track_fail: 'Gagal menjejak pesanan', toast_fill_all: 'Sila isi semua medan',
  toast_review_success: 'Ulasan berjaya dihantar!', toast_review_fail: 'Gagal menghantar ulasan',
  toast_tracking_copied: 'Nombor penjejakan disalin!', toast_uri_copied: 'URI ubah hala disalin!',
  size_2r_desc: 'Saiz dompet - Sesuai untuk kenangan',
  size_3r_desc: 'Saiz foto standard - Sesuai untuk album',
  size_4r_desc: 'Paling popular - Gaya polaroid klasik',
  size_a4_desc: 'Saiz poster - Sesuai untuk paparan',
  size_2r_display: '2R (2.5 x 3.5 inci)', size_3r_display: '3R (3.5 x 5 inci)',
  size_4r_display: '4R (4 x 6 inci)', size_a4_display: 'A4 (8.3 x 11.7 inci)',
  testimonials: [
    { id: 1, name: 'Sarah Mitchell', location: 'New York, USA', text: 'Sangat suka cetakan polaroid saya! Kualiti sangat mengagumkan dan tiba dengan cepat. Sempurna untuk buku skrap saya!', printType: '4R Klasik' },
    { id: 2, name: 'James & Emily', location: 'London, UK', text: 'Kami memesan cetakan untuk ulang tahun kami dan sangat berpuas hati. Ciri teks khas menjadikannya lebih istimewa!', printType: 'Pelbagai Saiz' },
    { id: 3, name: 'Margaret & Tommy', location: 'Sydney, Australia', text: 'Cucu saya dan saya suka melihat kenangan polaroid bersama. Terima kasih atas kualiti yang sangat cantik!', printType: 'Poster A4' },
    { id: 4, name: 'Party Squad', location: 'Toronto, Canada', text: 'Memesan 50 cetakan untuk parti hari jadi kawan kami. Semua orang suka membawa pulang kenangan! Harga yang berpatutan juga.', printType: '3R Standard' }
  ],
  videos: [
    { id: 1, title: 'Cara Ia Berfungsi', description: 'Tonton cara kami mengubah foto digital anda menjadi cetakan polaroid yang cantik', duration: '1:30' },
    { id: 2, title: 'Kualiti Premium', description: 'Lihat proses percetakan kami dan kertas foto premium dalam tindakan', duration: '2:15' },
    { id: 3, title: 'Ciri Teks Khas', description: 'Pelajari cara menambah mesej peribadi pada cetakan polaroid anda', duration: '1:45' }
  ],
  faqCategories: [
    { title: 'Pesanan & Pemprosesan', faqs: [
      { question: 'Berapa lama masa yang diperlukan untuk memproses pesanan?', answer: 'Semua pesanan mengambil masa 3-4 hari bekerja untuk diproses. Sila ambil maklum bahawa kami tidak melayan pembeli yang cerewet atau pesanan segera. Kami mengambil masa untuk memastikan setiap cetakan dibuat dengan penuh perhatian dan teliti.' },
      { question: 'Bagaimana cara membuat pesanan?', answer: 'Hanya muat naik foto anda, pilih saiz dan kuantiti cetakan pilihan anda, tambah teks khas jika mahu, dan teruskan ke pembayaran. Anda boleh membayar menggunakan kaedah pembayaran pilihan anda.' },
      { question: 'Bolehkah saya mengubah pesanan selepas dibuat?', answer: 'Sebaik sahaja pesanan dibuat, ia terus memasuki fasa pemprosesan. Sila semak semula foto dan maklumat anda sebelum melengkapkan pesanan kerana pengubahsuaian tidak dapat dilakukan selepas penyerahan.' },
      { question: 'Bolehkah saya membatalkan pesanan?', answer: 'TIADA PEMBATALAN akan dibuat setelah pesanan dicipta. Sila pastikan semua maklumat adalah betul sebelum membuat pesanan. Kami mula memproses dengan segera selepas pengesahan pesanan.' }
    ]},
    { title: 'Penghantaran & Penyerahan', faqs: [
      { question: 'Bagaimana pesanan saya akan dihantar?', answer: 'Semua pesanan dihantar melalui pos berdaftar dengan nombor penjejakan. Anda akan menerima nombor penjejakan setelah pesanan anda dihantar.' },
      { question: 'Adakah anda menawarkan penghantaran antarabangsa?', answer: 'Buat masa ini, kami hanya menghantar dalam Malaysia. Untuk pesanan antarabangsa, sila hubungi kami untuk berbincang tentang pengurusan.' }
    ]},
    { title: 'Waranti & Tuntutan', faqs: [
      { question: 'Apakah yang diliputi di bawah waranti?', answer: 'Waranti kami meliputi kecacatan pembuatan seperti kesilapan percetakan, kerosakan semasa penghantaran, atau isu kualiti dengan bahan yang digunakan. Kami memastikan setiap cetakan memenuhi piawaian kualiti kami.' },
      { question: 'Bagaimana cara menuntut waranti?', answer: 'Untuk menuntut waranti, sila hubungi kami dengan nombor pesanan dan penerangan masalah anda. Kami mungkin meminta foto cetakan yang rosak atau cacat untuk penilaian. Tuntutan yang sah akan digantikan atau dipulangkan wang.' },
      { question: 'Apakah yang tidak diliputi di bawah waranti?', answer: 'Waranti tidak meliputi kerosakan yang disebabkan oleh pengendalian pelanggan, variasi warna akibat tetapan monitor, atau isu yang timbul daripada imej sumber berkualiti rendah yang disediakan oleh pelanggan.' },
      { question: 'Berapa lama tempoh waranti?', answer: 'Tuntutan waranti mesti dibuat dalam masa 7 hari selepas menerima pesanan anda. Sila periksa pesanan anda dengan segera setelah menerimanya dan laporkan sebarang isu dengan cepat.' }
    ]},
    { title: 'Penyesuaian', faqs: [
      { question: 'Bolehkah saya menambah teks khas pada polaroid saya?', answer: 'Ya! Anda boleh menambah teks khas pada setiap foto semasa proses pemesanan. Teks akan dicetak di bahagian bawah polaroid anda.' },
      { question: 'Format fail apakah yang diterima?', answer: 'Kami menerima format JPG, PNG, dan WEBP. Untuk hasil terbaik, kami mengesyorkan penggunaan imej resolusi tinggi (sekurang-kurangnya 1000x1000 piksel).' }
    ]}
  ],
  faq_page_title: 'Soalan Lazim',
  faq_page_desc: 'Cari jawapan kepada soalan-soalan lazim tentang perkhidmatan percetakan polaroid, penghantaran, dan tuntutan waranti kami.',
  faq_warranty_title: 'Perlu Menuntut Waranti?',
  faq_warranty_desc: 'Jika anda telah menerima produk yang cacat atau rosak, sila hubungi kami untuk memulakan tuntutan waranti.',
  btn_new_order_faq: 'Buat Pesanan Baharu', btn_contact: 'Hubungi Sokongan',
  pay_success_title: 'Pembayaran Berjaya!',
  pay_success_desc: 'Terima kasih atas pembayaran anda. Pesanan anda sedang diproses.',
  pay_order_no: 'Nombor Pesanan:', pay_pending_title: 'Pembayaran Tertangguh',
  pay_pending_desc: 'Pembayaran anda sedang diproses. Sila tunggu sebentar.',
  pay_fail_title: 'Pembayaran Gagal',
  pay_fail_desc: 'Terdapat masalah dengan pembayaran anda. Sila cuba lagi.',
  btn_back_home: 'Kembali ke Laman Utama', btn_view_status: 'Lihat Status Pesanan',
  // Product detail page
  btn_back: 'Kembali',
  label_print: 'Cetakan',
  prod_bestseller: 'Terlaris',
  prod_not_found: 'Produk tidak dijumpai',
  prod_what_makes: (name) => `Apa yang menjadikan ${name} istimewa`,
  tab_description: 'Keterangan', tab_specs: 'Spesifikasi',
  tab_reviews: 'Ulasan', tab_tiktok: 'Ulasan TikTok',
  prod_no_reviews: 'Belum ada ulasan. Jadilah yang pertama!',
  prod_tiktok_title: 'Video pelanggan sebenar dari TikTok',
  prod_tiktok_desc: 'Ini adalah ulasan tulen yang disiarkan di TikTok. Tag kami',
  prod_tiktok_tag: 'untuk ditampilkan di sini.',
  prod_no_tiktok: 'Belum ada ulasan TikTok untuk produk ini.',
  prod_no_tiktok_tag: 'Tag @polaroidglossymy dalam TikTok anda untuk ditampilkan.',
  prod_quality_guarantee: 'Kualiti terjamin · Penggantian percuma untuk kecacatan',
  prod_view_tiktok: 'Lihat di TikTok',
  spec_size: 'Saiz Cetakan', spec_paper: 'Berat Kertas', spec_finish: 'Kemasan',
  spec_method: 'Kaedah Cetak', spec_processing: 'Masa Pemprosesan',
  spec_min_qty: 'Pesanan Minimum', spec_custom_text: 'Teks Khas',
  spec_file_formats: 'Format Fail', spec_max_size: 'Saiz Fail Maksimum',
  spec_custom_text_value: 'Disokong (dicetak di bawah)',
  spec_print: 'cetakan',
};

export const translations: Record<Lang, Trans> = { en, my };
