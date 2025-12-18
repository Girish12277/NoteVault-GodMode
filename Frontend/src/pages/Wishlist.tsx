import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BoxSelect,
  X,
  MoveRight,
  Loader2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { NoteCard } from '@/components/notes/NoteCard';
import { useCart } from '@/contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

// --- Smart Discovery Component (Local) ---
function DiscoveryCarousel() {
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['discovery-notes'],
    queryFn: async () => {
      const { data } = await api.get('/notes?limit=6&sort=popular');
      return data.data.notes;
    }
  });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (!notes.length) return null;

  return (
    <div className="mt-12 w-full max-w-6xl mx-auto text-left">
      <div className="flex items-center gap-2 mb-6 text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium tracking-wide uppercase">Trending Collections</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {notes.slice(0, 4).map((note: any, idx: number) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <NoteCard note={note} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- Main Curator Component ---
export default function Wishlist() {
  const { wishlistItems, removeFromWishlist, moveToCart } = useCart();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Toggle single item selection
  const toggleSelection = (noteId: string) => {
    const next = new Set(selected);
    if (next.has(noteId)) {
      next.delete(noteId);
    } else {
      next.add(noteId);
    }
    setSelected(next);
  };

  // Toggle selection mode
  const toggleMode = () => {
    if (isSelectionMode) {
      setIsSelectionMode(false);
      setSelected(new Set());
    } else {
      setIsSelectionMode(true);
    }
  };

  // Batch Acts
  const handleBatchMove = () => {
    let count = 0;
    selected.forEach(id => {
      moveToCart(id);
      count++;
    });
    toast.success(`Moved ${count} items to Cart`);
    setSelected(new Set());
    setIsSelectionMode(false);
  };

  const handleBatchDelete = () => {
    let count = 0;
    selected.forEach(id => {
      removeFromWishlist(id);
      count++;
    });
    toast.error(`Removed ${count} items`);
    setSelected(new Set());
    setIsSelectionMode(false);
  };

  // 1. EMPTY STATE (The Discovery Engine)
  if (wishlistItems.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen container py-16 flex flex-col items-center">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="relative h-24 w-24 mx-auto">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative h-full w-full bg-background rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
                <Heart className="h-10 w-10 text-primary/40" />
              </div>
            </div>

            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Start Your Collection
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Your "Curator" space is empty. Discover top-rated notes and build your personal study stash.
              </p>
            </div>

            <Link to="/browse">
              <Button size="lg" className="rounded-full px-8 shadow-primary/25 shadow-lg">
                Explore Notes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="w-full border-t border-border/40 my-16" />

          <DiscoveryCarousel />
        </div>
      </Layout>
    );
  }

  // 2. FILLED STATE (The Curator)
  return (
    <Layout>
      <div className="min-h-screen bg-background relative pb-24">
        {/* Header */}
        <div className="sticky top-[64px] z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
          <div className="container h-16 flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold flex items-center gap-2">
                My Stash
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {wishlistItems.length}
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isSelectionMode ? "secondary" : "ghost"}
                size="sm"
                onClick={toggleMode}
                className={cn("transition-all", isSelectionMode && "bg-primary/10 text-primary hover:bg-primary/20")}
              >
                {isSelectionMode ? <X className="h-4 w-4 mr-2" /> : <BoxSelect className="h-4 w-4 mr-2" />}
                {isSelectionMode ? "Cancel" : "Select"}
              </Button>
            </div>
          </div>
        </div>

        {/* Masonry Grid */}
        <div className="container py-8">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {wishlistItems.map((item) => {
              const isSelected = selected.has(item.noteId);
              return (
                <div key={item.noteId} className="break-inside-avoid relative group">
                  {/* Selection Overlay */}
                  <div
                    onClick={() => isSelectionMode && toggleSelection(item.noteId)}
                    className={cn(
                      "absolute inset-0 z-20 rounded-xl transition-all duration-200 cursor-pointer",
                      isSelectionMode ? "block" : "hidden pointer-events-none",
                      isSelected ? "bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                    {!isSelected && isSelectionMode && (
                      <div className="absolute top-3 right-3 h-6 w-6 rounded-full border-2 border-muted-foreground/30 bg-background/50 hover:border-primary/50 transition-colors" />
                    )}
                  </div>

                  {/* Note Card */}
                  <div className={cn("transition-transform duration-300", isSelected && "scale-95")}>
                    <NoteCard note={item.note} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Action Dock */}
        <AnimatePresence>
          {isSelectionMode && selected.size > 0 && (
            <div className="fixed bottom-6 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none">
              <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.9 }}
                className="pointer-events-auto flex items-center gap-2 p-2 rounded-full border border-border/50 bg-background/90 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5"
              >
                <div className="pl-4 pr-2 text-sm font-medium">
                  {selected.size} selected
                </div>
                <div className="h-6 w-px bg-border/50" />
                <Button variant="ghost" size="sm" onClick={handleBatchDelete} className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
                <Button size="sm" onClick={handleBatchMove} className="rounded-full pl-3 pr-4 shadow-lg shadow-primary/20">
                  <MoveRight className="h-4 w-4 mr-2" />
                  Move to Cart
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
