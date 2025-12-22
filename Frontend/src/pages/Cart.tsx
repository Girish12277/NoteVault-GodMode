import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Heart, ArrowRight, Shield, Clock, CreditCard, Lock, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';

export default function Cart() {
  const { cartItems, removeFromCart, addToWishlist, removeFromWishlist, isInWishlist, cartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate('/auth');
      return;
    }
    navigate('/checkout');
  };

  const toggleWishlist = (noteId: string) => {
    const item = cartItems.find((i) => i.noteId === noteId);
    if (item) {
      if (isInWishlist(noteId)) {
        removeFromWishlist(noteId);
      } else {
        addToWishlist(item.note);
      }
    }
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Ambient Background for Empty State */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] mix-blend-multiply opacity-50" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 max-w-lg mx-auto text-center"
          >
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative h-28 w-28 bg-card rounded-3xl border border-border shadow-2xl flex items-center justify-center mx-auto transform rotate-3">
                <ShoppingCart className="h-12 w-12 text-primary/80" />
                <div className="absolute -top-3 -right-3 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  Empty
                </div>
              </div>
            </div>

            <h1 className="font-display text-4xl font-bold text-foreground mb-4 tracking-tight">
              Your Vault is Empty
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-sm mx-auto">
              The best students are currently studying previously year questions. Don't fall behind.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm mx-auto">
              <Link to="/browse?sort=popular" className="group">
                <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all text-left">
                  <div className="mb-2 h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">Trending Notes</p>
                  <p className="text-xs text-muted-foreground">What others are buying</p>
                </div>
              </Link>
              <Link to="/browse?sort=new" className="group">
                <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all text-left">
                  <div className="mb-2 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors">New Arrivals</p>
                  <p className="text-xs text-muted-foreground">Fresh study material</p>
                </div>
              </Link>
            </div>

            <Link to="/browse">
              <Button size="lg" className="rounded-full px-8 h-12 font-semibold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                Start Discovery
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-2 sm:py-6 lg:py-8 pb-32 lg:pb-8">
        {/* Back Navigation */}
        <Link
          to="/browse"
          className="inline-flex items-center text-[10px] sm:text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors p-1 -ml-1"
        >
          <ArrowRight className="mr-1 h-3 w-3 rotate-180" />
          Back to Browse
        </Link>

        <h1 className="font-display text-lg sm:text-2xl font-bold text-foreground mb-3 break-words text-balance">
          Shopping Cart ({cartItems.length})
        </h1>

        <div className="grid gap-3 lg:gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 min-w-0">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  key={item.noteId}
                  whileHover={{ y: -2, transition: { type: "spring", stiffness: 400 } }}
                  className="group flex gap-3 p-3 rounded-xl bg-card border border-border/60 hover:border-primary/30 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
                >
                  {/* Decorative Gradient Blob on Hover */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <Link to={`/notes/${item.note.id}`} className="shrink-0 relative">
                    <div className="relative overflow-hidden rounded-lg">
                      <img
                        src={item.note.coverImage}
                        alt={item.note.title}
                        className="w-16 h-20 sm:w-24 sm:h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <Link to={`/notes/${item.note.id}`} className="min-w-0 flex-1">
                          <h3 className="font-display font-medium text-sm sm:text-lg text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {item.note.title}
                          </h3>
                        </Link>

                        {/* Mobile: Price & Delete aligned with Title */}
                        <div className="flex items-center gap-2 shrink-0 sm:hidden self-start">
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(item.note.price)}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.noteId)}
                            className="text-muted-foreground hover:text-destructive p-1 -mr-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Desktop: Delete button only (top right) */}
                        <button
                          onClick={() => removeFromCart(item.noteId)}
                          className="hidden sm:block text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-[10px] font-medium text-primary mt-1">
                        {item.note.subject} <span className="text-muted-foreground font-normal">• Sem {item.note.semester}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        {item.note.college}
                      </p>
                    </div>

                    {/* Desktop Bottom Row: Price & Actions (Hidden on Mobile) */}
                    <div className="hidden sm:flex items-end justify-between mt-2">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Price</span>
                        <span className="text-2xl font-bold text-foreground">
                          {formatCurrency(item.note.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleWishlist(item.noteId)}
                          className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors border border-border ${isInWishlist(item.noteId) ? 'bg-red-50 border-red-100 text-red-500' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                        >
                          <Heart className={`h-4 w-4 ${isInWishlist(item.noteId) ? 'fill-current' : ''}`} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary - Visible on Mobile now */}
          <div className="lg:col-span-1 min-w-0">
            <div className="lg:sticky lg:top-24 rounded-2xl bg-card/50 backdrop-blur-xl border border-white/20 p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-xl relative overflow-hidden">
              {/* Glass Reflection */}
              <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />

              <h2 className="font-display text-base sm:text-xl font-bold tracking-tight">Order Summary</h2>

              <div className="space-y-2 sm:space-y-3 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-mono">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform fee</span>
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] uppercase">Free</span>
                </div>
                <div className="border-t border-dashed border-border/50 pt-2 sm:pt-3 mt-2 sm:mt-3">
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span>₹{cartTotal}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Inclusive of all taxes</p>
                </div>
              </div>

              <div className="space-y-3"> {/* Unhidden on mobile */}
                <Button size="lg" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all" onClick={handleCheckout}>
                  <Lock className="mr-2 h-4 w-4" />
                  Secure Checkout
                </Button>

                <Link to="/browse" className="block text-center">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-auto p-0 text-xs w-full">
                    Add more items
                  </Button>
                </Link>
              </div>

              {/* Mobile specific add items link */}
              <div className="sm:hidden text-center">
                <Link to="/browse" className="text-[10px] text-primary hover:underline">Add more items</Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-3 sm:pt-4 border-t border-border/50">
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/50 text-center gap-1">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-800">100% Secure</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50/50 border border-blue-100/50 text-center gap-1">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <span className="text-[10px] sm:text-xs font-bold text-blue-800">Instant Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t border-border lg:hidden z-50 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-300">
          <div className="container px-0 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">Total</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-display">₹{cartTotal}</span>
                <span className="text-[10px] text-muted-foreground ml-1">({cartItems.length} items)</span>
              </div>
            </div>
            <Button
              size="default"
              className="flex-1 font-bold shadow-glow text-sm h-10 max-w-[180px]"
              onClick={handleCheckout}
            >
              Checkout
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
