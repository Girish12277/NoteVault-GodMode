import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  ShoppingCart,
  CreditCard,
  Download,
  Shield,
  Clock,
  ArrowRight,
  BookOpen,
  IndianRupee,
  CheckCircle2,
  Upload,
  UserCheck,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { MotionButton } from '@/components/ui/MotionButton';
import { SectionReveal } from '@/components/layout/SectionReveal';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Persona = 'buyer' | 'seller';

const buyerSteps = [
  {
    icon: Search,
    title: 'Find Notes',
    description: 'Search by subject, university, or semester. Our personalized recommendations show you the most relevant notes.',
    action: 'Type "Physics 101"...'
  },
  {
    icon: BookOpen,
    title: 'Preview First',
    description: 'Preview the first 5 pages of any note for free. Verify quality before you spend a single rupee.',
    action: 'Viewing Sample...'
  },
  {
    icon: ShoppingCart,
    title: 'Add & Save',
    description: 'Buy 3+ notes to unlock automatic bulk discounts. The more you learn, the less you pay.',
    action: 'Discount Applied!'
  },
  {
    icon: Download,
    title: 'Instant Access',
    description: 'Pay via UPI/Card and get instant access. Download anytime with your unique digital watermark.',
    action: 'Download Ready'
  },
];

const sellerSteps = [
  {
    icon: Upload,
    title: 'Upload PDF',
    description: 'Upload your notes, set your price, and add details. No approval wait times - live instantly.',
    action: 'Uploading...'
  },
  {
    icon: UserCheck,
    title: 'Students Buy',
    description: 'Your notes are recommended to students from your university. You get notified for every sale.',
    action: 'New Order!'
  },
  {
    icon: Wallet,
    title: 'Get Paid',
    description: 'Earnings hit your wallet in 24 hours. Withdraw to your bank anytime (min ₹100).',
    action: '₹500 Credited'
  },
  {
    icon: TrendingUp,
    title: 'Grow Brand',
    description: 'Build your reputation with ratings and reviews. Become a "Pro Seller" for lower fees.',
    action: 'Top Rated Badge'
  },
];

const features = [
  {
    icon: Shield,
    title: '24-Hour Refund',
    description: 'Full refund if not satisfied within 24h.',
  },
  {
    icon: CheckCircle2,
    title: 'Verified Notes',
    description: 'Quality checked for academic accuracy.',
  },
  {
    icon: Clock,
    title: 'Instant Access',
    description: 'No waiting. Start studying immediately.',
  },
  {
    icon: IndianRupee,
    title: 'Best Prices',
    description: 'Notes starting from just ₹10.',
  },
];

