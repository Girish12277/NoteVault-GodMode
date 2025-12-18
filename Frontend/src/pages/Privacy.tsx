import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Shield,
  Eye,
  Lock,
  Database,
  UserCheck,
  Mail,
  CheckCircle2,
  Server,
  FileKey,
  Fingerprint,
  CreditCard,
  Cookie,
  Smartphone,
  Globe,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Privacy() {
  const [activeSection, setActiveSection] = useState<string>('collect');

  const sections = [
    {
      id: 'collect',
      icon: Database,
      title: 'Information We Collect',
      tldr: "We only collect what you explicitly give us (Profile, Notes) and what's needed for the app to work.",
      content: `We collect information you provide directly, including name, email, phone number, and university details during registration. We also collect transaction data, uploaded notes metadata, and usage analytics to improve our service. We do not track your location or browsing history outside of our platform.`
    },
    {
      id: 'use',
      icon: Eye,
      title: 'How We Use Your Data',
      tldr: "To show you relevant notes, process payments, and stop fraud. We don't sell your profile.",
      content: `Your information is used to provide and improve our services, process transactions, send important notifications, personalize your experience, and prevent fraud. We may also use aggregated, anonymized data for internal analytics and research to improve note recommendations.`
    },
    {
      id: 'sharing',
      icon: Shield,
      title: 'Data Sharing',
      tldr: "Only shared with Payment Gateways (Razorpay) and Cloud Providers (AWS/Cloudinary) to run the service.",
      content: `We do not sell your personal information to data brokers. Data is shared with trusted third-party service providers (like Payment Gateways) only to complete transactions. Seller information is shared with buyers only to the extent necessary (e.g., Seller Name on invoice).`
    },
    {
      id: 'security',
      icon: Lock,
      title: 'Data Security',
      tldr: "AES-256 Encryption, SSL Everywhere, and Hashed Passwords. Your data is in a vault.",
      content: `We implement industry-standard security measures including SSL encryption for all data in transit, AES-256 encryption for sensitive database fields, and secure payment processing through Razorpay. User passwords are salted, hashed, and never stored in plain text.`
    },
    {
      id: 'rights',
      icon: UserCheck,
      title: 'Your Rights',
      tldr: "It's your data. Download it, delete it, or update it anytime from Settings.",
      content: `You have the full right to access, update, or permanently delete your personal information. You can request a full export of your data or immediate account deletion through your account settings. We comply with all applicable data protection laws.`
    },
    {
      id: 'cookies',
      icon: Cookie,
      title: 'Cookies & Tracking',
      tldr: "Essential cookies only. No creepy cross-site trackers.",
      content: `We use essential cookies to keep you logged in and remember your preferences (like Dark Mode). We use limited analytics cookies to see which pages are popular. We do not use third-party advertising cookies that track you across the web.`
    },
    {
      id: 'contact',
      icon: Mail,
      title: 'Communications',
      tldr: "Transactional emails (Receipts) are mandatory. Marketing is optional.",
      content: `We send transactional emails for purchases, refunds, and security alerts. These cannot be disabled. Monthly newsletters and marketing emails are optional - you can unsubscribe with one click at the bottom of any email.`
    },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="container py-12 md:py-16 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6 ring-1 ring-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">Privacy Trust Center</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We believe privacy should be simple, transparent, and user-first. Here is exactly how we treat your data.
            </p>
          </div>
        </div>

        <div className="container py-12">

          {/* 1. Privacy Nutrition Label */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {/* Linked Data */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Data Linked to You
                </CardTitle>
                <CardDescription>
                  Data we collect to create your account and process sales.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/10">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Purchases & Financial Info</p>
                    <p className="text-xs text-muted-foreground">To process payments via Razorpay</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/10">
                  <Fingerprint className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Contact Info</p>
                    <p className="text-xs text-muted-foreground">Name, Email, University (for verification)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-primary/10">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">User Content</p>
                    <p className="text-xs text-muted-foreground">Notes and Files you upload</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Not Linked / Not Collected */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  Data We Do NOT Collect
                </CardTitle>
                <CardDescription>
                  Common intrusions we strictly avoid.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg text-muted-foreground opacity-75">
                  <Globe className="h-5 w-5" />
                  <div>
                    <p className="font-medium text-sm">Precise Location</p>
                    <p className="text-xs">We don't track your GPS.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg text-muted-foreground opacity-75">
                  <Eye className="h-5 w-5" />
                  <div>
                    <p className="font-medium text-sm">Browsing History</p>
                    <p className="text-xs">We don't know what other sites you visit.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg text-muted-foreground opacity-75">
                  <Database className="h-5 w-5" />
                  <div>
                    <p className="font-medium text-sm">Contacts List</p>
                    <p className="text-xs">We never access your phone contacts.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. The Vault (Security Core) */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-8 md:p-12 mb-20 shadow-2xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium mb-6">
                  <Lock className="h-3 w-3" /> Bank-Grade Security
                </div>
                <h2 className="text-3xl font-display font-bold mb-4">Your Data is in The Vault.</h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-6">
                  We treat your data like a bank treats money. Secured by industry-leading encryption and best practices.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> AES-256 Encryption
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> SSL/TLS in Transit
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Regular Audits
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5 text-emerald-400" />
                      <span className="font-medium">Database Storage</span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-none">Encrypted</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                      <span className="font-medium">Payments</span>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-300 border-none">PCI-DSS (Razorpay)</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <FileKey className="h-5 w-5 text-amber-400" />
                      <span className="font-medium">Passwords</span>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-300 border-none">Salted & Hashed</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[250px_1fr] gap-12 items-start">
            {/* TOC Sidebar */}
            <div className="hidden lg:block sticky top-24">
              <p className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider pl-2">Contents</p>
              <div className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </div>

              <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border">
                <p className="text-xs text-muted-foreground mb-2">Have a specific question?</p>
                <a href="mailto:privacy@notesmarket.in" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  Email DPO <Mail className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Main Accordions */}
            <div className="space-y-8">
              <Accordion type="single" collapsible defaultValue="collect" onValueChange={setActiveSection} className="w-full space-y-4">
                {sections.map((section) => (
                  <div key={section.id} id={section.id} className="scroll-mt-24">
                    <AccordionItem value={section.id} className="border border-border rounded-xl bg-card px-2">
                      <AccordionTrigger className="px-4 py-5 hover:no-underline hover:bg-muted/50 transition-colors rounded-t-xl group">
                        <div className="flex items-center gap-4 text-left">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <section.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{section.title}</h3>
                            {/* Mobile Only Summary */}
                            <p className="text-sm text-muted-foreground font-normal md:hidden line-clamp-1">{section.tldr}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-6 pt-2">
                        {/* TL;DR Box (Desktop) */}
                        <div className="hidden md:flex gap-3 p-4 mb-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
                          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-0.5">Simply Put:</p>
                            <p className="text-sm text-blue-800 dark:text-blue-300">{section.tldr}</p>
                          </div>
                        </div>
                        <div className="prose prose-sm prose-gray dark:prose-invert max-w-none pl-[3.25rem]">
                          <p className="text-base leading-relaxed text-muted-foreground/90">
                            {section.content}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </div>
                ))}
              </Accordion>

              <div className="lg:hidden mt-12 p-6 bg-muted rounded-xl text-center">
                <p className="font-medium mb-2">Questions?</p>
                <a href="mailto:privacy@notesmarket.in" className="text-primary hover:underline">
                  privacy@notesmarket.in
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
