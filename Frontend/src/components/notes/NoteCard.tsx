import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Download, Heart, ShoppingCart, Globe, TrendingUp, Sparkles, Award } from 'lucide-react';
import { Note } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NoteCardProps {
  note: Note;
  className?: string;
  showBadge?: 'recommended' | 'rating' | 'new' | 'trending';
  rank?: number;
}

export function NoteCard({ note, className, showBadge, rank }: NoteCardProps) {
  const { addToCart, addToWishlist, removeFromWishlist, isInCart, isInWishlist } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(note);
    toast.success('Added to cart!');
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(note.id)) {
      removeFromWishlist(note.id);
    } else {
      addToWishlist(note);
    }
  };

  const formattedRating = note.rating?.toFixed(1) || '0.0';

  const getBadge = () => {
    if (rank) {
      return (
        <div className={cn(
          "absolute top-3 left-3 z-10 flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm shadow-lg ring-2 ring-white/20 backdrop-blur-md",
          rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-white" :
            rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-white" :
              rank === 3 ? "bg-gradient-to-br from-orange-300 to-orange-500 text-white" :
                "bg-white/90 text-slate-700"
        )}>
          {rank}
        </div>
      );
    }

    const badgeConfig = {
      recommended: { bg: 'bg-indigo-500', text: 'For You', icon: Sparkles },
      rating: { bg: 'bg-amber-500', text: 'Top Rated', icon: Award },
      new: { bg: 'bg-emerald-500', text: 'Fresh', icon: Sparkles },
      trending: { bg: 'bg-rose-500', text: 'Trending', icon: TrendingUp },
    };

    if (showBadge && badgeConfig[showBadge]) {
      const { bg, text, icon: Icon } = badgeConfig[showBadge];
      return (
        <Badge className={cn("absolute top-3 left-3 z-10 text-white border-0 shadow-lg backdrop-blur-sm gap-1.5 py-1 px-2.5", bg)}>
          <Icon className="h-3.5 w-3.5" />
          {text}
        </Badge>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }}
      className={cn(
        'group relative flex flex-col h-full rounded-2xl bg-card border border-border/40 shadow-sm transition-shadow duration-500 hover:shadow-2xl overflow-hidden',
        className
      )}
    >
      {/* 1. COVER IMAGE :: Aspect Ratio 4:5 (Poster Style) */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        <Link to={`/notes/${note.id}`} className="absolute inset-0 z-0">
          <span className="sr-only">View Note</span>
        </Link>
        <img
          src={note.coverImage || 'https://placehold.co/600x800?text=No+Cover'}
          alt={note.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/600x800?text=Cover+Not+Found';
          }}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Overlay Gradient (Subtle) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Top Badges */}
        {getBadge()}
        <Badge variant="secondary" className="absolute top-3 right-3 bg-white/90 text-slate-800 backdrop-blur-md shadow-sm border-0 gap-1 h-6">
          <Globe className="h-3 w-3 text-slate-500" />
          {note.language === 'en' ? 'EN' : note.language === 'hi' ? 'HI' : 'EN/HI'}
        </Badge>

        {/* Bottom Glass Strip (Stats) */}
        <div className="absolute bottom-3 inset-x-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-between text-white text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span>{formattedRating}</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span>{note.downloadCount || 0}</span>
          </div>
        </div>
      </div>

      {/* 2. CONTENT BODY */}
      <div className="flex flex-col flex-1 p-4 gap-3 bg-card relative z-10">

        {/* Meta Header */}
        <div className="flex items-start justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-primary uppercase tracking-wider text-[10px] truncate max-w-[65%] bg-primary/5 px-1.5 py-0.5 rounded-sm">
            {note.subject}
          </span>
          <span className="shrink-0 bg-zinc-100 text-zinc-900 font-bold px-2.5 py-0.5 rounded-full text-[10px] border border-zinc-200">
            Sem {note.semester}
          </span>
        </div>

        {/* Title & Info */}
        <div className="space-y-1">
          <Link to={`/notes/${note.id}`} className="block group/title">
            <h3 className="font-display font-semibold text-lg leading-snug line-clamp-2 break-words text-foreground group-hover/title:text-primary transition-colors duration-300" title={note.title}>
              {note.title}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground line-clamp-1" title={note.college}>
            {note.college || 'University Not Specified'}
          </p>
        </div>

        {/* Price & Actions Footer */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/40">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Price</span>
            <span className="font-display font-bold text-xl text-foreground">
              ₹{note.price}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleAddToWishlist}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800",
                isInWishlist(note.id) && "text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/20"
              )}
            >
              <Heart className={cn("h-5 w-5 transition-transform", isInWishlist(note.id) && "fill-current")} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleAddToCart}
              disabled={isInCart(note.id)}
              className={cn(
                buttonVariants({ variant: "default", size: "icon" }),
                "h-10 w-10 rounded-full shadow-md",
                isInCart(note.id)
                  ? "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <ShoppingCart className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
