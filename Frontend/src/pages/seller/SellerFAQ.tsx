import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, MessageSquare, Search, Zap, DollarSign, UploadCloud, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function SellerFAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const faqs = [
    {
      category: 'Getting Started',
      icon: Zap,
      questions: [
        {
          q: 'How do I become a seller?',
          a: 'Simply create an account and go to the Seller Dashboard. Complete your profile with bank details for withdrawals, and you can start uploading notes immediately. No approval needed!'
        },
        {
          q: 'What kind of notes can I sell?',
          a: 'You can sell any original academic notes you\'ve created - handwritten or typed. This includes subject notes, summaries, solved examples, formula sheets, and study guides. Make sure they\'re your own work.'
        },
        {
          q: 'Is there an approval process for notes?',
          a: 'Notes go live instantly after upload. However, we monitor for quality and policy violations. Low-quality or prohibited content may be removed.'
        },
      ]
    },
    {
      category: 'Earnings & Payments',
      icon: DollarSign,
      questions: [
        {
          q: 'How much do I earn per sale?',
          a: 'You keep 85% of every sale. For example, if you price your notes at ₹100, you earn ₹85. The remaining 15% covers platform fees and payment processing.'
        },
        {
          q: 'When do I get paid?',
          a: 'Earnings are added to your wallet 24 hours after each sale (this is the refund window). You can withdraw to your bank account anytime once you have at least ₹100 balance.'
        },
        {
          q: 'How long does withdrawal take?',
          a: 'Bank transfers are processed within 1-3 business days. UPI transfers are usually instant or within a few hours.'
        },
        {
          q: 'What happens if a buyer requests a refund?',
          a: 'If a refund is approved within 24 hours, the amount is deducted from your pending balance. If already paid out, it\'s adjusted from future earnings.'
        },
      ]
    },
    {
      category: 'Uploading Notes',
      icon: UploadCloud,
      questions: [
        {
          q: 'What file format is accepted?',
          a: 'We accept PDF files only. Maximum file size is 50MB. For best results, ensure your PDF is clear and properly formatted.'
        },
        {
          q: 'How should I price my notes?',
          a: 'Consider the length, quality, and uniqueness of your notes. Short notes (1-50 pages) typically sell at ₹29-79, comprehensive notes (51-150 pages) at ₹79-149, and detailed guides (150+ pages) at ₹149-249.'
        },
        {
          q: 'Can I update notes after uploading?',
          a: 'Yes! You can update your notes anytime from the Seller Dashboard. Existing buyers will have access to the updated version.'
        },
        {
          q: 'How do I make my notes sell better?',
          a: 'Write clear titles and descriptions, add a good cover image, ensure your notes are well-organized, and encourage satisfied buyers to leave reviews.'
        },
      ]
    },
    {
      category: 'Policies & Rules',
      icon: ShieldCheck,
      questions: [
        {
          q: 'What content is not allowed?',
          a: 'Copyrighted materials (textbook scans), exam papers, plagiarized content, notes from other sellers, and any offensive or inappropriate material are strictly prohibited.'
        },
        {
          q: 'What happens if I violate policies?',
          a: 'First violation may result in content removal. Repeated violations can lead to account suspension or termination. Earnings may be forfeited in case of fraud.'
        },
        {
          q: 'Can I sell the same notes on other platforms?',
          a: 'Yes, you retain full ownership of your notes. You can sell them anywhere else. We only ask that you don\'t copy our platform\'s exclusive content.'
        },
      ]
    },
  ];

  // Logic for filtering
  const filteredSections = useMemo(() => {
    return faqs
      .map(section => {
        // If specific category selected, ignore others
        if (activeCategory !== 'All' && section.category !== activeCategory) return null;

        // Filter questions by search query
        const filteredQuestions = section.questions.filter(
          q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filteredQuestions.length === 0) return null;

        return { ...section, questions: filteredQuestions };
      })
      .filter(Boolean) as typeof faqs;
  }, [searchQuery, activeCategory]);

  const categories = ['All', ...faqs.map(f => f.category)];

  const topQuestions = [
    { title: 'Commission Rate', value: 'You earn 85%', desc: 'Highest in the industry', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Upload Format', value: 'PDF Only', desc: 'Secure & standard', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Approval Time', value: 'Instant', desc: 'No waiting period', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">

        {/* Interactive Hero */}
        <div className="bg-muted/30 border-b border-border py-16 px-4">
          <div className="container max-w-4xl text-center">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6 ring-1 ring-primary/20">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-6">Seller Support Hub</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Find answers instantly. Type below or browse topics.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex items-center bg-card border border-border rounded-xl shadow-lg p-2">
                <Search className="ml-4 h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search (e.g., 'withdraw', 'copyright')..."
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-4 py-3 text-lg placeholder:text-muted-foreground/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-5xl py-12">

          {/* Top 3 Featured Cards */}
          {!searchQuery && activeCategory === 'All' && (
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {topQuestions.map((item, i) => (
                <Card key={i} className="hover:shadow-md transition-all hover:border-primary/20">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mb-4", item.bg)}>
                      <item.icon className={cn("h-6 w-6", item.color)} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">{item.title}</p>
                    <h3 className="text-2xl font-bold text-foreground mb-1">{item.value}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Sticky Category Pills */}
          <div className="sticky top-20 z-30 bg-background/95 backdrop-blur py-4 mb-8 -mx-4 px-4 md:mx-0 md:px-0 border-b md:border-none border-border/50">
            <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results Area */}
          <div className="space-y-10 min-h-[400px]">
            {filteredSections.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">No matching questions found for "{searchQuery}".</p>
                <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2 text-primary">Clear Search</Button>
              </div>
            ) : (
              filteredSections.map((section, idx) => (
                <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/5 rounded-lg">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">{section.category}</h2>
                  </div>

                  <Accordion type="single" collapsible className="grid gap-4">
                    {section.questions.map((faq, qIdx) => (
                      <AccordionItem
                        key={qIdx}
                        value={`${section.category}-${qIdx}`}
                        className="border border-border/60 rounded-xl bg-card px-2 shadow-sm"
                      >
                        <AccordionTrigger className="px-4 py-4 text-left hover:no-underline hover:text-primary transition-colors">
                          <span className="text-base font-medium">{faq.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-0 text-muted-foreground text-[15px] leading-relaxed">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            )}
          </div>

          {/* Support Footer */}
          <div className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div>
                <h3 className="text-2xl font-bold mb-2">Still blocked?</h3>
                <p className="text-slate-300">Our support team replies within 2 hours on average.</p>
              </div>
              <div className="flex gap-4">
                <Link to="/contact">
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-xl">
                    <MessageSquare className="mr-2 h-4 w-4" /> Chat with Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
