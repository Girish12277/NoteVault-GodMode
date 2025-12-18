import { Link, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Download, ShieldCheck, ShoppingBag, FileText, Sparkles, Printer } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { MotionButton } from '@/components/ui/MotionButton';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export default function PaymentSuccess() {
  const location = useLocation();
  const { paymentId, orderId } = location.state || {};

  // Protocol 8: Prevention - If no payment data, redirect to home
  if (!paymentId) {
    return <Navigate to="/" replace />;
  }

  // Effect: Dopamine Engineering (Confetti on Mount)
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#34d399', '#059669'] // Emerald palette
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#34d399', '#059669']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <Layout>
      <div className="min-h-[85vh] flex items-center justify-center bg-muted/10 relative overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container max-w-lg px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
            className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden relative"
          >
            {/* Status Strip with Shimmer */}
            <div className="h-2 w-full bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-300 animate-shimmer relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
            </div>

            <div className="p-8 pb-10 text-center space-y-8">
              {/* Animated Success Stamp */}
              <div className="relative mx-auto h-28 w-28">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="absolute inset-0 rounded-full bg-emerald-50 flex items-center justify-center border-[6px] border-white shadow-xl ring-1 ring-black/5"
                >
                  <CheckCircle2 className="h-14 w-14 text-emerald-500 drop-shadow-sm" />
                </motion.div>
                <div className="absolute -right-1 -top-1">
                  <motion.div
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: 0.6, type: "spring" }}
                    className="bg-primary text-primary-foreground text-[11px] font-bold px-3 py-1 rounded-full shadow-lg border border-white/20"
                  >
                    CONFIRMED
                  </motion.div>
                </div>
              </div>

              {/* Headlines */}
              <div className="space-y-3">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-display font-semibold text-foreground tracking-tight"
                >
                  Payment Successful
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground text-sm max-w-xs mx-auto text-balance leading-relaxed"
                >
                  Your transaction has been verified. The notes are now available in your personal vault.
                </motion.p>
              </div>

              {/* Asset Ticket Card (Perforated) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="relative bg-white border border-border/40 rounded-lg shadow-sm overflow-hidden group"
                style={{
                  maskImage: 'radial-gradient(circle at 0px 10px, transparent 0, transparent 0, black 0)', // Fallback
                  WebkitMaskImage: 'radial-gradient(circle at 10px center, transparent 10px, black 10.5px) -10px 50% / 100% 100% no-repeat, radial-gradient(circle at right 10px center, transparent 10px, black 10.5px) 10px 50% / 100% 100% no-repeat'
                }}
              >
                {/* Perforation Dots (Visual Only as Backup) */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-muted/10 shadow-inner border border-border/20 z-20" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-6 w-6 rounded-full bg-muted/10 shadow-inner border border-border/20 z-20" />
                <div className="absolute top-1/2 left-4 right-4 h-px border-t border-dashed border-border/50" />

                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border/50">
                  {/* Left: Info */}
                  <div className="flex-1 p-5 space-y-4 text-left bg-gradient-to-br from-slate-50/50 to-transparent">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-1">Receipt ID</p>
                        <p className="font-mono text-sm font-medium text-foreground">{orderId}</p>
                      </div>
                      <ShieldCheck className="h-4 w-4 text-emerald-500/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Payment Ref</p>
                      <p className="font-mono text-xs text-muted-foreground break-all">{paymentId}</p>
                    </div>
                  </div>

                  {/* Right: Action */}
                  <div className="sm:w-32 bg-slate-50/80 flex flex-col items-center justify-center p-2 gap-2 cursor-pointer hover:bg-emerald-50/50 transition-colors group/btn"
                    onClick={async () => {
                      try {
                        const response = await api.get(`/payments/invoice/${paymentId}`, {
                          responseType: 'blob'
                        });

                        const blob = new Blob([response.data], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Invoice_${paymentId}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                      } catch (err: any) {
                        console.error('Invoice download failed', err);
                        alert(`Error: ${err.response?.data?.message || 'Could not download invoice'}`);
                      }
                    }}
                  >
                    <div className="h-10 w-10 rounded-full bg-white border border-border shadow-sm flex items-center justify-center group-hover/btn:scale-110 transition-transform group-hover/btn:border-emerald-200">
                      <Download className="h-4 w-4 text-slate-600 group-hover/btn:text-emerald-600 transition-colors" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 group-hover/btn:text-emerald-700 uppercase tracking-tight">Invoice</span>
                  </div>
                </div>
              </motion.div>

              {/* Primary Actions */}
              <div className="space-y-3 pt-4">
                <Link to="/library" className="block">
                  <MotionButton size="lg" className="w-full h-14 text-base font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all bg-primary hover:bg-primary/90 text-white rounded-xl">
                    Access My Vault
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </MotionButton>
                </Link>

                <Link to="/browse" className="block">
                  <MotionButton variant="ghost" className="text-muted-foreground hover:text-foreground text-sm h-10 w-full hover:bg-black/5">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Continue Browsing
                  </MotionButton>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Footer Trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 text-center"
          >
            <p className="text-[10px] text-muted-foreground/60 flex items-center justify-center gap-1.5 uppercase tracking-widest font-medium">
              <ShieldCheck className="h-3 w-3" />
              Verified & Secure Transaction
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
