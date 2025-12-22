import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { Note } from '@/types';
import {
  Star,
  Download,
  Heart,
  ShoppingCart,
  Share2,
  Shield,
  Clock,
  FileText,
  User,
  ChevronRight,
  Eye,
  Lock,
  Loader2,
  AlertCircle,
  Globe,
  Zap,
  CheckCircle2,
  Flame,
  Award,
  ThumbsUp,
  Filter,
  MessageCircle,
  MoreHorizontal,
  Flag,
  HelpCircle,
  BookOpen,
  LayoutList,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { PDFPreview } from '@/components/notes/PDFPreview';
import { NoteCard } from '@/components/notes/NoteCard';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';


// --- HELPERS ---
const getTopicExtras = (text: string, index: number, total: number) => {
  const lower = text.toLowerCase();

  // 1. Determine Icon type
  let Icon = BookOpen;
  if (lower.includes('intro') || lower.includes('overview') || lower.includes('syllabus')) Icon = Flag;
  if (lower.includes('summary') || lower.includes('conclusion') || lower.includes('recap')) Icon = FileText;
  if (lower.includes('question') || lower.includes('quiz') || lower.includes('exam') || lower.includes('test') || lower.includes('pyq')) Icon = HelpCircle;

  // 2. Determine Badge (if special)
  let badge = null;
  if (lower.includes('20') && (lower.includes('pyq') || lower.includes('paper'))) badge = <Badge variant="outline" className="text-xs h-4 px-1.5 border-amber-200 text-amber-700 bg-amber-50">Previous Year</Badge>;
  if (lower.includes('important') || lower.includes('imp')) badge = <Badge variant="outline" className="text-xs h-4 px-1.5 border-rose-200 text-rose-700 bg-rose-50">Important</Badge>;

  // 3. Status Color (Timeline Node)
  // First item = Start (Green), Last item = Finish (Flag), Middle = Blue
  let nodeColor = "border-primary/30 bg-background";
  if (index === 0) nodeColor = "border-emerald-500 bg-emerald-50";
  if (index === total - 1) nodeColor = "border-primary bg-primary/5";

  return { Icon, badge, nodeColor };
};


const ReviewsSection = ({ noteId, isPurchased, userId, isOwner }: { noteId: string; isPurchased: boolean; userId?: string; isOwner?: boolean }) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | '5' | 'critical'>('all');
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());

  // Fetch Reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', noteId],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/${noteId}`);
      return data.data;
    }
  });

  // Check if user has already reviewed
  const hasReviewed = userId ? reviews.some((r: any) => r.userId === userId) : false;

  // Submit Review
  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: async () => {
      await api.post(`/reviews/${noteId}`, {
        rating,
        title: 'Review',
        comment
      });
    },
    onSuccess: () => {
      toast.success('Review submitted successfully');
      setRating(0);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', noteId] });
      queryClient.invalidateQueries({ queryKey: ['note', noteId] }); // Refresh note rating
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    submitReview();
  };

  const handleHelpful = (reviewId: string) => {
    if (helpfulReviews.has(reviewId)) {
      const newSet = new Set(helpfulReviews);
      newSet.delete(reviewId);
      setHelpfulReviews(newSet);
    } else {
      setHelpfulReviews(prev => new Set(prev).add(reviewId));
      toast.success("Thanks for your feedback!");
    }
  };

  // Calculate stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / totalReviews
    : 0;

  // Filter logic
  const filteredReviews = reviews.filter((r: any) => {
    if (activeFilter === '5') return r.rating === 5;
    if (activeFilter === 'critical') return r.rating <= 2;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* 1. VISUAL DASHBOARD SUMMARY (Desktop Only or Very Simplified on Mobile) */}
      {totalReviews > 0 && (
        <div className="hidden md:grid md:grid-cols-12 gap-6 p-6 rounded-2xl bg-gradient-to-br from-muted/50 via-card to-card border border-border/60 shadow-sm">
          {/* Left: Big Score */}
          <div className="md:col-span-4 flex flex-col items-center justify-center border-r border-border/50 pr-6">
            <div className="relative">
              <span className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-foreground">{averageRating.toFixed(1)}</span>
              <span className="text-xl text-muted-foreground absolute top-1 -right-4">/5</span>
            </div>
            <div className="flex gap-1 text-amber-400 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'fill-current' : 'text-muted/30'}`} />
              ))}
            </div>
            <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              Based on {totalReviews} Reviews
            </div>
          </div>

          {/* Right: Distribution Bars */}
          <div className="md:col-span-8 flex flex-col justify-center gap-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r: any) => r.rating === stars).length;
              const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs group">
                  <div className="flex items-center gap-1 w-12 shrink-0 font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    <span>{stars}</span> <Star className="h-3 w-3 fill-muted text-muted group-hover:fill-amber-400 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <div className="flex-1 h-2.5 bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${stars === 5 ? 'bg-emerald-500' : stars === 4 ? 'bg-emerald-400' : stars === 3 ? 'bg-yellow-400' : 'bg-rose-400'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. FILTER CHIPS & UTILITIES (Compact Select on Mobile) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
        {/* Mobile Filter: Select Dropdown */}
        <div className="md:hidden w-full">
          <Select value={activeFilter} onValueChange={(val) => setActiveFilter(val as any)}>
            <SelectTrigger className="w-full h-8 text-xs bg-background border-input">
              <SelectValue placeholder="Filter Reviews" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews ({totalReviews})</SelectItem>
              <SelectItem value="5">5 Stars Only</SelectItem>
              <SelectItem value="critical">Critical (1-2 Stars)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Filter: Buttons */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn("px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95", activeFilter === 'all' ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground")}
          >
            All Reviews
          </button>
          <button
            onClick={() => setActiveFilter('5')}
            className={cn("px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95", activeFilter === '5' ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground")}
          >
            5 Stars
          </button>
          <button
            onClick={() => setActiveFilter('critical')}
            className={cn("px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95", activeFilter === 'critical' ? "bg-rose-600 text-white shadow-md shadow-rose-600/20" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground")}
          >
            Critical (1-2)
          </button>
        </div>
        <div className="hidden md:flex text-xs text-muted-foreground items-center gap-1">
          <Filter className="h-3 w-3" /> Showing {filteredReviews.length} of {totalReviews}
        </div>
      </div>


      {/* 3. REVIEW LIST */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-2" /> <span className="text-muted-foreground">Loading community feedback...</span></div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-muted/20">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No reviews found</h3>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto mt-1">
              {activeFilter !== 'all' ? "No reviews match this filter. Try selecting 'All Reviews'." : "Be the first to share your experience with this note!"}
            </p>
          </div>
        ) : (
          filteredReviews.map((review: any) => (
            <div key={review.id} className="group p-5 rounded-xl bg-card border border-border/60 hover:border-border transition-all hover:shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border shadow-sm ring-2 ring-background">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${review.userName}`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{review.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-xs text-foreground">{review.userName}</p>
                      {review.isVerifiedPurchase && (
                        <span className="items-center flex gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100/50" title="Verified Purchase">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">• {new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {/* Helpful Button (Mock) */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpful(review.id)}
                  className={cn(
                    "h-8 text-xs gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                    helpfulReviews.has(review.id) ? "text-primary font-medium bg-primary/5" : "text-muted-foreground"
                  )}
                >
                  <ThumbsUp className={cn("h-3.5 w-3.5", helpfulReviews.has(review.id) && "fill-current")} />
                  {helpfulReviews.has(review.id) ? 'Helpful (1)' : 'Helpful'}
                </Button>
              </div>

              <div className="pl-[52px]">
                <p className="text-xs text-foreground/90 leading-relaxed font-normal break-words break-all whitespace-normal">{review.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Write Review - Repositioned to Bottom for Flow */}
      {!hasReviewed && isPurchased && !isOwner && (
        <div className="mt-6 md:mt-8 p-4 md:p-6 rounded-xl border border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
            </div>
            <h4 className="font-semibold text-base md:text-lg">Write a Review</h4>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div className="flex flex-col gap-1.5 md:gap-2">
              <span className="text-[10px] md:text-xs font-medium">How would you rate this note?</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="focus:outline-none transition-transform hover:scale-110 h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-full hover:bg-background"
                  >
                    <Star
                      className={`h-5 w-5 md:h-6 md:w-6 ${star <= (hoveredStar || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted'
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <span className="text-[10px] md:text-xs font-medium">Share your experience</span>
              <Textarea
                placeholder="Did these notes help with your exam? Was the quality good?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                className="bg-background min-h-[80px] md:min-h-[100px] text-xs md:text-sm"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} size="default" className="px-6 h-9 md:h-11 md:px-8 text-xs md:text-sm">
                {isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {!isPurchased && !hasReviewed && !isOwner && (
        <div className="p-4 rounded-xl bg-muted/40 border border-dashed border-border text-center">
          <p className="text-[10px] md:text-xs text-muted-foreground font-medium">
            Purchase this note to unlock the ability to leave a review.
          </p>
        </div>
      )}

      {isOwner && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-[10px] md:text-xs text-primary font-medium">
            You are the owner of this note.
          </p>
        </div>
      )}
    </div>
  );
}

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, isInCart, isInWishlist } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [showPreview, setShowPreview] = useState(false);

  // Fetch Main Note
  const { data: note, isLoading, error } = useQuery({
    queryKey: ['note', id, user?.id], // CRITICAL: Include user.id to prevent caching owner status across accounts
    queryFn: async () => {
      const { data } = await api.get(`/notes/${id}`);
      return data.data as Note & { isPurchased: boolean; isOwner: boolean; fileUrl?: string; isWishlisted: boolean };
    },
    enabled: !!id
  });

  // Fetch Similar Notes (only if main note is loaded)
  const { data: similarNotes } = useQuery({
    queryKey: ['similar-notes', note?.degree, note?.subject],
    queryFn: async () => {
      if (!note) return [];
      const { data } = await api.get('/notes', {
        params: {
          degree: note.degree,
          subject: note.subject,
          limit: 4
        }
      });
      // Filter out current note
      return (data.data.notes as Note[]).filter(n => n.id !== note.id).slice(0, 4);
    },
    enabled: !!note
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-32 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !note) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Note not found</h1>
          <p className="text-muted-foreground mt-2">The note you are looking for does not exist or has been removed.</p>
          <Link to="/browse" className="text-primary hover:underline mt-4 inline-block">
            Browse all notes
          </Link>
        </div>
      </Layout>
    );
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase notes');
      navigate('/auth');
      return;
    }
    addToCart(note);
    navigate('/cart');
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login first');
      navigate('/auth');
      return;
    }
    addToCart(note);
    toast.success('Added to cart!');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleDownload = async () => {
    try {
      toast.info('Preparing download...');
      const { data } = await api.get(`/notes/${id}/download`);
      if (data.success && data.data.downloadUrl) {
        window.open(data.data.downloadUrl, '_blank');
        toast.success('Download started');
      } else {
        toast.error('Download link not received');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.message || 'Download failed. Check your connection and try again.');
    }
  };

  const isUserOwner = (user?.id && note?.sellerId && user.id === note.sellerId) || note.isOwner;
  const isUserPurchaser = isAuthenticated && user?.purchasedNoteIds ? user.purchasedNoteIds.includes(note.id) : false;
  const hasAccess = isUserOwner || isUserPurchaser;

  return (
    <Layout>
      <div className="container py-4 lg:py-8">
        {/* Breadcrumb - Clean */}
        <nav className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground mb-4 md:mb-6 overflow-hidden">
          <Link to="/" className="hover:text-foreground transition-colors shrink-0">Home</Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link to="/browse" className="hover:text-foreground transition-colors shrink-0">Browse</Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link to={`/browse?degree=${note.degree}`} className="hover:text-foreground transition-colors shrink-0">{note.degree}</Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground truncate font-medium max-w-[200px]">{note.title}</span>
        </nav>

        {/* --- MAIN GRID LAYOUT --- */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Content (Span 8) */}
          <div className="lg:col-span-8 space-y-8 min-w-0">

            {/* Header Section (Mobile/Tablet Friendly) */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{note.subject}</Badge>
                <Badge variant="outline">Sem {note.semester}</Badge>
                <Badge variant="secondary" className="gap-1"><Globe className="h-3 w-3" /> {note.language === 'en' ? 'English' : note.language === 'hi' ? 'Hindi' : 'Mix'}</Badge>
              </div>

              <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-bold leading-tight break-words">
                {note.title}
              </h1>

              {/* Rating Row */}
              <div className="flex items-center gap-3 text-[10px] md:text-xs text-muted-foreground">
                <div className="flex items-center gap-1 text-foreground font-medium">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {note.rating?.toFixed(1) || '0.0'}
                </div>
                <span>•</span>
                <span className="underline decoration-muted-foreground/30 hover:text-foreground cursor-pointer">{note.reviewCount || 0} reviews</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" /> {note.downloadCount} sales
                </div>
              </div>
            </div>

            {/* The Preview Carousel */}
            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-border/50 bg-background">
              <Carousel
                className="w-full relative group"
                opts={{ loop: true }}
                plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
              >
                <CarouselContent>
                  <CarouselItem className="bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-0">
                    <img src={note.coverImage || 'https://placehold.co/600x800?text=Notes'} alt={note.title} className="w-full max-h-[300px] sm:max-h-[500px] object-contain" />
                  </CarouselItem>
                  {note.previewPages?.filter(p => p !== note.coverImage).map((page, index) => (
                    <CarouselItem key={index} className="bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-0">
                      <img src={page} alt={`Page ${index + 1}`} className="w-full max-h-[300px] sm:max-h-[500px] object-contain" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {(note.previewPages?.length || 0) > 1 && (
                  <>
                    <CarouselPrevious className="left-4 h-11 w-11 border-none bg-black/20 text-white hover:bg-black/40" />
                    <CarouselNext className="right-4 h-11 w-11 border-none bg-black/20 text-white hover:bg-black/40" />
                  </>
                )}
              </Carousel>
            </div>

            {/* Mobile Purchase Card (Visible only on small screens) */}
            <div className="lg:hidden rounded-xl bg-card border border-border p-3 md:p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xl md:text-2xl font-bold text-primary">{formatCurrency(note.price)}</span>
                <Badge variant="outline" className="text-[10px] md:text-xs text-green-600 bg-green-50 border-green-200">Instant Download</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <Button onClick={handleBuyNow} className="w-full font-semibold h-9 md:h-10 text-xs md:text-sm">Buy Now</Button>
                <Button variant="outline" onClick={() => isInCart(note.id) ? navigate('/cart') : handleAddToCart} className={cn("h-9 md:h-10 text-xs md:text-sm", isInCart(note.id) && "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100")}>
                  {isInCart(note.id) ? <><CheckCircle2 className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Go to Cart</> : <><ShoppingCart className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Add to Cart</>}
                </Button>
              </div>
            </div>

            {/* TABS - Description & Reviews */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none h-auto p-0 gap-4 md:gap-6">
                <TabsTrigger value="description" className="px-0 pb-2 md:pb-3 text-sm md:text-base rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground transition-all">
                  Description
                </TabsTrigger>
                <TabsTrigger value="contents" className="px-0 pb-2 md:pb-3 text-sm md:text-base rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground transition-all">
                  Contents
                </TabsTrigger>
                <TabsTrigger value="reviews" className="px-0 pb-2 md:pb-3 text-sm md:text-base rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground transition-all">
                  Reviews ({note.reviewCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="py-4 md:py-6 space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs md:text-base">
                  <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{note.description}</p>
                </div>

                {/* Quick Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-1">
                    <div className="text-xs text-muted-foreground">Pages</div>
                    <div className="font-semibold">{note.pages} Pages</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-1">
                    <div className="text-xs text-muted-foreground">Format</div>
                    <div className="font-semibold uppercase">{note.format}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-1">
                    <div className="text-xs text-muted-foreground">Updated</div>
                    <div className="font-semibold">{new Date(note.updatedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-1">
                    <div className="text-xs text-muted-foreground">Quality</div>
                    <div className="font-semibold text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contents" className="py-6 animate-in fade-in slide-in-from-left-2 duration-300">
                {note.tableOfContents?.length ? (
                  <div className="relative pl-4 space-y-0 border-l-2 border-primary/10 ml-3">
                    {note.tableOfContents.map((item, i) => {
                      const { Icon, badge, nodeColor } = getTopicExtras(item, i, note.tableOfContents!.length);
                      return (
                        <div key={i} className="group relative pl-8 py-3 transition-all hover:bg-muted/30 rounded-r-xl -ml-[2px] cursor-default">
                          {/* Timeline Node */}
                          {/* We center the node on the timeline line (left: -9px to center on border 2px + padding) */}
                          <div className={cn("absolute left-[-9px] top-4 h-4 w-4 rounded-full border-2 transition-all group-hover:scale-125 z-10 flex items-center justify-center", nodeColor)}>
                            <div className="h-1.5 w-1.5 rounded-full bg-current opacity-50 group-hover:opacity-100 transition-opacity" />
                          </div>

                          {/* Content */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors leading-relaxed">
                              {item}
                            </span>
                            {/* Auto Badge */}
                            {badge}
                            {/* Hover Icon Reveal */}
                            <Icon className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all -ml-1 group-hover:ml-0" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                    <div className="flex justify-center mb-2">
                      <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p>No table of contents available for this note.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="py-6 animate-in fade-in slide-in-from-left-2 duration-300">
                <ReviewsSection noteId={id!} isPurchased={isUserPurchaser} userId={user?.id} isOwner={isUserOwner} />
              </TabsContent>
            </Tabs>


          </div>


          {/* RIGHT COLUMN: STICKY SIDEBAR (Span 4) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit hidden lg:block">
            {/* UNIFIED CONVERSION CARD */}
            <div className="rounded-2xl border border-primary/20 bg-card shadow-xl shadow-primary/5 overflow-hidden">

              {/* Header Badge */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 flex items-center justify-center gap-2 text-xs font-bold text-primary uppercase tracking-wider border-b border-primary/10">
                <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500 animate-pulse" /> Trending Now
              </div>

              <div className="p-6 space-y-6">

                {/* Price & Social Proof Header */}
                <div className="space-y-2">
                  {/* Social Proof (Star Rating Nudge) */}
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(note.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <span className="text-amber-500 font-bold">{note.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-xs">({note.reviewCount || 0} reviews)</span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-display text-foreground">{formatCurrency(note.price)}</span>
                    {!hasAccess && <span className="text-xs text-muted-foreground line-through">₹{Math.round(note.price * 1.5)}</span>}
                  </div>
                </div>

                {/* Value Injection - Highlights Checklist */}
                {!hasAccess && (
                  <ul className="space-y-2.5">
                    <li className="flex items-start gap-2.5 text-xs">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <span className="text-muted-foreground"><strong>Exam Oriented</strong> content structure</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                        <Zap className="h-3 w-3 fill-current" />
                      </div>
                      <span className="text-muted-foreground"><strong>Instant PDF Download</strong> (No waiting)</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                        <Award className="h-3 w-3" />
                      </div>
                      <span className="text-muted-foreground"><strong>High Quality</strong> Scans & Formatting</span>
                    </li>
                  </ul>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  {hasAccess ? (
                    <Button size="lg" className="w-full gap-2 font-bold shadow-lg shadow-primary/20 h-12 text-base" onClick={handleDownload}>
                      <Download className="h-5 w-5" /> Download PDF
                    </Button>
                  ) : (
                    <>
                      <Button size="lg" className="w-full gap-2 font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all h-12 text-base" onClick={handleBuyNow}>
                        Buy Now
                      </Button>
                      <div className="grid grid-cols-4 gap-2">
                        <Button variant="outline" size="sm" onClick={() => isInCart(note.id) ? navigate('/cart') : handleAddToCart} className={cn("col-span-3 gap-2", isInCart(note.id) && "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100")}>
                          {isInCart(note.id) ? <><CheckCircle2 className="h-4 w-4" /> Go to Cart</> : <><ShoppingCart className="h-4 w-4" /> Add to Cart</>}
                        </Button>
                        <Button variant="outline" size="lg" className="col-span-1 px-0" onClick={() => addToWishlist(note)} disabled={isInWishlist(note.id)}>
                          <Heart className={cn("h-5 w-5", isInWishlist(note.id) && "fill-destructive text-destructive")} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Trust Signals */}
                <div className="flex items-center justify-center gap-4 pt-2 opacity-80">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    <Lock className="h-3 w-3" /> Secure Payment
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    <Shield className="h-3 w-3" /> Money Back Guarantee
                  </div>
                </div>

              </div>

              {/* SELLER FOOTER (Merged) */}
              <div className="bg-muted/30 border-t border-border p-4 flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border shadow-sm">
                  <AvatarImage src={`https://ui-avatars.com/api/?name=${note.sellerName}`} />
                  <AvatarFallback>SN</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Sold by</div>
                  <Link to={`/profile/${note.sellerId}`} className="font-semibold text-xs hover:underline truncate block text-foreground">
                    {note.sellerName}
                  </Link>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-muted-foreground">{note.downloadCount} Sales</div>
                  <Badge variant="outline" className="text-xs h-5 border-blue-200 text-blue-700 bg-blue-50">Verified</Badge>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Similar Notes Section */}
        {similarNotes && similarNotes.length > 0 && (
          <section className="mt-16 pt-10 border-t border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold">You might also like</h2>
              <Link to={`/browse?degree=${note.degree}`} className="text-primary hover:underline text-xs font-medium">View All</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {similarNotes.map((similarNote) => (
                <NoteCard key={similarNote.id} note={similarNote} />
              ))}
            </div>
          </section>
        )}

        {/* MOBILE FIXED BOTTOM BAR */}
        {!hasAccess && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-50 lg:hidden safe-area-bottom shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
            <div className="flex gap-4 items-center max-w-md mx-auto">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground font-medium">Total Price</div>
                <div className="text-xl font-bold text-primary">₹{note.price}</div>
              </div>
              <div className="flex gap-2 flex-1">
                <Button className="flex-1 shadow-lg shadow-primary/20" onClick={handleBuyNow}>Buy Now</Button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* PDF Preview Modal */}
      < PDFPreview
        note={note}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)
        }
        onAddToCart={handleAddToCart}
      />
    </Layout>
  );
}