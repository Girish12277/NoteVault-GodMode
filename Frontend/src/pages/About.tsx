import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Users, Globe, Award, TrendingUp, Heart, Zap, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function About() {

    const journey = [
        { year: '2023', title: 'The Dorm Room', desc: 'Started with 5 PDF notes shared on WhatsApp in a hostel in Raipur.', icon: Sparkles },
        { year: '2024', title: '10,000 Users', desc: 'The word spread and students from 50+ colleges joined the movement.', icon: Users },
        { year: 'Now', title: 'The Platform', desc: 'India\'s fastest growing academic marketplace. A home for toppers.', icon: Globe },
    ];

    const communityVoices = [
        { name: "Rahul S.", role: "Topper, IIT Bombay", img: "https://ui-avatars.com/api/?name=Rahul+S&background=f97316&color=fff", quote: "I paid for my entire semester fees just by selling my old notes here." },
        { name: "Priya M.", role: "Medical Student", img: "https://ui-avatars.com/api/?name=Priya+M&background=f97316&color=fff", quote: "Finally found legible anatomy diagrams. This site is a lifesaver." },
        { name: "Amit K.", role: "CA Aspirant", img: "https://ui-avatars.com/api/?name=Amit+K&background=f97316&color=fff", quote: "The verification process is strict, which means I only get high quality stuff." },
    ];

    return (
        <Layout>
            <div className="pb-20 bg-background text-foreground">

                {/* --- 1. KINETIC HERO (Light Theme) --- */}
                <div className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 border-b border-border/40">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

                    <div className="container relative z-10 text-center">
                        <Badge variant="outline" className="mb-6 border-primary/20 text-primary px-4 py-1.5 uppercase tracking-widest text-xs font-bold bg-primary/5 backdrop-blur-md">
                            Revolutionizing Study Culture
                        </Badge>
                        <h1 className="font-display text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 text-foreground">
                            NOTES.<br />
                            <span className="text-primary">FREEDOM.</span><br />
                            FUTURE.
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
                            We are building the digital infrastructure for academic success.
                            Connecting the minds that know with the minds that need to know.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/browse">
                                <Button size="lg" className="rounded-full px-8 h-14 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20">
                                    Explore the Marketplace
                                </Button>
                            </Link>
                            <Link to="/contact">
                                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base border-primary/20 bg-background text-foreground hover:bg-primary/5 hover:border-primary/50 transition-all">
                                    Our Manifesto
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>


                {/* --- 2. THE JOURNEY (TIMELINE) --- */}
                <div className="container py-24">
                    <div className="flex flex-col md:flex-row gap-16 items-start">
                        <div className="md:w-1/3 sticky top-24">
                            <h2 className="text-4xl font-display font-bold mb-4 text-foreground">From A Dorm Room <br />To A Movement.</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                                NotesMarket wasn't built in a boardroom. It was built between exam crams and coffee breaks. We realized that knowledge was getting lost in old notebooks.
                            </p>
                            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                <div className="text-4xl font-bold text-primary mb-1">50K+</div>
                                <div className="text-sm text-primary/80 uppercase tracking-wider font-semibold">Active Students Today</div>
                            </div>
                        </div>

                        <div className="md:w-2/3 relative pl-8 md:pl-16 border-l-2 border-primary/10 space-y-16">
                            {journey.map((item, i) => (
                                <div key={i} className="relative group">
                                    <div className="absolute -left-[41px] md:-left-[73px] top-0 h-5 w-5 rounded-full bg-background border-[4px] border-primary shadow-[0_0_0_4px_rgba(255,255,255,1)] z-10 group-hover:scale-125 transition-transform duration-300" />
                                    <div className="flex items-center gap-4 mb-3">
                                        <Badge variant="secondary" className="font-mono bg-primary/10 text-primary hover:bg-primary/20">{item.year}</Badge>
                                        <item.icon className="h-5 w-5 text-primary opacity-70" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-foreground">{item.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed text-lg">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


                {/* --- 3. BENTO VALUES --- */}
                <div className="bg-primary/5 py-24">
                    <div className="container">
                        <div className="text-center mb-16">
                            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">Our Core Operating System</h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">These aren't just values. These are the algorithms that run our decision making every single day.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
                            {/* Large Item (Primary Orange) */}
                            <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-primary to-orange-600 rounded-3xl p-8 md:p-12 text-white flex flex-col justify-between overflow-hidden relative group shadow-2xl shadow-primary/20">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <BookOpen className="h-16 w-16 mb-8 text-white/90" />
                                <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                                    <h3 className="text-3xl font-bold mb-4">Democratizing Access</h3>
                                    <p className="text-orange-100 text-lg leading-relaxed">
                                        We believe that the quality of your education shouldn't be defined by your zip code or your bank balance. We put elite study materials in everyone's pocket.
                                    </p>
                                </div>
                            </div>

                            {/* Medium Items (Glassmorphic) */}
                            <div className="md:col-span-2 bg-background/50 backdrop-blur-sm p-8 rounded-3xl border border-primary/10 shadow-sm hover:shadow-lg transition-all flex flex-col justify-center gap-4 group hover:border-primary/30">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Shield className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground">Obsessive Quality Control</h3>
                                </div>
                                <p className="text-muted-foreground pl-16">
                                    We don't just accept any PDF. Every upload is scanned, verified, and rated. We filter the noise so you find the signal.
                                </p>
                            </div>

                            <div className="md:col-span-1 bg-background/50 backdrop-blur-sm p-8 rounded-3xl border border-primary/10 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group hover:border-primary/30">
                                <Heart className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                                <div>
                                    <h3 className="font-bold text-lg mb-2 text-foreground">Student Wellbeing</h3>
                                    <p className="text-sm text-muted-foreground">Reducing exam anxiety using preparation.</p>
                                </div>
                            </div>

                            <div className="md:col-span-1 bg-background/50 backdrop-blur-sm p-8 rounded-3xl border border-primary/10 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group hover:border-primary/30">
                                <Zap className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                                <div>
                                    <h3 className="font-bold text-lg mb-2 text-foreground">Speed to Learn</h3>
                                    <p className="text-sm text-muted-foreground">Formats designed for last-minute revision.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 4. COMMUNITY WALL --- */}
                <div className="container py-24">
                    <div className="flex flex-col items-center mb-16">
                        <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/10">The Community</Badge>
                        <h2 className="font-display text-4xl font-bold text-center text-foreground">Built By Students,<br /> For Students.</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {communityVoices.map((voice, i) => (
                            <div key={i} className="bg-background p-8 rounded-2xl border border-border hover:border-primary/30 transition-colors shadow-sm">
                                <div className="flex gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <span key={s} className="text-primary">★</span>
                                    ))}
                                </div>
                                <p className="text-lg font-medium leading-relaxed mb-6 text-foreground">"{voice.quote}"</p>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-primary/20">
                                        <AvatarImage src={voice.img} />
                                        <AvatarFallback className="bg-primary/10 text-primary">{voice.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold text-sm text-foreground">{voice.name}</div>
                                        <div className="text-xs text-muted-foreground">{voice.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 text-center">
                        <div className="inline-flex flex-col items-center p-8 rounded-3xl bg-foreground text-background shadow-2xl overflow-hidden relative border border-border">
                            <div className="relative z-10 flex flex-col items-center">
                                <h3 className="text-2xl font-bold mb-2">Ready to join the Top 1%?</h3>
                                <p className="text-background/70 mb-6">Start your journey today. Share notes. Earn. Learn.</p>
                                <div className="flex gap-4">
                                    <Link to="/auth?mode=register">
                                        <Button size="lg" className="rounded-full px-8 font-bold bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
                                    </Link>
                                    <Link to="/browse">
                                        <Button variant="ghost" size="lg" className="rounded-full px-8 text-background hover:bg-white/10 hover:text-white">Browse Notes <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                    </Link>
                                </div>
                            </div>
                            {/* Decorative glow (Subtle Orange) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-primary/20 to-orange-500/20 blur-3xl rounded-full mix-blend-screen" />
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
