import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollText, Search, ShieldCheck, Scale, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Terms() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('item-0');

  const sections = [
    {
      id: 'item-0',
      title: 'Acceptance of Terms',
      icon: ShieldCheck,
      tldr: 'By using our site, you agree to these rules. If you don\'t agree, you can\'t use it.',
      content: `By accessing or using NotesMarket, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. These terms apply to all visitors, users, and others who access or use the Service.`
    },
    {
      id: 'item-1',
      title: 'User Accounts',
      icon: Scale,
      tldr: 'You must provide real info and keep your password safe. One account per person.',
      content: `You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account. You must be at least 13 years old to use this service. Each person may only maintain one account. We reserve the right to suspend or terminate accounts that provide false information or violate these rules.`
    },
    {
      id: 'item-2',
      title: 'Buying Notes',
      icon: ScrollText,
      tldr: 'Notes are for your personal use only. No sharing, reselling, or removing watermarks.',
      content: `All purchases are final except as covered by our 24-hour refund policy. Purchased notes are for personal use only. You may not redistribute, share, resell, or publicly display purchased notes. Downloaded PDFs are watermarked with your user information for security. Removing or tampering with watermarks is a violation of these terms.`
    },
    {
      id: 'item-3',
      title: 'Selling Notes',
      icon: AlertCircle,
      tldr: 'Only upload what you own. You get 85% of sales. Plagiarism gets you banned.',
      content: `Sellers must own the intellectual property rights to content they upload. Notes must be original work or properly attributed where allowed. Sellers receive 85% of each sale price after the 24-hour refund window has passed. Uploading fraudulent, plagiarized, or stolen content will result in immediate account termination and forfeiture of earnings.`
    },
    {
      id: 'item-4',
      title: 'Refund Policy',
      icon: ShieldCheck,
      tldr: 'You have 24 hours to ask for a refund if the file is broken or fake.',
      content: `Buyers may request a full refund within 24 hours of purchase. Refunds are granted for technical issues (file corruption), quality problems (unreadable text), or content not matching the description. Abuse of the refund policy (e.g., downloading then refunding repeatedly) may result in account restrictions.`
    },
    {
      id: 'item-5',
      title: 'Prohibited Content',
      icon: AlertCircle,
      tldr: 'No cheating materials, no hate speech, no illegal stuff.',
      content: `Users may not upload copyrighted materials without permission. Exam papers, answer sheets, or solutions that violate academic integrity are prohibited. Offensive, illegal, harmful, or sexually explicit content is not allowed on the platform.`
    },
    {
      id: 'item-6',
      title: 'Payments',
      icon: Scale,
      tldr: 'We use Razorpay. Sellers can withdraw when they have ₹100+.',
      content: `All payments are processed securely through Razorpay. Prices are listed in Indian Rupees (₹). Sellers can withdraw earnings to their bank account once they reach the minimum threshold of ₹100. Payouts are typically processed within 24-48 hours of request.`
    },
    {
      id: 'item-7',
      title: 'Intellectual Property',
      icon: ScrollText,
      tldr: 'You own your notes. usage rights are licensed to us and buyers.',
      content: `Sellers retain full ownership of their original content. By uploading, you grant NotesMarket a non-exclusive license to display, distribute, and sell your content. Buyers receive a personal, non-transferable license to use purchased notes for educational purposes.`
    },
    {
      id: 'item-8',
      title: 'Limitation of Liability',
      icon: AlertCircle,
      tldr: 'We provide notes "as is". We don\'t guarantee you\'ll pass your exam.',
      content: `NotesMarket is not responsible for the accuracy, completeness, or quality of user-uploaded content. We do not guarantee academic success or specific grades from using notes purchased on our platform. Our liability is limited to the amount paid for the service.`
    },
    {
      id: 'item-9',
      title: 'Changes to Terms',
      icon: Scale,
      tldr: 'We can update these rules. If we do something big, we\'ll email you.',
      content: `We may update these terms at any time without prior notice. Continued use of the platform after changes constitutes acceptance of the new terms. Major changes that affect your rights will be communicated via email to registered users.`
    },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;
    return sections.filter(
      item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      // Small offset for sticky header
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="container py-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <ScrollText className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold">
                    Terms of Service
                  </h1>
                </div>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  The rules of the road. Please read carefully to understand your rights and responsibilities.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-background">
                    Last Updated: December 2024
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                    Active
                  </Badge>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search terms (e.g. Refund, Payment)..."
                  className="pl-10 h-12 bg-background shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12">

            {/* Sidebar TOC - Desktop */}
            <div className="hidden lg:block relative">
              <div className="sticky top-24 space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
                <h3 className="font-semibold text-sm text-foreground/80 mb-4 px-2 uppercase tracking-wider">
                  Table of Contents
                </h3>
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors",
                      activeTab === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {section.title}
                  </button>
                ))}
                {filteredSections.length === 0 && (
                  <p className="text-sm text-muted-foreground px-4">No sections found.</p>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
              {filteredSections.length > 0 ? (
                <Accordion
                  type="single"
                  collapsible
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="space-y-6"
                >
                  {filteredSections.map((section) => (
                    <div id={section.id} key={section.id} className="scroll-mt-24">
                      <AccordionItem value={section.id} className="border rounded-xl bg-card shadow-sm px-6">
                        <AccordionTrigger className="hover:no-underline py-6">
                          <div className="flex items-center gap-4 text-left">
                            <div className={cn(
                              "h-10 w-10 shrink-0 rounded-full flex items-center justify-center",
                              activeTab === section.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                              <section.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-display font-semibold text-lg">
                                {section.title}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-2">
                          {/* TL;DR Box */}
                          <div className="mb-6 bg-muted/50 border border-primary/20 rounded-lg p-4 flex gap-3">
                            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-sm text-foreground mb-1">Simply Put:</p>
                              <p className="text-sm text-muted-foreground italic">
                                "{section.tldr}"
                              </p>
                            </div>
                          </div>

                          {/* Legal Text */}
                          <div className="prose prose-sm prose-gray max-w-none">
                            <p className="text-base leading-relaxed text-muted-foreground/90">
                              {section.content}
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </div>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-20">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4 opacity-50">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">No matching terms found</h3>
                  <p className="text-muted-foreground">Try searching for a different keyword.</p>
                  <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2 text-primary">
                    Clear Search
                  </Button>
                </div>
              )}

              {/* Support Box */}
              <Card className="mt-12 bg-primary/5 border-primary/20">
                <CardContent className="p-8 text-center bg-gradient-to-r from-transparent via-background/50 to-transparent">
                  <h3 className="font-display text-xl font-bold mb-2">Still have questions?</h3>
                  <p className="text-muted-foreground mb-6">
                    Our legal team is here to help clarify any confusion.
                  </p>
                  <a href="mailto:legal@notesmarket.in">
                    <Button variant="outline" className="border-primary/50 text-foreground hover:bg-primary hover:text-primary-foreground">
                      Contact Legal Support
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
