import { Search, ShieldCheck, Zap, Trophy, MousePointerClick, CreditCard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: Search,
    title: 'Find Your Focus',
    description: 'Search by university, subject, or specific topic to find the exact resource you need.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/20'
  },
  {
    icon: ShieldCheck,
    title: 'Secure Access',
    description: 'Unlock content safely with our encrypted payment gateway. 100% money-back guarantee.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    ring: 'ring-indigo-500/20'
  },
  {
    icon: Zap,
    title: 'Instant Unlock',
    description: 'Get immediate access to your notes, PDFs, and guides. No waiting, just learning.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    ring: 'ring-purple-500/20'
  },
  {
    icon: Trophy,
    title: 'Ace Your Exams',
    description: 'Study smarter with verified materials and join thousands of top-performing students.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    ring: 'ring-pink-500/20'
  },
];

export function HowItWorks() {
  return (
    <section className="py-8 lg:py-24 overflow-hidden relative">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10" />

      <div className="container relative z-10">
        <div className="text-center mb-8 lg:mb-24">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted border border-border/50 px-3 py-1 text-sm text-muted-foreground mb-4">
            <Sparkles className="h-3.5 w-3.5 fill-current" />
            <span>Simple Process</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            From <span className="text-muted-foreground line-through decoration-primary/50 decoration-4">Struggle</span> to <span className="text-primary">Success</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-sm md:text-lg max-w-2xl mx-auto">
            We've streamlined the journey. No more endless searching or questionable quality.
          </p>
        </div>

        {/* Desktop Pipeline Layout */}
        <div className="hidden lg:block relative">
          {/* The Connecting Beam */}
          <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-border/40 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </div>

          <div className="grid grid-cols-4 gap-4 relative">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                {/* Floating Node */}
                <div className={cn(
                  "relative h-24 w-24 rounded-full bg-background border-4 border-background shadow-xl z-10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                  step.ring
                )}>
                  {/* Radar Rings */}
                  <div className={cn("absolute inset-0 rounded-full border-2 opacity-20 scale-110 group-hover:scale-125 transition-transform duration-700", step.color.replace('text', 'border'))} />
                  <div className={cn("absolute inset-0 rounded-full border-2 opacity-10 scale-125 group-hover:scale-150 transition-transform duration-1000 delay-75", step.color.replace('text', 'border'))} />

                  {/* Icon */}
                  <div className={cn("h-14 w-14 rounded-full flex items-center justify-center", step.bg)}>
                    <step.icon className={cn("h-7 w-7", step.color)} />
                  </div>

                  {/* Step Number Badge */}
                  <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold border-2 border-background">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="mt-8 px-4 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Vertical Timeline Layout */}
        <div className="lg:hidden space-y-6 relative pl-6 border-l-2 border-dashed border-border/60 ml-4">
          {steps.map((step, index) => (
            <div key={index} className="relative pl-8">
              {/* Timeline Dot */}
              <div className={cn(
                "absolute -left-[35px] top-0 h-10 w-10 rounded-full bg-background border-2 flex items-center justify-center shadow-sm z-10",
                step.color.replace('text', 'border')
              )}>
                <step.icon className={cn("h-5 w-5", step.color)} />
              </div>

              {/* Content */}
              <div className="pt-1">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                  {step.title}
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Step {index + 1}</span>
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
