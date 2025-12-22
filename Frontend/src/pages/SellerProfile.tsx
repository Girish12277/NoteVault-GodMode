import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Grid,
    Star,
    MessageCircle,
    MapPin,
    BookOpen,
    ShieldCheck,
    MoreHorizontal,
    Share2,
    Mail,
    Plus,
    LayoutGrid,
    Rss,
    Users,
    FileText,
    CheckCircle2,
    Search,
    Sparkles,
    Zap,
    Trophy,
    Crown
} from 'lucide-react';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { PostCard } from '@/components/seller/PostCard';
import { CreatePostDialog } from '@/components/seller/CreatePostDialog';
import { Post } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function SellerProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('shop'); // Default to Shop for Storefront vibe
    const isOwner = currentUser?.id === userId;
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: profile, isLoading, error, refetch } = useQuery({
        queryKey: ['seller-profile', userId, refetchTrigger],
        queryFn: async () => {
            const { data } = await api.get(`/profile/${userId}`);
            return data.data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2 // 2 minutes
    });

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Store link copied to clipboard');
    };

    const handleMessage = () => {
        if (!currentUser) {
            toast.error('Please login to message');
            navigate('/auth');
            return;
        }
        if (isOwner) {
            navigate('/messages');
        } else {
            navigate(`/messages?userId=${userId}`);
        }
    };

    // --- DERIVED STATE ---
    const filteredNotes = useMemo(() => {
        if (!profile?.notes) return [];
        if (!searchTerm) return profile.notes;
        return profile.notes.filter((n: any) =>
            n.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [profile?.notes, searchTerm]);

    const featuredNote = useMemo(() => {
        if (!profile?.notes || profile.notes.length === 0) return null;
        // Sort by Rating first, then Price. Pick the "Best" one.
        return [...profile.notes].sort((a: any, b: any) => (b.average_rating || 0) - (a.average_rating || 0))[0];
    }, [profile?.notes]);

    const expertiseBadges = useMemo(() => {
        if (!profile?.stats) return [];
        const badges = [];
        const { stats } = profile;

        if (stats.avgRating >= 4.5) badges.push({ label: 'Top Rated', icon: Crown, color: 'text-warning bg-warning/10 border-warning/20' }); // Gold
        if (stats.notesCount >= 5) badges.push({ label: 'Prolific Seller', icon: BookOpen, color: 'text-secondary bg-secondary/10 border-secondary/20' }); // Navy
        if (stats.reviewCount >= 10) badges.push({ label: 'Trusted', icon: ShieldCheck, color: 'text-accent bg-accent/10 border-accent/20' }); // Green

        return badges;
    }, [profile?.stats]);


    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="p-4 rounded-full bg-muted mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Store Not Found</h2>
                <p className="text-muted-foreground mt-2 max-w-sm">
                    This seller profile is unavailable.
                </p>
                <Link to="/browse" className="mt-6">
                    <Button>Back to Browse</Button>
                </Link>
            </div>
        );
    }

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    const { user, stats, reviews, posts } = profile;

    return (
        <div className="pb-12">

            {/* --- 1. CINEMATIC COVER HEADER --- */}
            <div className="relative h-48 md:h-64 bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary to-secondary/60 opacity-90" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                {/* Decorative Circles */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

                <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 flex gap-2">
                    {isOwner && (
                        <Button variant="secondary" size="sm" className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md">
                            Edit Cover
                        </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={handleShare} className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md">
                        <Share2 className="w-4 h-4 mr-2" /> Share Store
                    </Button>
                </div>
            </div>

            <div className="container max-w-5xl">
                <div className="relative -mt-16 md:-mt-20 mb-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">

                    {/* Avatar (Overlapping Banner) */}
                    <div className="relative shrink-0 mx-auto md:mx-0">
                        <div className="p-1.5 bg-background rounded-full">
                            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-2xl">
                                <AvatarImage src={user.profile_picture_url} className="object-cover" />
                                <AvatarFallback className="text-4xl bg-slate-100 font-display">{user.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                        {user.is_seller && (
                            <div className="absolute bottom-4 right-4 bg-secondary text-white p-1.5 rounded-full ring-4 ring-background shadow-lg text-xs font-bold flex items-center gap-1" title="Verified Seller">
                                <ShieldCheck className="h-4 w-4 fill-current" />
                            </div>
                        )}
                    </div>

                    {/* Identity & Stats */}
                    <div className="flex-1 text-center md:text-left pt-2 md:pt-20 w-full">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground">{user.full_name}</h1>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-muted-foreground">
                                    {user.universityName && (
                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                            <MapPin className="h-4 w-4" />
                                            {user.universityName}
                                        </div>
                                    )}
                                    <span className="hidden md:inline">•</span>
                                    <span className="text-sm">{user.college_name || 'Student Creator'}</span>
                                </div>

                                {/* AUTHORITY CHIPS */}
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                                    {expertiseBadges.map((badge, i) => (
                                        <Badge key={i} variant="outline" className={cn("gap-1.5 py-1", badge.color)}>
                                            <badge.icon className="h-3.5 w-3.5" /> {badge.label}
                                        </Badge>
                                    ))}
                                    {!expertiseBadges.length && <Badge variant="secondary" className="text-muted-foreground opacity-50">New Seller</Badge>}
                                </div>
                            </div>

                            {/* Actions & Key Stats */}
                            <div className="flex flex-col gap-4 w-full md:w-auto mt-4 md:mt-0">
                                <div className="flex gap-3 justify-center md:justify-end">
                                    {isOwner ? (
                                        <Button onClick={() => navigate('/account')} variant="outline">Edit Profile</Button>
                                    ) : (
                                        <Button onClick={handleMessage} className="shadow-lg shadow-primary/25">Contact Seller</Button>
                                    )}
                                </div>
                                <div className="flex gap-6 justify-center md:justify-end text-sm">
                                    <div className="text-center">
                                        <div className="font-bold text-xl">{stats.avgRating || '0.0'}</div>
                                        <div className="text-muted-foreground text-xs uppercase tracking-wide">Rating</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-xl">{stats.notesCount}</div>
                                        <div className="text-muted-foreground text-xs uppercase tracking-wide">Products</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-xl">{stats.reviewCount}</div>
                                        <div className="text-muted-foreground text-xs uppercase tracking-wide">Sales</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        {user.bio && (
                            <p className="mt-6 text-foreground/80 leading-relaxed max-w-3xl mx-auto md:mx-0">{user.bio}</p>
                        )}
                    </div>
                </div>


                {/* --- 2. SPOTLIGHT (FEATURED NOTE) --- */}
                {featuredNote && activeTab === 'shop' && (
                    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-muted-foreground/70 uppercase tracking-widest">
                            <Sparkles className="h-4 w-4 text-amber-500" /> Featured Pick
                        </div>
                        <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                            <div className="flex flex-col md:flex-row">
                                {/* Image Side */}
                                <div className="md:w-1/3 aspect-[4/3] md:aspect-auto relative overflow-hidden">
                                    <img
                                        src={featuredNote.cover_image || 'https://placehold.co/600x400'}
                                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-warning hover:bg-warning/90 text-primary-foreground border-0 font-bold shadow-lg">Seller's Choice</Badge>
                                    </div>
                                </div>
                                {/* Content Side */}
                                <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-center relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-display font-bold leading-tight mb-2">{featuredNote.title}</h3>
                                            <div className="flex items-center gap-2 text-slate-300 text-sm">
                                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                                <span className="font-bold text-white">{featuredNote.average_rating || 'New'}</span>
                                                <span>•</span>
                                                <span>{featuredNote.pages || 24} Pages</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-accent">₹{featuredNote.price_inr}</div>
                                        </div>
                                    </div>
                                    <p className="text-slate-300 line-clamp-2 md:line-clamp-3 mb-6 leading-relaxed">
                                        {featuredNote.description || "Get top grades with this comprehensive study guide. Verified for accuracy and exam relevance."}
                                    </p>
                                    <div className="flex gap-4">
                                        <Button onClick={() => navigate(`/notes/${featuredNote.id}`)} size="lg" className="bg-white text-slate-900 hover:bg-slate-200 font-bold border-0">
                                            View Featured Note
                                        </Button>
                                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate(`/notes/${featuredNote.id}`)}>
                                            Read Preview
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* --- 3. EDGE-TO-EDGE TABS --- */}
                <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
                    <div className="border-b border-border/60 sticky top-0 bg-background/95 backdrop-blur z-20 mb-8">
                        <TabsList className="bg-transparent h-14 w-full justify-start gap-8 rounded-none p-0 overflow-x-auto no-scrollbar">
                            <TabsTrigger
                                value="shop"
                                className="h-full px-2 rounded-none border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground font-semibold tracking-tight transition-all text-base"
                            >
                                <Grid className="w-4 h-4 mr-2" />
                                STORE
                            </TabsTrigger>
                            <TabsTrigger
                                value="feed"
                                className="h-full px-2 rounded-none border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground font-semibold tracking-tight transition-all text-base"
                            >
                                <Rss className="w-4 h-4 mr-2" />
                                FEED
                            </TabsTrigger>
                            <TabsTrigger
                                value="reviews"
                                className="h-full px-2 rounded-none border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground font-semibold tracking-tight transition-all text-base"
                            >
                                <Star className="w-4 h-4 mr-2" />
                                REVIEWS
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* SHOP TAB WITH SEARCH */}
                    <TabsContent value="shop" className="animate-in fade-in slide-in-from-bottom-2 duration-500 min-h-[400px]">

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                            <div className="relative w-full md:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search store..."
                                    className="pl-9 bg-muted/30"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">
                                Showing {filteredNotes.length} Products
                            </div>
                        </div>

                        {filteredNotes.length === 0 ? (
                            <div className="text-center py-20 border border-dashed rounded-2xl bg-muted/10">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="h-8 w-8 opacity-50" />
                                </div>
                                <h3 className="font-semibold text-lg">No products found</h3>
                                <p className="text-muted-foreground mt-1">Try adjusting your search terms</p>
                                {isOwner && (
                                    <Button className="mt-4" onClick={() => navigate('/seller/upload')}>
                                        <Plus className="mr-2 h-4 w-4" /> Upload Note
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {filteredNotes.map((note: any) => (
                                    <Link
                                        to={`/notes/${note.id}`}
                                        key={note.id}
                                        className="group relative flex flex-col gap-3"
                                    >
                                        <div className="relative aspect-[4/5] bg-muted overflow-hidden rounded-xl border border-border/50 shadow-sm transition-all group-hover:shadow-lg group-hover:-translate-y-1">
                                            <img
                                                src={note.cover_image || 'https://placehold.co/400x500?text=Note'}
                                                alt={note.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            {/* MOBILE PERSISTENT OVERLAY / DESKTOP HOVER */}
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                                                <Button size="sm" className="w-full font-bold bg-white text-black hover:bg-white/90">View Details</Button>
                                            </div>
                                            <div className="absolute top-2 right-2">
                                                <Badge className="bg-black/50 hover:bg-black/70 backdrop-blur text-white border-0 font-bold">₹{note.price_inr}</Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-bold text-sm leading-tight line-clamp-2 md:text-base group-hover:text-primary transition-colors">{note.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-0.5">
                                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                    <span className="font-medium text-foreground">{note.average_rating || 0}</span>
                                                </div>
                                                <span>•</span>
                                                <span>{note.pages || 10} Pages</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="feed" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="max-w-xl mx-auto space-y-8 mt-6">
                            {isOwner && (
                                <div className="flex justify-end sticky top-20 z-10 pointer-events-none">
                                    <div className="pointer-events-auto">
                                        <CreatePostDialog onPostCreated={() => {
                                            setRefetchTrigger(prev => prev + 1);
                                            refetch();
                                        }} />
                                    </div>
                                </div>
                            )}

                            {!posts || posts.length === 0 ? (
                                <EmptyState label="No updates shared yet" icon={Rss} />
                            ) : (
                                posts.map((post: Post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onDelete={(id) => {
                                            setRefetchTrigger(prev => prev + 1);
                                            refetch();
                                        }}
                                    />
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="animate-in fade-in slide-in-from-bottom-2 duration-500 mt-6">
                        {reviews.length === 0 ? (
                            <EmptyState label="No reviews yet" icon={Star} />
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {reviews.map((review: any) => (
                                    <div key={review.id} className="p-5 border border-border/60 rounded-xl bg-card hover:bg-muted/10 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="w-10 h-10 border shadow-sm">
                                                <AvatarImage src={review.users?.profile_picture_url} />
                                                <AvatarFallback>{review.users?.full_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="truncate pr-2">
                                                        <p className="font-semibold text-sm truncate">{review.users?.full_name || 'Anonymous'}</p>
                                                        <p className="text-xs text-muted-foreground truncate">on <span className="font-medium text-foreground">{review.notes?.title}</span></p>
                                                    </div>
                                                    <div className="flex gap-0.5 shrink-0">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted/30'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {review.comment}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                </Tabs>

            </div>
        </div>
    );
}

function EmptyState({ label, icon: Icon }: { label: string, icon: any }) {
    return (
        <div className="py-20 text-center flex flex-col items-center justify-center text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4 ring-1 ring-border/50">
                <Icon className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="font-semibold text-lg">{label}</h3>
        </div>
    );
}

function ProfileSkeleton() {
    return (
        <div className="container max-w-4xl py-10 space-y-8">
            <div className="h-48 bg-muted rounded-xl w-full" />
            <div className="flex gap-8 -mt-12 px-8">
                <Skeleton className="h-40 w-40 rounded-full border-4 border-background" />
            </div>
            <div className="space-y-6 px-8">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-40" />
            </div>
        </div>
    );
}