export default function HowItWorksPage() {
  const [activePersona, setActivePersona] = useState<Persona>('buyer');

  const steps = activePersona === 'buyer' ? buyerSteps : sellerSteps;

  return (
    <Layout>
      <div className="relative min-h-screen bg-background overflow-hidden">
        {/* Decorative Background Blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[80px] -z-10" />

        <div className="container py-12 md:py-24">
          {/* Dynamic Hero */}
          <div className="text-center mb-16 relative">
            <SectionReveal>
              <Badge variant="outline" className="mb-4 bg-background/50 backdrop-blur">
                The NotesMarket Ecosystem
              </Badge>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-foreground to-primary mb-6 animate-gradient-x">
                How It Works
              </h1>

              {/* Persona Toggle */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="inline-flex p-1 bg-muted/50 backdrop-blur rounded-full border border-border/50 shadow-inner">
                  <button
                    onClick={() => setActivePersona('buyer')}
                    className={cn(
                      "px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform",
                      activePersona === 'buyer'
                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    I want to BUY Notes
                  </button>
                  <button
                    onClick={() => setActivePersona('seller')}
                    className={cn(
                      "px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform",
                      activePersona === 'seller'
                        ? "bg-accent text-accent-foreground shadow-lg scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    )}
                  >
                    I want to SELL Notes
                  </button>
                </div>
              </div>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {activePersona === 'buyer'
                  ? "Get exam-ready notes from university toppers in minutes. It's safe, fast, and instant."
                  : "Turn your hard work into passive income. Upload your notes once, earn royalties forever."}
              </p>
            </SectionReveal>
          </div>

          <SectionReveal delay={0.1}>
            {/* Trust Dock */}
            <div className="hidden md:flex justify-center gap-8 mb-20 pointer-events-none select-none">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80 bg-background/40 px-4 py-2 rounded-full border border-border/20 backdrop-blur-sm">
                  <f.icon className="h-4 w-4 text-primary" />
                  {f.title}
                </div>
              ))}
            </div>
          </SectionReveal>

          {/* The Living Pipeline */}
          <SectionReveal delay={0.2} className="relative mb-32 max-w-5xl mx-auto">
            {/* Mobile Line */}
            <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gradient-to-b from-primary/50 to-transparent md:hidden" />

            {/* Desktop Pulse Line (The Connector) */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/50 to-transparent -translate-x-1/2 rounded-full" />

            <div className="grid gap-12 md:gap-24 relative z-10">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className={cn(
                    "relative flex flex-col md:flex-row items-center gap-6 md:gap-12 transition-all duration-500 group/step",
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse text-right"
                  )}
                >
                  {/* Center Node (Desktop) */}
                  <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-background border-2 border-primary shadow-[0_0_10px_rgba(249,115,22,0.5)] z-20 transition-transform duration-300 group-hover/step:scale-125" />

                  {/* Step Number Badge (Mobile Only) */}
                  <div className="absolute left-0 top-0 md:hidden shrink-0 z-10 bg-background rounded-full p-2 border border-border shadow-sm">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                      activePersona === 'buyer' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                    )}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Content Card (Ceramic Upgrade) */}
                  <div className={cn(
                    "group relative w-full md:w-[45%] ml-10 md:ml-0 bg-background border border-primary/10 p-6 sm:p-8 rounded-2xl shadow-lg shadow-black/5 hover:shadow-xl hover:bg-muted/30 transition-all duration-300 hover:-translate-y-1 block",
                    index % 2 === 0 ? "text-left" : "md:text-right text-left"
                  )}>
                    {/* Icon */}
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-black/5",
                      activePersona === 'buyer' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent",
                      "group-hover:scale-110 transition-transform duration-300",
                      index % 2 !== 0 ? "md:ml-auto" : ""
                    )}>
                      <step.icon className="h-7 w-7" />
                    </div>

                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors font-display">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>

                    {/* Micro-Interaction Label */}
                    <div className={cn(
                      "mt-6 inline-flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/50 px-3 py-1 rounded border border-border/50",
                      index % 2 !== 0 ? "md:flex-row-reverse" : ""
                    )}>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {step.action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionReveal>

          {/* Trust Bridge (Buyer Protection) */}
          <SectionReveal delay={0.25} className="mb-20">
            <div className="max-w-4xl mx-auto rounded-3xl border border-primary/10 bg-gradient-to-b from-primary/5 to-transparent p-1">
              <div className="bg-background/80 backdrop-blur-md rounded-[22px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                <div className="space-y-4 max-w-lg">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-100 mb-2">
                    <Shield className="h-3 w-3 fill-emerald-100" />
                    NoteVault Guarantee
                  </div>
                  <h3 className="text-2xl font-bold font-display">100% Buyer Protection Promise</h3>
                  <p className="text-muted-foreground">
                    Every purchase is backed by our quality assurance. If a note is misleading or fake, you get a full refund within 24 hours. No questions asked.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-foreground bg-white border border-border px-3 py-1.5 rounded-full shadow-sm">
                        <f.icon className="h-3.5 w-3.5 text-primary" />
                        {f.title}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Anchor */}
                <div className="shrink-0 relative h-32 w-32 md:h-40 md:w-40 flex items-center justify-center">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                  <div className="relative bg-background rounded-full h-24 w-24 border-4 border-white shadow-xl flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -bottom-2 bg-foreground text-background text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                    VERIFIED
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>

          {/* CTA Section */}
          <SectionReveal delay={0.3} className="relative text-center max-w-3xl mx-auto pb-20">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 hover:from-primary/30 blur-3xl -z-10 rounded-full opacity-50" />

            <Card className="border-none bg-background/60 backdrop-blur-xl shadow-2xl relative overflow-hidden ring-1 ring-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-50" />
              <CardContent className="p-12 relative z-10">
                <h2 className="font-display text-4xl font-bold mb-4 tracking-tight">
                  {activePersona === 'buyer' ? "Ready to Ace Your Exams?" : "Start Your Passive Income?"}
                </h2>
                <p className="text-lg text-muted-foreground mb-8 text-balance">
                  {activePersona === 'buyer'
                    ? "Join thousands of students who stopped stressing and started scoring. Access the vault today."
                    : "Your notes are worth more than you think. Join the creator economy now."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to={activePersona === 'buyer' ? "/browse" : "/seller"}>
                    <MotionButton size="lg" className="rounded-full px-8 h-12 text-base font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105">
                      {activePersona === 'buyer' ? "Browse Notes Now" : "Become a Seller"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </MotionButton>
                  </Link>
                  <Link to="/auth">
                    <MotionButton size="lg" variant="outline" className="rounded-full px-8 h-12 text-base bg-white/50 hover:bg-white border-primary/20 text-foreground font-semibold">
                      Create Free Account
                    </MotionButton>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </SectionReveal>

        </div>
      </div>
    </Layout>
  );
}
