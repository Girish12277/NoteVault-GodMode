import { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Lock,
  ShoppingCart,
  Eye,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Note } from '@/types';

interface PDFPreviewProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: () => void;
  isPurchased?: boolean;
}

export function PDFPreview({ note, isOpen, onClose, onAddToCart, isPurchased = false }: PDFPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [imageError, setImageError] = useState(false);
  const maxPreviewPages = isPurchased ? note.pages : 5;
  const totalPages = isPurchased ? note.pages : Math.min(5, note.pages);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    setImageError(false);
  }, [currentPage, note]);

  if (!isOpen) return null;

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleZoomIn = () => {
    if (zoom < 150) setZoom(zoom + 25);
  };

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(zoom - 25);
  };

  // Swipe Handler
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentPage < totalPages) {
      handleNextPage();
    }
    if (isRightSwipe && currentPage > 1) {
      handlePrevPage();
    }
    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-hidden flex flex-col supports-[height:100dvh]:h-[100dvh]">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border z-10 shrink-0 safe-top">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">{note.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-3 w-3" />
                {isPurchased ? 'Full Access' : 'Preview'} • Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-sm">{zoom}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {!isPurchased && (
              <Button onClick={onAddToCart}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy Now - ₹{note.price}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 overflow-auto py-8 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="container">
          {/* Watermark Banner for Preview */}
          {!isPurchased && (
            <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-3">
              <Shield className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="font-medium text-foreground">Preview Mode</p>
                <p className="text-sm text-muted-foreground">
                  You're viewing the first 5 pages. Purchase to access all {note.pages} pages.
                </p>
              </div>
            </div>
          )}

          {/* PDF Page Display */}
          <div
            className="mx-auto bg-card rounded-xl shadow-xl border border-border overflow-hidden transition-all select-none"
            style={{
              maxWidth: `${600 * (zoom / 100)}px`,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center'
            }}
          >
            {/* Simulated PDF Page */}
            <div className={`aspect-[3/4] bg-white relative ${imageError ? 'flex items-center justify-center' : ''}`}>

              {/* Real Content */}
              {note.previewPages && note.previewPages.length > 0 ? (
                // Safe access to preview page or generic placeholder if index out of bounds
                note.previewPages[currentPage - 1] && !imageError ? (
                  <img
                    src={note.previewPages[currentPage - 1]}
                    alt={`Page ${currentPage}`}
                    className="w-full h-full object-contain pointer-events-none"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                    <div className="h-16 w-12 border-2 border-dashed border-muted-foreground/30 rounded mb-2" />
                    <p>{imageError ? 'Failed to load image' : 'Page preview not available'}</p>
                  </div>
                )
              ) : (
                // Fallback for notes with no preview pages at all
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                  <div className="h-20 w-16 border-2 border-dashed border-muted-foreground/30 rounded mb-4" />
                  <p>No preview pages uploaded for this note.</p>
                </div>
              )}

              {/* Page Footer Overlay */}
              <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-500/50 pointer-events-none">
                Page {currentPage}
              </div>
            </div>
          </div>

          {/* Locked Pages Indicator */}
          {!isPurchased && currentPage === 5 && (
            <div className="mt-8 text-center">
              <div className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-border">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {note.pages - 5} More Pages Locked
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Purchase to unlock all {note.pages} pages with instant access
                  </p>
                </div>
                <Button size="lg" onClick={onAddToCart}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Unlock Full Notes - ₹{note.price}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="container flex items-center justify-between h-20">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {/* Page Dots */}
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-2 h-2 rounded-full transition-all ${currentPage === idx + 1
                  ? 'w-8 bg-primary'
                  : 'bg-muted hover:bg-muted-foreground/50'
                  }`}
              />
            ))}
            {!isPurchased && note.pages > 5 && (
              <div className="flex items-center gap-1 ml-2 text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span className="text-xs">+{note.pages - 5}</span>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}