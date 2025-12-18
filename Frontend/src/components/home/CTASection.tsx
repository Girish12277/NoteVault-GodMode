import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, ArrowRight, IndianRupee, TrendingUp, Calculator, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function CTASection() {
  const [noteCount, setNoteCount] = useState([10]);
  const [avgPrice, setAvgPrice] = useState([299]);
  const [viralMode, setViralMode] = useState<'conservative' | 'average' | 'trending'>('conservative');
  const [animateResult, setAnimateResult] = useState(false);

  // Logic Upgrade: Viral Potential Multiplier
  const getMultiplier = () => {
    switch (viralMode) {
      case 'average': return 5;
      case 'trending': return 20;
      default: return 1; // conservative
    }
  };

  const multiplier = getMultiplier();
  const potentialEarnings = Math.round(noteCount[0] * avgPrice[0] * 0.85 * multiplier);

  // Trigger animation on value change
  useEffect(() => {
    setAnimateResult(true);
    const timer = setTimeout(() => setAnimateResult(false), 300);
    return () => clearTimeout(timer);
  }, [noteCount, avgPrice, viralMode]);

  const handleInputChange = (setter: (val: number[]) => void, value: string, max: number) => {
    const num = parseInt(value);
    if (!isNaN(num)) {
      setter([Math.min(Math.max(0, num), max)]);
    }
  };

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden bg-background">
      {/* Background Ambience (Semantic: Muted/Primary - NO ACCENT CLASH) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted))_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: The Pitch */}
          <div className="text-left space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-sm text-primary font-bold shadow-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Passive Income Generation</span>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
                Your Hard Drive is Worth a <span className="text-primary">Fortune.</span>
              </h2>

              <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-xl">
                Don't let your notes gather digital dust. Join <strong className="text-foreground">2,500+ students</strong> who are paying their tuition by sharing their knowledge on StudyVault.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/seller">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-105 font-bold">
                  <Upload className="mr-2 h-5 w-5" />
                  Start Selling
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base border-border text-foreground/80 hover:text-foreground hover:bg-card hover:border-foreground/20 bg-background/50 backdrop-blur-sm shadow-sm transition-all hover:scale-105">
                  How it Works
                </Button>
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center gap-6 sm:gap-8 text-muted-foreground text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary fill-primary/10" />
                100% Secure Payouts
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary fill-primary/10" />
                Keep 85% Earnings
              </div>
            </div>
          </div>

          {/* Right: The Revenue Simulator */}
          <div className="relative group perspective-1000">
            {/* Soft Glow Wrap (Harmonious Orange) */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-orange-400/20 rounded-[2.5rem] opacity-40 blur-2xl group-hover:opacity-60 transition-opacity duration-1000 scale-95" />

            <div className="relative rounded-[2rem] bg-card border border-border p-6 sm:p-8 lg:p-10 shadow-2xl shadow-secondary/5 overflow-hidden">
              {/* 3D Floating Coin Effect (CSS only) */}
              <div className="absolute -top-12 -right-12 text-primary/10 rotate-12 pointer-events-none">
                <IndianRupee className="w-48 h-48" />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-card-foreground">Earnings Calculator</h3>
                    <p className="text-xs text-muted-foreground font-medium tracking-wide">ESTIMATED REVENUE</p>
                  </div>
                </div>

                {/* Viral Potential Toggle (Tri-State) */}
                <div className="bg-muted/50 p-1 rounded-lg flex items-center gap-1">
                  {[
                    { id: 'conservative', label: 'Conservative', mul: '1x' },
                    { id: 'average', label: 'Average', mul: '5x' },
                    { id: 'trending', label: 'Trending', mul: '20x' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setViralMode(mode.id as any)}
                      className={cn(
                        "flex-1 text-xs font-semibold py-1.5 px-2 rounded-md transition-all duration-300",
                        viralMode === mode.id
                          ? "bg-background text-foreground shadow-sm shadow-black/5 ring-1 ring-black/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      )}
                    >
                      {mode.label}
                      <span className={cn("ml-1 text-[10px]", viralMode === mode.id ? "text-primary opacity-100" : "opacity-0")}>
                        {mode.mul}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Slider 1: Notes (Hybrid Input) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-muted-foreground">Notes to Upload</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={noteCount[0]}
                        onChange={(e) => handleInputChange(setNoteCount, e.target.value, 100)}
                        className="w-16 h-8 text-right font-bold text-base tabular-nums border-primary/20 focus-visible:ring-primary/20 bg-background/50"
                      />
                      <span className="text-muted-foreground font-medium text-xs">notes</span>
                    </div>
                  </div>
                  <Slider
                    value={noteCount}
                    max={100}
                    step={1}
                    onValueChange={setNoteCount}
                    className="py-2 cursor-pointer"
                  />
                </div>

                {/* Slider 2: Price (Hybrid Input) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-muted-foreground">Average Price</span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground font-medium text-xs mr-1">₹</span>
                      <Input
                        type="number"
                        value={avgPrice[0]}
                        onChange={(e) => handleInputChange(setAvgPrice, e.target.value, 5000)}
                        className="w-20 h-8 text-right font-bold text-base tabular-nums border-primary/20 focus-visible:ring-primary/20 bg-background/50"
                      />
                    </div>
                  </div>
                  <Slider
                    value={avgPrice}
                    max={2000}
                    step={50}
                    onValueChange={setAvgPrice}
                    className="py-2 cursor-pointer"
                  />
                  {/* Smart Ticks Hint */}
                  <div className="flex justify-between text-[10px] text-muted-foreground/50 px-1 font-medium uppercase tracking-wider">
                    <span>Cheap</span>
                    <span>Market</span>
                    <span>Premium</span>
                  </div>
                </div>

                {/* Result Box (Embedded Conversion) */}
                <div className="pt-6 mt-6 border-t border-border bg-muted/30 -mx-6 -mb-6 p-6">
                  <p className="text-sm text-muted-foreground mb-1 font-medium">Potential Monthly Capacity</p>
                  <div className="flex items-end gap-2 mb-4">
                    <span
                      className={cn(
                        "text-4xl sm:text-5xl font-black text-foreground leading-tight transition-all duration-300", // Removed gradient text, used solid foreground for clarity
                        animateResult && "scale-105"
                      )}
                    >
                      ₹{potentialEarnings.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground font-bold mb-1.5 text-sm uppercase tracking-wider">/ month</span>
                  </div>

                  {/* Embedded 'Claim' Action */}
                  <Link to="/seller/upload">
                    <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 group font-bold">
                      <Zap className="mr-2 h-4 w-4 fill-current" />
                      Claim This Income
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>

                  <p className="text-[10px] text-center text-muted-foreground mt-3 font-medium opacity-70">
                    *Based on {viralMode} sales performance ({multiplier} sales/note/mo) at 85% share.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
