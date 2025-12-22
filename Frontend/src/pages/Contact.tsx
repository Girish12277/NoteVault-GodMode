import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, HelpCircle, ShieldAlert, CreditCard, ShoppingBag, ArrowRight, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subject, setSubject] = useState<string>('');
  const formRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    setIsSubmitting(true);
    const toastId = toast.loading('Sending your message...');

    try {
      await api.post('/contact', data);

      toast.success('Message sent! We\'ll get back to you soon.', { id: toastId });
      (e.target as HTMLFormElement).reset();
      setSubject(''); // Reset controlled subject
    } catch (error: any) {
      console.error('Contact error:', error);

      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map((e: any) => `${e.message}`).join('\n');
        toast.error('Failed to send message', {
          id: toastId,
          description: errorMessages,
          duration: 6000
        });
      } else {
        const msg = error.response?.data?.message || 'Failed to send message. Please try again.';
        toast.error(msg, { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTopicClick = (val: string) => {
    setSubject(val);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Optional: Focus logic could go here
    }
  };

  const supportTeam = [
    { name: "Sarah", img: "https://ui-avatars.com/api/?name=Sarah&background=e11d48&color=fff" },
    { name: "Mike", img: "https://ui-avatars.com/api/?name=Mike&background=0284c7&color=fff" },
    { name: "Priya", img: "https://ui-avatars.com/api/?name=Priya&background=16a34a&color=fff" },
  ];

  const topics = [
    { label: "Refunds & Payments", value: "Refund Request", icon: CreditCard, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
    { label: "Seller Support", value: "Seller Support", icon: ShoppingBag, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Tech Issues", value: "Technical Issue", icon: ShieldAlert, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { label: "Partnerships", value: "Partnership", icon: HelpCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute inset-0 z-0 opacity-30 dark:opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="container relative z-10 py-12 md:py-20 max-w-6xl">

          {/* 1. Header & Live Status */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div className="space-y-4">
              <Badge variant="outline" className="chip-touch text-primary border-primary/20 bg-primary/5 uppercase tracking-widest">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Support Online
              </Badge>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black tracking-tight text-foreground">
                How can we <span className="text-primary">help?</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
                Our team is online and ready to assist you. Choose a topic below or reach out directly via WhatsApp for fastest response.
              </p>
            </div>

            {/* Team Avatars */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex -space-x-3">
                {supportTeam.map((member, i) => (
                  <Avatar key={i} className="border-2 border-background w-10 h-10 md:w-12 md:h-12">
                    <AvatarImage src={member.img} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center text-xs font-bold border-2 border-background z-10">
                  +5
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground font-medium">
                Avg. response time: <span className="text-green-600 font-bold">~15 mins</span>
              </div>
            </div>
          </div>


          {/* 2. Topic Interceptors */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 animate-in slide-in-from-bottom-4 fade-in duration-700">
            {topics.map((topic, i) => (
              <button
                key={i}
                onClick={() => handleTopicClick(topic.value)}
                className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-card border border-border/50 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-transparent to-transparent hover:to-primary/5"
              >
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", topic.bg)}>
                  <topic.icon className={cn("h-7 w-7", topic.color)} />
                </div>
                <h3 className="font-bold text-foreground text-center">{topic.label}</h3>
                <p className="text-xs text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                  Get help <ArrowRight className="inline h-3 w-3 ml-1" />
                </p>
              </button>
            ))}
          </div>


          <div className="grid lg:grid-cols-12 gap-12">

            {/* 3. Helper Channels (Visual) */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="font-display text-xl font-bold mb-6">Direct Channels</h3>

              {/* WhatsApp */}
              <Card className="overflow-hidden border-border/50 group hover:border-green-500/30 transition-colors">
                <div className="p-1 absolute top-0 right-0">
                  <div className="bg-green-500/10 text-green-600 text-xs uppercase font-bold px-2 py-0.5 rounded-bl-lg">Fastest</div>
                </div>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">WhatsApp</h3>
                    <p className="text-muted-foreground text-sm">+91 98765 43210</p>
                  </div>
                  <Button variant="ghost" size="icon" className="btn-touch" onClick={() => copyToClipboard('+919876543210', 'WhatsApp number')} aria-label="Copy WhatsApp number">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>

              {/* Email */}
              <Card className="overflow-hidden border-border/50 group hover:border-primary/30 transition-colors">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">Email Support</h3>
                    <p className="text-muted-foreground text-sm">support@notesmarket.in</p>
                  </div>
                  <Button variant="ghost" size="icon" className="btn-touch" onClick={() => copyToClipboard('support@notesmarket.in', 'Email')} aria-label="Copy email address">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>

              {/* Office */}
              <Card className="overflow-hidden border-border/50 bg-muted/20">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="mt-1 h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Main Office</h3>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                      Raipur, Chhattisgarh, India.<br />
                      Mon-Sat, 10AM - 6PM
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 4. The Form (Glassmorphic) */}
            <div className="lg:col-span-8" ref={formRef}>
              <Card className="border-0 shadow-2xl bg-white/80 dark:bg-card/80 backdrop-blur-xl ring-1 ring-border/50">
                <CardHeader className="pb-2 border-b border-border/10 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Send a Message</CardTitle>
                    {subject && (
                      <Badge variant="secondary" className="font-normal animate-in fade-in zoom-in">
                        Topic: {subject}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" placeholder="Who are we talking to?" required className="bg-background/50 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" placeholder="name@example.com" required className="bg-background/50 h-11" />
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                        <Input id="phone" name="phone" placeholder="+91..." className="bg-background/50 h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Topic</Label>
                        <Select name="subject" value={subject} onValueChange={setSubject} required>
                          <SelectTrigger className="bg-background/50 h-11">
                            <SelectValue placeholder="Select a topic..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                            <SelectItem value="Refund Request">Refund Request</SelectItem>
                            <SelectItem value="Technical Issue">Technical Issue</SelectItem>
                            <SelectItem value="Seller Support">Seller Support</SelectItem>
                            <SelectItem value="Complaint">Complaint</SelectItem>
                            <SelectItem value="Partnership">Partnership</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">How can we help?</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us more about your issue..."
                        rows={6}
                        required
                        className="bg-background/50 resize-none p-4"
                      />
                    </div>

                    <div className="pt-2">
                      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto min-w-[150px] h-12 text-base shadow-lg shadow-primary/20">
                        {isSubmitting ? (
                          'Sending...'
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
