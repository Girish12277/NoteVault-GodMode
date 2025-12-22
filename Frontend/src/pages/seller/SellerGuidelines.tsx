import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  FileText,
  IndianRupee,
  Shield,
  BookOpen,
  Camera,
  Trophy,
  ArrowRight,
  TrendingUp,
  Ban,
  Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SellerGuidelines() {
  const [price, setPrice] = useState([100]);
  const earnings = Math.floor(price[0] * 0.85);

  const roadmapSteps = [
    { title: 'Upload', desc: 'PDF or Handwritten', icon: Upload },
    { title: 'Review', desc: 'Instant AI Check', icon: FileText },
    { title: 'Live', desc: 'Students Buy', icon: BookOpen },
    { title: 'Get Paid', desc: 'Every 24 Hours', icon: IndianRupee },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-32">
        <div className="container py-12 md:py-16 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-16 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-primary/20 blur-[100px] -z-10" />
            <Badge variant="outline" className="mb-4 bg-background/50 backdrop-blur border-primary/20 text-primary">
              Seller Academy
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Master the Art of Selling
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Top sellers earn over ₹5,000/month. Here is the blueprint to join them.
            </p>
          </div>

          {/* 1. The Interactive Earnings Simulator */}
          <Card className="mb-20 border-primary/20 shadow-2xl shadow-primary/5 bg-gradient-to-br from-card to-primary/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-[80px]" />
            <div className="grid md:grid-cols-2 gap-12 p-8 md:p-12 relative z-10">
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-3xl font-bold mb-2">Earnings Calculator</h2>
                  <p className="text-muted-foreground">See how much you keep from every sale.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-medium">If you sell for:</label>
                    <span className="text-2xl font-bold">₹{price[0]}</span>
                  </div>
                  <Slider
                    value={price}
                    onValueChange={setPrice}
                    max={500}
                    step={10}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₹0</span>
                    <span>₹500</span>
                  </div>
                </div>

                <div className="flex gap-4 items-center p-4 bg-background/50 rounded-xl border border-border/50 backdrop-blur-sm">
                  <Shield className="h-5 w-5 text-accent" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">Next Day Payouts:</span> Money hits your wallet 24h after sale.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative text-center p-10 bg-background rounded-3xl border border-border shadow-xl w-full max-w-xs ring-4 ring-primary/10">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">You Earn</p>
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-2 flex items-center justify-center gap-1">
                    <span className="text-3xl mt-2">₹</span>
                    {earnings}
                  </div>
                  <Badge variant="secondary" className="mt-2 bg-accent/10 text-accent hover:bg-accent/20">
                    85% Commission
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Visual "Do vs Don't" Gallery */}
          <div className="mb-20">
            <h2 className="font-display text-3xl font-bold text-center mb-12">Quality Standards</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* The Good */}
              <div className="space-y-4">
                <div className="bg-accent/5 border-2 border-accent/20 rounded-2xl p-1">
                  <div className="bg-card rounded-xl p-6 h-64 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&q=80&w=800')] opacity-10 bg-cover bg-center" />
                    <FileText className="h-16 w-16 text-accent mb-4" />
                    <h3 className="font-bold text-accent text-lg">Crisp & Clear</h3>
                    <p className="text-sm text-accent/80 mt-2 max-w-[200px]">High resolution scans with good lighting. typed text is legible.</p>
                    <div className="absolute top-4 right-4 bg-accent text-white p-1 rounded-full">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="px-4">
                  <h4 className="font-semibold text-accent flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4" /> Do This
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Use a scanning app (CamScanner/Adobe Scan)</li>
                    <li>Keep pages flat and well-lit</li>
                    <li>Include a Title Page and Index</li>
                  </ul>
                </div>
              </div>

              {/* The Bad */}
              <div className="space-y-4">
                <div className="bg-destructive/5 border-2 border-destructive/20 rounded-2xl p-1">
                  <div className="bg-card rounded-xl p-6 h-64 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/5 opacity-50 blur-sm" />
                    <Camera className="h-16 w-16 text-destructive mb-4 opacity-50" />
                    <h3 className="font-bold text-destructive text-lg blur-[1px]">Blurry & Dark</h3>
                    <p className="text-sm text-destructive/80 mt-2 max-w-[200px]">Shadows covering text, taken at an angle, low resolution.</p>
                    <div className="absolute top-4 right-4 bg-destructive text-white p-1 rounded-full">
                      <Ban className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <div className="px-4">
                  <h4 className="font-semibold text-destructive flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4" /> Avoid This
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Camera flash reflections</li>
                    <li>Copyrighted book pages (Instant Ban)</li>
                    <li>Messy handwriting without transcription</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Gamified Roadmap */}
          <div className="mb-24">
            <div className="bg-secondary/30 rounded-3xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] -z-10" />
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl font-bold mb-4">Your Path to Pro</h2>
                <p className="text-muted-foreground">How the notes economy works</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-8 left-1/2 -translate-x-1/2 w-[80%] h-0.5 bg-border -z-10" />

                {roadmapSteps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                    <div className="h-16 w-16 bg-background rounded-2xl border-2 border-border group-hover:border-primary group-hover:scale-110 transition-all duration-300 flex items-center justify-center mb-4 shadow-sm z-10">
                      <step.icon className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-bold mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Action Dock (Hybrid: Fixed Mobile / Static Desktop) */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:static md:w-full md:translate-x-0 md:left-auto md:text-center md:mt-24 z-50 md:z-auto mobile-cta-dock">
            <Link to="/seller/upload">
              <Button size="lg" className="w-full md:w-auto md:px-16 h-14 md:h-16 rounded-full shadow-2xl shadow-primary/30 text-lg font-bold hover:scale-105 transition-transform animate-in slide-in-from-bottom-5">
                Start Uploading Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}
