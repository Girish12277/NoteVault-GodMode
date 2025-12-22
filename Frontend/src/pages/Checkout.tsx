import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Clock,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Tag,
  CheckCircle2,
  IndianRupee,
  Lock,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import api from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

const paymentMethods = [
  { id: 'upi', name: 'UPI', shortName: 'UPI', icon: Smartphone, description: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', name: 'Credit/Debit Card', shortName: 'Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', name: 'Net Banking', shortName: 'Bank', icon: Building2, description: 'All major banks' },
  { id: 'wallet', name: 'Wallets', shortName: 'Wallet', icon: Wallet, description: 'Paytm, PhonePe, Amazon Pay' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart, removeFromCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState('upi');

  // Input State
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null); // Using any temporarily to avoid import issues, ideally CouponValidationResponse
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Calculate discounts
  const itemCount = cartItems.length;
  let discountPercentage = 0;
  if (itemCount >= 10) discountPercentage = 15;
  else if (itemCount >= 5) discountPercentage = 10;
  else if (itemCount >= 3) discountPercentage = 5;

  const subtotal = cartTotal;
  const bulkDiscount = Math.round((subtotal * discountPercentage) / 100);
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = subtotal - bulkDiscount - couponDiscount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      setIsValidatingCoupon(true);
      const noteIds = cartItems.map(item => item.noteId);
      const currentTotal = subtotal - bulkDiscount;

      const { data } = await api.post('/coupons/validate', {
        code: couponCode,
        amount: currentTotal,
        noteIds
      });

      if (data.success && data.data.isValid) {
        setAppliedCoupon(data.data);
        toast.success(`Coupon applied! Saved ₹${data.data.discountAmount}`);
      } else {
        setAppliedCoupon(null);
        toast.error(data.data.message || 'Invalid coupon');
      }
    } catch (error: any) {
      setAppliedCoupon(null);
      toast.error(error.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Load Razorpay Script dynamically
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      navigate('/auth');
      return;
    }

    // Validation
    if (paymentMethod === 'upi' && !upiId.includes('@')) {
      toast.error('Please enter a valid UPI ID (e.g., user@upi)');
      return;
    }
    if (paymentMethod === 'card' && (cardDetails.number.length < 16 || cardDetails.cvv.length < 3)) {
      toast.error('Please enter valid card details');
      return;
    }
    if (paymentMethod === 'netbanking' && !selectedBank) {
      toast.error('Please select a bank');
      return;
    }

    try {
      setIsProcessing(true);

      // 1. Create Order on Backend
      const noteIds = cartItems.map(item => item.noteId);
      const { data: orderResponse } = await api.post('/payments/create-order', {
        noteIds,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }

      const { orderId, amount, currency, key } = orderResponse.data;

      // 2. Load Razorpay SDK
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Payment gateway failed to load. Check your internet connection and refresh the page.');
        setIsProcessing(false);
        return;
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: key,
        amount: amount.toString(),
        currency: currency,
        name: "StudyVault Notes",
        description: `Purchase of ${cartItems.length} notes`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // 4. Verify Payment on Backend
            const verifyResponse = await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            if (verifyResponse.data.success) {
              toast.success('Payment successful!');
              clearCart();
              navigate('/payment/success', {
                state: {
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id
                }
              });
            } else {
              toast.error('Payment verification failed. Please contact support.');
              navigate('/payment/failed', {
                state: {
                  error: 'Signature verification failed. Funds if deducted will be auto-refunded.',
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id
                }
              });
            }
          } catch (err: any) {
            console.error('Verification error:', err);
            toast.error('Payment verification failed');
            navigate('/payment/failed', {
              state: {
                error: err?.message || 'Verification network error',
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id
              }
            });
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone, // If available
          method: paymentMethod, // Hinting preference
          vpa: paymentMethod === 'upi' ? upiId : undefined, // Prefill UPI VPA if entered
          bank: paymentMethod === 'netbanking' ? selectedBank : undefined, // Prefill Bank Code
          wallet: paymentMethod === 'wallet' ? selectedWallet : undefined // Prefill Wallet
        },
        theme: {
          color: "#0F172A", // Primary color (Slate-950)
        },
        config: {
          display: {
            hide: [{ method: 'paylater' }],
            preferences: { show_default_blocks: true }
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response: any) {
        toast.error(response.error.description || 'Payment failed');
        setIsProcessing(false);
      });

    } catch (error: any) {
      console.error('Payment Error:', error);

      toast.error(error.response?.data?.message || 'Payment declined. Check your card details or try a different payment method.');
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center">
              <CreditCard className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground">Your cart is empty</h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Looks like you haven't added any notes yet.
            </p>
          </div>
          <Link to="/browse">
            <Button size="lg" className="min-w-[200px]">Browse Notes</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const getPaymentMethodName = () => {
    return paymentMethods.find(m => m.id === paymentMethod)?.name || 'Online';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-muted/10 pb-20 lg:pb-8">
        <div className="container py-4 lg:py-8 max-w-6xl px-4">
          {/* Back Button - Compact */}
          <Link
            to="/cart"
            className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-primary mb-6 transition-colors group"
          >
            <ArrowLeft className="mr-1 h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Back to Cart
          </Link>

          <div className="flex flex-col lg:grid gap-6 lg:gap-12 lg:grid-cols-3 items-start">
            {/* Left Column - Payment and Items */}
            <div className="lg:col-span-2 space-y-6 min-w-0 w-full">

              {/* Header */}
              <div className="mb-2 space-y-1">
                <h1 className="font-display text-xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  Secure Checkout
                </h1>
                <p className="text-muted-foreground text-xs flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Bank-grade SSL encryption enabled
                </p>
              </div>

              {/* 1. Order Items (Moved to Top) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
              >
                <div className="bg-muted/30 py-3 px-4 border-b border-border/50 flex justify-between items-center">
                  <h2 className="font-semibold text-xs">Order Items</h2>
                  <Badge variant="secondary" className="text-xs font-normal">{cartItems.length} Notes</Badge>
                </div>
                <div className="divide-y divide-border/50 max-h-[240px] overflow-y-auto scrollbar-thin p-1">
                  {cartItems.map((item) => (
                    <div key={item.noteId} className="flex gap-4 p-3 hover:bg-muted/20 transition-colors rounded-lg mx-1 my-1">
                      <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md bg-muted border border-border/50 shadow-sm relative group">
                        <img
                          src={item.note.coverImage || 'https://placehold.co/100x140?text=Note'}
                          alt={item.note.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/5" />
                      </div>
                      <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-center">
                        <h4 className="font-medium text-xs text-foreground line-clamp-1 leading-tight">
                          {item.note.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {item.note.subject}
                        </p>
                      </div>
                      <div className="flex flex-col justify-center text-right">
                        <p className="font-bold text-xs">{formatCurrency(item.note.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Payment Method Selection - TILES */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <h2 className="font-display text-base sm:text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Payment Method
                </h2>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 sm:gap-3">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={cn(
                          "cursor-pointer group relative",
                          // Mobile: Simple Radio Row
                          "flex items-center gap-2.5 p-0 sm:p-4",
                          // Desktop: Card/Tile Styles
                          "sm:flex-col sm:justify-center sm:rounded-xl sm:border-2 sm:transition-all sm:duration-300",
                          // Desktop Active States
                          paymentMethod === method.id
                            ? 'sm:border-primary sm:bg-primary/5 sm:shadow-md sm:shadow-primary/10 sm:scale-[1.02]'
                            : 'sm:border-border/60 sm:bg-card sm:hover:bg-muted/50 sm:hover:border-primary/30'
                        )}
                      >
                        {/* Mobile: Standard Radio Button (Forced Tiny Size) */}
                        <div className="sm:hidden flex items-center justify-center">
                          <RadioGroupItem value={method.id} id={method.id} className="h-3 w-3 border-[1.5px] text-primary" />
                        </div>
                        {/* Desktop: Hidden Radio */}
                        <RadioGroupItem value={method.id} className="sr-only hidden sm:block" />

                        {/* Icon: Small on Mobile, Large on Desktop */}
                        <div className={cn(
                          "shrink-0 transition-all duration-300 flex items-center justify-center",
                          "h-5 w-5 sm:h-10 sm:w-10 sm:rounded-full",
                          paymentMethod === method.id
                            ? 'text-primary sm:bg-primary sm:text-primary-foreground sm:shadow-lg'
                            : 'text-muted-foreground sm:bg-muted sm:text-muted-foreground group-hover:text-primary sm:group-hover:bg-primary/10'
                        )}>
                          <method.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>

                        {/* Text Label */}
                        <span className={cn(
                          "text-xs sm:text-xs font-bold transition-colors leading-tight",
                          paymentMethod === method.id ? 'text-foreground sm:text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        )}>
                          <span className="sm:hidden">{method.name}</span> {/* Mobile: Full Name */}
                          <span className="hidden sm:inline">{method.name}</span> {/* Desktop: Full Name */}
                        </span>

                        {/* Desktop Checkmark (Hidden on Mobile) */}
                        {paymentMethod === method.id && (
                          <motion.div
                            layoutId="check"
                            className="hidden sm:flex absolute top-2 right-2 h-4 w-4 rounded-full bg-primary items-center justify-center shadow-sm z-10"
                          >
                            <Check className="h-2.5 w-2.5 text-white" />
                          </motion.div>
                        )}
                      </label>
                    ))}
                  </div>
                </RadioGroup>

                {/* Dynamic Input Fields Container */}
                <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm relative overflow-hidden">
                  {/* Background Decor */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={paymentMethod}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="relative z-10 max-w-md mx-auto"
                    >
                      {/* INPUTS START */}
                      {/* UPI Input */}
                      {paymentMethod === 'upi' && (
                        <div className="space-y-4">
                          <div className="text-center space-y-1 mb-6">
                            <h3 className="font-semibold text-foreground">Complete Payment via UPI</h3>
                            <p className="text-xs text-muted-foreground">Instant verification • Zero fees</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="upiId" className="text-xs font-medium ml-1">UPI ID / VPA</Label>
                            <div className="relative group">
                              <Input
                                id="upiId"
                                placeholder="username@oksbi"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className="pl-10 h-11 transition-all border-border group-hover:border-primary/50 focus:border-primary focus:ring-primary/20"
                              />
                              <Smartphone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-xs text-muted-foreground ml-1">Securely processed by Razorpay</p>
                          </div>
                        </div>
                      )}

                      {/* Card Inputs */}
                      {paymentMethod === 'card' && (
                        <div className="space-y-4">
                          <div className="text-center space-y-1 mb-6">
                            <h3 className="font-semibold text-foreground">Secure Card Payment</h3>
                            <p className="text-xs text-muted-foreground">AES-256 Bit Encryption</p>
                          </div>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium ml-1">Card Number</Label>
                              <div className="relative group">
                                <Input
                                  placeholder="0000 0000 0000 0000"
                                  maxLength={19}
                                  value={cardDetails.number}
                                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                  className="pl-10 font-mono h-11 transition-all border-border group-hover:border-primary/50 focus:border-primary focus:ring-primary/20"
                                />
                                <CreditCard className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                {/* Visa/Mastercard Logos Placeholder */}
                                <div className="absolute right-3 top-3 flex gap-1 opacity-50">
                                  <div className="h-5 w-8 bg-muted rounded-sm" />
                                  <div className="h-5 w-8 bg-muted rounded-sm" />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium ml-1">Expiry</Label>
                                <Input
                                  placeholder="MM/YY"
                                  maxLength={5}
                                  value={cardDetails.expiry}
                                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                  className="h-11 text-center font-mono"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium ml-1">CVV</Label>
                                <div className="relative group">
                                  <Input
                                    placeholder="123"
                                    maxLength={3}
                                    type="password"
                                    value={cardDetails.cvv}
                                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                    className="pl-10 h-11 font-mono tracking-widest"
                                  />
                                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium ml-1">Cardholder Name</Label>
                              <Input
                                placeholder="Name as on card"
                                value={cardDetails.name}
                                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                className="h-11 uppercase"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Netbanking Select */}
                      {paymentMethod === 'netbanking' && (
                        <div className="space-y-4">
                          <div className="text-center space-y-1 mb-6">
                            <h3 className="font-semibold text-foreground">Internet Banking</h3>
                            <p className="text-xs text-muted-foreground">Select from major banks</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium ml-1">Select Bank</Label>
                            <Select value={selectedBank} onValueChange={setSelectedBank}>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Choose your bank" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HDFC">HDFC Bank</SelectItem>
                                <SelectItem value="ICIC">ICICI Bank</SelectItem>
                                <SelectItem value="SBIN">State Bank of India</SelectItem>
                                <SelectItem value="AXIS">Axis Bank</SelectItem>
                                <SelectItem value="KKBK">Kotak Mahindra Bank</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {/* Wallet Select */}
                      {paymentMethod === 'wallet' && (
                        <div className="space-y-4">
                          <div className="text-center space-y-1 mb-6">
                            <h3 className="font-semibold text-foreground">Digital Wallet</h3>
                            <p className="text-xs text-muted-foreground">Seamless payment via wallet</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium ml-1">Select Wallet</Label>
                            <RadioGroup value={selectedWallet} onValueChange={setSelectedWallet} className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                              {['Paytm', 'PhonePe', 'Amazon', 'Freecharge'].map((w) => (
                                <label key={w} className={cn(
                                  "flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors",
                                  // Minimalist style
                                  selectedWallet === w ? "bg-primary/5 text-primary" : "hover:bg-muted/50 text-muted-foreground"
                                )}>
                                  <RadioGroupItem value={w} id={w} className="text-primary h-3 w-3 border-[1.5px] shrink-0" />
                                  <span className={cn("text-[10px] sm:text-xs font-medium truncate", selectedWallet === w && "font-bold")}>{w}</span>
                                </label>
                              ))}
                            </RadioGroup>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>


              {/* 2. Billing Details (Compact Read-Only) */}
              <div className="rounded-lg border border-border bg-card/60 p-3 items-center justify-between text-[10px] hidden sm:flex">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-medium">Billing Verified</p>
                    <p className="text-muted-foreground text-[10px]">{user?.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5">Receipt Ready</Badge>
              </div>

              {/* Mobile Billing Details (Extra Compact) */}
              <div className="rounded-lg border border-border bg-card/30 p-2 flex items-center gap-2 text-[10px] sm:hidden">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0 flex items-baseline justify-between">
                  <span className="text-muted-foreground truncate">{user?.email}</span>
                  <span className="text-emerald-700 font-medium whitespace-nowrap ml-2">Verified</span>
                </div>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1 min-w-0 w-full">
              <div className="sticky top-24 space-y-6">
                <Card className="shadow-xl bg-card/80 backdrop-blur-md border border-primary/10 ring-1 ring-border/50 relative overflow-hidden">
                  {/* Gold Glow Top */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-orange-400 to-primary" />

                  <CardHeader className="py-4 px-5 border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-base font-semibold">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 p-5">
                    {/* Coupon Input */}
                    <div className="space-y-3">
                      {appliedCoupon ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-emerald-200 flex items-center justify-center">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-emerald-900 truncate">{appliedCoupon.code}</p>
                              <p className="text-xs text-emerald-700 font-medium">₹{appliedCoupon.discountAmount} SAVED</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-emerald-700 hover:text-emerald-900 hover:bg-emerald-200/50 px-2"
                            onClick={() => {
                              setAppliedCoupon(null);
                              setCouponCode('');
                            }}
                          >
                            Remove
                          </Button>
                        </motion.div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Coupon Code"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value);
                              setAppliedCoupon(null);
                            }}
                            className="uppercase font-mono text-xs sm:text-xs h-10 border-dashed focus:border-solid"
                          />
                          <Button variant="secondary" className="h-10" onClick={handleApplyCoupon} disabled={isValidatingCoupon}>
                            {isValidatingCoupon ? '...' : 'Apply'}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium">₹{subtotal}</span>
                      </div>

                      {/* Animated Price Changes */}
                      <AnimatePresence>
                        {bulkDiscount > 0 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-between text-emerald-600">
                            <span>Bulk Discount ({discountPercentage}%)</span>
                            <span>-₹{bulkDiscount}</span>
                          </motion.div>
                        )}

                        {couponDiscount > 0 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-between text-emerald-600">
                            <span>Coupon Discount</span>
                            <span>-₹{couponDiscount}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex justify-between pt-4 border-t border-border mt-2">
                        <span className="font-bold text-lg">Total</span>
                        <div className="text-right">
                          <motion.span
                            key={finalTotal}
                            initial={{ scale: 1.2, color: '#f97316' }}
                            animate={{ scale: 1, color: 'currentColor' }}
                            className="font-bold text-xl flex items-center justify-end gap-0.5"
                          >
                            <IndianRupee className="h-5 w-5" />
                            {finalTotal}
                          </motion.span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all relative overflow-hidden group"
                      onClick={handlePayment}
                      disabled={isProcessing}
                    >
                      {/* Shimmer Effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

                      {isProcessing ? (
                        <>
                          <Clock className="mr-2 h-5 w-5 animate-spin" />
                          Processing Securely...
                        </>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Lock className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          Pay ₹{finalTotal} securely
                        </span>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-70">
                      <Shield className="h-3 w-3" />
                      256-Bit SSL Encrypted Payment
                    </div>
                  </CardContent>
                </Card>

                {/* Trust/Bulk Info - Compact Mobile */}
                {itemCount < 3 && (
                  <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs flex gap-2 items-start">
                    <Zap className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-blue-900 text-[10px] uppercase tracking-wide mb-0.5">Pro Tip</p>
                      <p className="text-blue-700 text-[10px] leading-snug">
                        Add <strong>{3 - itemCount}</strong> more items for <span className="underline decoration-blue-400 decoration-wavy">5% Off</span>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
