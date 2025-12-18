import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, ShieldCheck, Wallet, MousePointerClick, SearchCheck, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function RefundPolicy() {
  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">

        {/* Trust Seal Hero (Light Theme) */}
        <div className="relative overflow-hidden py-16 md:py-24 text-center border-b border-border/40">
          {/* Ceramic Texture Background */}
          <div className="absolute inset-0 bg-background">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          </div>

          {/* Noise Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-multiply pointer-events-none" />

          <div className="container relative z-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full border border-primary/20 mb-8 shadow-sm">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 text-foreground tracking-tight">
              24-Hour Purchase Protection
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We stand behind our quality. If the notes aren't what we promised, you get <span className="text-primary font-bold">100% of your money back</span>. No hidden fees.
            </p>
          </div>
        </div>

        <div className="container max-w-5xl -mt-10 relative z-20">

          {/* Eligibility Matrix */}
          <div className="grid md:grid-cols-2 gap-6 mb-20">
            {/* Covered */}
            <Card className="border border-green-200/50 shadow-lg bg-green-50/50 backdrop-blur-sm dark:bg-green-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  We Cover This (Eligible)
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Situations where we issue a full refund immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  'File is corrupted or won\'t open',
                  'Content mismatches title/description',
                  'Duplicate purchase (charged twice)',
                  'Poor scan quality / unreadable text',
                  'Notes not accessible after payment'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-green-100/50 transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-foreground/90 font-medium">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Not Covered */}
            <Card className="border border-red-200/50 shadow-lg bg-red-50/50 backdrop-blur-sm dark:bg-red-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                    <Ban className="h-6 w-6" />
                  </div>
                  We Don't Cover This
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Situations outside our protection policy.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  'Request made after 24 hours',
                  '"I passed the exam and don\'t need it"',
                  'Subjective preference ("I didn\'t like style")',
                  'Notes were downloaded and used completely',
                  'Change of mind after viewing full content'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-red-100/50 transition-colors">
                    <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground font-medium">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Visual Timeline */}
          <div className="mb-20">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-4 bg-background border-primary/20 text-primary">Simple Process</Badge>
              <h2 className="text-3xl font-bold font-display text-foreground">How to Claim Your Refund</h2>
            </div>

            <div className="relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-[2.5rem] left-[10%] right-[10%] h-0.5 bg-border -z-10" />

              <div className="grid md:grid-cols-4 gap-8">
                {[
                  {
                    icon: MousePointerClick,
                    step: '01',
                    title: 'Submit Request',
                    desc: 'Go to "My Orders" and click "Request Refund" within 24h.'
                  },
                  {
                    icon: SearchCheck,
                    step: '02',
                    title: 'Expert Review',
                    desc: 'Our team verifies the issue manually within 2-4 hours.'
                  },
                  {
                    icon: CheckCircle2,
                    step: '03',
                    title: 'Approval',
                    desc: 'Once verified, the refund is approved immediately.'
                  },
                  {
                    icon: Wallet,
                    step: '04',
                    title: 'Money Back',
                    desc: 'Funds credit to your bank source in 5-7 business days.'
                  }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                    <div className="h-20 w-20 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300 relative z-10 hover:shadow-md hover:border-primary/30">
                      <item.icon className="h-8 w-8 text-primary" />
                      <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold border-4 border-background shadow-sm">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ & Fair Play Grid */}
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold font-display mb-6 flex items-center gap-2 text-foreground">
                <HelpCircle className="h-6 w-6 text-primary" /> Common Questions
              </h2>
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="1" className="border border-border/60 rounded-xl px-2 bg-card">
                  <AccordionTrigger className="px-4 hover:no-underline text-foreground">What happens to the seller?</AccordionTrigger>
                  <AccordionContent className="px-4 text-muted-foreground">
                    When a refund is approved, the amount is deducted from the seller's pending balance. If already paid out, it's adjusted from their future earnings. This ensures fair treatment for both parties.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="2" className="border border-border/60 rounded-xl px-2 bg-card">
                  <AccordionTrigger className="px-4 hover:no-underline text-foreground">Can I get a partial refund?</AccordionTrigger>
                  <AccordionContent className="px-4 text-muted-foreground">
                    Partial refunds are not available. Refund requests are either approved for the full amount or rejected.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="3" className="border border-border/60 rounded-xl px-2 bg-card">
                  <AccordionTrigger className="px-4 hover:no-underline text-foreground">What if my request is rejected?</AccordionTrigger>
                  <AccordionContent className="px-4 text-muted-foreground">
                    You can appeal the decision by contacting our support team at support@notesmarket.in with additional evidence. We'll review your case again.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="4" className="border border-border/60 rounded-xl px-2 bg-card">
                  <AccordionTrigger className="px-4 hover:no-underline text-foreground">Do I lose access to the notes?</AccordionTrigger>
                  <AccordionContent className="px-4 text-muted-foreground">
                    Yes, once a refund is processed, you will immediately lose access to the purchased notes from your library.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Fair Play Box */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Fair Use Policy</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                We protect honest buyers. However, frequent abuse (like buying and refunding repeatedly) triggers a system alert.
                <br /><br />
                Accounts flagged for abuse may be restricted from future refunds.
              </p>
              <Button className="w-full bg-background hover:bg-accent hover:text-accent-foreground border-border text-foreground shadow-sm" variant="outline" asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
