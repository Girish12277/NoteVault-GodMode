import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Heart, ArrowRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function Footer() {
  return (
    <footer className="relative bg-background text-muted-foreground overflow-hidden font-sans border-t border-primary/10">

      {/* Subtle Texture (Ceramic Feel) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="container relative z-10 pt-20 pb-10">
        <div className="grid gap-12 lg:gap-8 lg:grid-cols-12">

          {/* Brand Column (Span 4) */}
          <div className="lg:col-span-4 space-y-8">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <span className="font-display text-2xl font-bold text-foreground tracking-tight block">NotesMarket</span>
                <span className="text-[10px] font-mono text-primary tracking-widest uppercase">Premium Academic Assets</span>
              </div>
            </Link>

            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              The world's most advanced marketplace for academic intelligence. Empowering the next generation of scholars with premium resources.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-20 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-semibold text-primary">Made for India</span>
              <span className="text-sm grayscale opacity-80">🇮🇳</span>
            </div>

            <div className="flex gap-2 pt-2">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <Button key={i} variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-300">
                  <Icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Links (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-foreground font-display font-semibold text-sm uppercase tracking-wider">Platform</h3>
            <ul className="space-y-3">
              {[
                { label: 'Browse Notes', path: '/browse' },
                { label: 'How It Works', path: '/how-it-works' },
                { label: 'Categories', path: '/categories' },
                { label: 'Universities', path: '/universities' },
                { label: 'About Us', path: '/about' },
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Seller Links (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-foreground font-display font-semibold text-sm uppercase tracking-wider">Seller Zone</h3>
            <ul className="space-y-3">
              {[
                { label: 'Become a Seller', path: '/seller' },
                { label: 'Seller Dashboard', path: '/seller' },
                { label: 'Guidelines', path: '/seller/guidelines' },
                { label: 'FAQ', path: '/seller/faq' },
              ].map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-foreground font-display font-semibold text-sm uppercase tracking-wider">Stay Connected</h3>
            <p className="text-muted-foreground text-sm">
              Join 50,000+ students receiving weekly exam hacks and trending resource summaries.
            </p>

            <div className="relative group max-w-sm">
              <div className="relative flex gap-2 p-1 rounded-xl bg-background border border-primary/10 shadow-sm ring-1 ring-primary/5 focus-within:ring-primary/20 transition-all">
                <Input
                  type="email"
                  placeholder="enter.your@email.com"
                  className="bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 h-10 min-w-0 font-mono text-sm"
                />
                <Button className="shrink-0 h-10 px-4 rounded-lg gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-transform active:scale-95 shadow-md shadow-primary/20">
                  <span className="hidden sm:inline">Join</span> <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ul className="space-y-4 pt-4 text-sm">
              <li className="flex items-start gap-3 group cursor-pointer">
                <div className="p-2 rounded-lg bg-primary/5 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Email Support</p>
                  <p className="text-foreground font-medium font-mono group-hover:text-primary transition-colors">support@notesmarket.in</p>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="p-2 rounded-lg bg-primary/5 text-primary border border-primary/10">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Headquarters</p>
                  <p className="text-foreground font-medium">Raipur, Chhattisgarh, India</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-primary/10 flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-muted-foreground text-sm font-medium">
            © 2024 NotesMarket <span className="mx-2 opacity-30">|</span> <span className="opacity-70">Architected for Excellence</span>
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {[
              { label: 'Terms', path: '/terms' },
              { label: 'Privacy', path: '/privacy' },
              { label: 'Refunds', path: '/refund' },
              { label: 'Contact', path: '/contact' },
            ].map(link => (
              <Link key={link.path} to={link.path} className="hover:text-primary transition-colors underline decoration-transparent hover:decoration-primary/30 underline-offset-4">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
