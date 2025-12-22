import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, RefreshCw, ArrowLeft, MessageSquare, CreditCard, ShieldCheck, Wallet, Wifi } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function PaymentFailed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error, orderId, paymentId } = location.state || {};

  const handleRetry = () => {
    navigate('/checkout');
  };

  return (
    <Layout>
      <div className="container py-8 sm:py-16 flex flex-col items-center justify-center min-h-[60vh] bg-background">
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-300">

          {/* 1. Psychological Shift: Amber Warning instead of Red Error */}
          <div className="relative mx-auto h-24 w-24">
            <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse opacity-75" />
            <div className="absolute inset-2 rounded-full border border-amber-500/30" />
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-amber-50 border-4 border-background shadow-xl">
              <AlertCircle className="h-10 w-10 text-amber-500 stroke-[2.5]" />
            </div>
            {/* Safe Badge Overlap */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm gap-1 py-1 px-3 backdrop-blur-md">
                <ShieldCheck className="h-3 w-3 fill-emerald-100" />
                Funds Safe: Not Deducted
              </Badge>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
              Transaction Paused
            </h1>
            <p className="text-muted-foreground text-base max-w-[320px] mx-auto leading-relaxed">
              {error || "We couldn't verify this payment. It might be a momentary bank issue or internet glitch."}
            </p>
            {orderId && (
              <Badge variant="secondary" className="font-mono text-xs text-muted-foreground/70 bg-muted/50 border-border/50 select-all">
                Ref: {orderId}
              </Badge>
            )}
          </div>

          {/* 2. Recovery Deck */}
          <Card className="p-1 border-border/60 bg-muted/20 backdrop-blur-sm shadow-sm">
            <div className="grid gap-2 p-4 bg-background rounded-xl border border-border/50">
              <Button
                size="lg"
                className="w-full font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] bg-primary text-primary-foreground h-12 text-base"
                onClick={handleRetry}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Payment
              </Button>
              <Link to="/cart" className="w-full">
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
                  Choose Different Method
                </Button>
              </Link>
            </div>
          </Card>

          {/* 3. Visual Checklist (Non-Panic Troubleshooting) */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
              <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center">
                <Wifi className="h-4 w-4 text-primary/60" />
              </div>
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wide">Internet</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
              <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary/60" />
              </div>
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wide">Balance</span>
            </div>
            <Link to="/contact" className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center group-hover:border-primary/40 group-hover:text-primary transition-colors">
                <MessageSquare className="h-4 w-4 text-primary/60 group-hover:text-primary" />
              </div>
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wide group-hover:text-primary">Support</span>
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}
