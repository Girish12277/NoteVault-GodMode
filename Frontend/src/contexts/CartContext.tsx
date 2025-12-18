import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, WishlistItem, Note } from '@/types';
import { toast } from 'sonner';

interface CartContextType {
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  addToCart: (note: Note) => void;
  removeFromCart: (noteId: string) => void;
  clearCart: () => void;
  addToWishlist: (note: Note) => void;
  removeFromWishlist: (noteId: string) => void;
  moveToCart: (noteId: string) => void;
  isInCart: (noteId: string) => boolean;
  isInWishlist: (noteId: string) => boolean;
  cartTotal: number;
  cartCount: number;
  wishlistCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem('notesmarket_cart');
    const storedWishlist = localStorage.getItem('notesmarket_wishlist');
    if (storedCart) setCartItems(JSON.parse(storedCart));
    if (storedWishlist) setWishlistItems(JSON.parse(storedWishlist));
  }, []);

  useEffect(() => {
    localStorage.setItem('notesmarket_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('notesmarket_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const addToCart = (note: Note) => {
    if (cartItems.some(item => item.noteId === note.id)) {
      toast.info('Already in cart');
      return;
    }
    setCartItems(prev => [...prev, { noteId: note.id, note, addedAt: new Date() }]);
    toast.success('Added to cart');
  };

  const removeFromCart = (noteId: string) => {
    setCartItems(prev => prev.filter(item => item.noteId !== noteId));
    toast.success('Removed from cart');
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const addToWishlist = (note: Note) => {
    if (wishlistItems.some(item => item.noteId === note.id)) {
      toast.info('Already in wishlist');
      return;
    }
    setWishlistItems(prev => [...prev, { noteId: note.id, note, addedAt: new Date() }]);
    toast.success('Added to wishlist');
  };

  const removeFromWishlist = (noteId: string) => {
    setWishlistItems(prev => prev.filter(item => item.noteId !== noteId));
    toast.success('Removed from wishlist');
  };

  const moveToCart = (noteId: string) => {
    const item = wishlistItems.find(item => item.noteId === noteId);
    if (item) {
      addToCart(item.note);
      removeFromWishlist(noteId);
    }
  };

  const isInCart = (noteId: string) => cartItems.some(item => item.noteId === noteId);
  const isInWishlist = (noteId: string) => wishlistItems.some(item => item.noteId === noteId);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.note.price, 0);
  const cartCount = cartItems.length;
  const wishlistCount = wishlistItems.length;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlistItems,
        addToCart,
        removeFromCart,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        moveToCart,
        isInCart,
        isInWishlist,
        cartTotal,
        cartCount,
        wishlistCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
