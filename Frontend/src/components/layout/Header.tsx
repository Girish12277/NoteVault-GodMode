import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  BookOpen,
  LogOut,
  LayoutDashboard,
  Library,
  BookCopy,
  GraduationCap,
  ChevronDown,
  Filter,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';

import { NotificationBell } from './NotificationBell';
import { LanguageToggle } from './LanguageToggle';
import { OmniSearch } from './OmniSearch';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';

const SEARCH_CATEGORIES = [
  "All Categories",
  "Engineering",
  "Medical",
  "Science",
  "Arts & Humanities",
  "Law",
  "Management"
];

export function Header() {
  const [openSearch, setOpenSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All Categories');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { user, isAuthenticated, logout, refreshProfile } = useAuth();
  const { cartCount, wishlistCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Keyboard Override for Search (Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // If desktop input is visible (ref exists and is reachable), focus it
        if (searchInputRef.current && window.innerWidth >= 768) {
          searchInputRef.current.focus();
        } else {
          // Fallback to modal for mobile
          setOpenSearch((open) => !open);
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: identity } = useQuery({
    queryKey: ['content', 'site-identity'],
    queryFn: () => contentApi.get('site-identity'),
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const siteName = identity?.siteName || 'NotesMarket';
  const logoUrl = identity?.logoUrl;

  const handleBecomeSeller = async () => {
    try {
      const { data } = await api.post('/auth/become-seller');
      if (data.success) {
        toast.success('Congratulations! You are now a seller.');
        await refreshProfile();
        navigate('/seller');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to become seller');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Construct search URL
    let searchUrl = `/browse?q=${encodeURIComponent(searchQuery)}`;
    if (searchCategory !== 'All Categories') {
      searchUrl += `&category=${encodeURIComponent(searchCategory)}`;
    }
    navigate(searchUrl);
  };

  // Reusable Search Form Component
  const SearchForm = ({ mobile = false }: { mobile?: boolean }) => (
    <form onSubmit={handleSearchSubmit} className={cn("flex w-full items-center shadow-sm hover:shadow-md transition-all duration-200", mobile ? "h-10" : "")}>

      {/* Category Dropdown (ShadCN) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 rounded-l-lg rounded-r-none border-r-0 bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground font-normal transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 relative z-10",
              mobile ? "w-10 px-0 justify-center" : "w-[150px] justify-between px-3"
            )}
          >
            {mobile ? (
              <Filter className="h-4 w-4" />
            ) : (
              <>
                <span className="truncate">{searchCategory}</span>
                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          <DropdownMenuLabel>Select Category</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SEARCH_CATEGORIES.map((category) => (
            <DropdownMenuItem
              key={category}
              onClick={() => setSearchCategory(category)}
              className="justify-between cursor-pointer"
            >
              {category}
              {searchCategory === category && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Main Input */}
      <div className="relative flex-1 group">
        <Input
          ref={!mobile ? searchInputRef : undefined}
          type="text"
          placeholder={mobile ? "Search notes..." : "Search for notes, universities, or subjects..."}
          className={cn(
            "h-10 rounded-none focus-visible:ring-0 focus-visible:border-primary/50 text-base relative z-0",
            // On desktop, the input border-l acts as the divider. On mobile, same.
            // We remove border-transparent to let the default border show
          )}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {!mobile && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 opacity-40 pointer-events-none">
            <span className="text-[10px] font-mono border rounded px-1.5 bg-muted">⌘K</span>
          </div>
        )}
      </div>

      {/* Search Button */}
      <Button type="submit" className="h-10 rounded-l-none rounded-r-lg px-4 md:px-6 bg-primary hover:bg-primary/90 transition-all z-10 relative -ml-[1px]">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center gap-4">
        {/* Mobile Menu (Sheet) */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <SheetHeader>
              <SheetTitle className="text-left flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {siteName}
              </SheetTitle>
            </SheetHeader>
            <div className="grid gap-6 py-6 px-2">
              <Link to="/browse" className="flex items-center gap-2 text-lg font-medium">
                <Library className="h-5 w-5" /> Browse Notes
              </Link>
              <Link to="/wishlist" className="flex items-center gap-2 text-lg font-medium">
                <Heart className="h-5 w-5" /> Wishlist
                {wishlistCount > 0 && <Badge variant="secondary" className="ml-auto">{wishlistCount}</Badge>}
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/library" className="flex items-center gap-2 text-lg font-medium">
                    <BookCopy className="h-5 w-5" /> My Library
                  </Link>
                  <Link to="/account" className="flex items-center gap-2 text-lg font-medium">
                    <User className="h-5 w-5" /> Account
                  </Link>
                  <Link to="/seller" className="flex items-center gap-2 text-lg font-medium">
                    <LayoutDashboard className="h-5 w-5" /> Seller Dashboard
                  </Link>
                </>
              ) : (
                <Link to="/auth">
                  <Button className="w-full mt-4">Login / Sign Up</Button>
                </Link>
              )}

              {/* Mobile Language Options */}
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2 px-2">Language</p>
                <div className="flex gap-2">
                  <LanguageToggle />
                </div>
              </div>

            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <div className="flex items-center gap-6 md:gap-8 flex-1 md:flex-none">
          <Link to="/" className="flex items-center space-x-2">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <span className="hidden font-bold sm:inline-block whitespace-nowrap">
              {siteName}
            </span>
          </Link>

          {/* Mega Menu (Desktop) */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">Browse</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/browse"
                        >
                          <BookOpen className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            All Notes
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Explore our complete collection of verified academic notes.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/browse?degree=BTech" title="Engineering (B.Tech)">
                      Start your engineering journey.
                    </ListItem>
                    <ListItem href="/browse?degree=BSc" title="Science (B.Sc)">
                      Physics, Chemistry, Math & more.
                    </ListItem>
                    <ListItem href="/browse?sort=popular" title="Popular Notes">
                      See what everyone is reading.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/how-it-works">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    How it Works
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* E-COMMERCE SEARCH BAR (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-auto px-4">
          <SearchForm />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 md:gap-2 flex-none ml-auto md:ml-0">
          {/* Desktop Only Icons */}
          <div className="hidden md:flex items-center gap-1">
            <LanguageToggle />
            <NotificationBell />

            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Heart className="h-4 w-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {wishlistCount}
                  </span>
                )}
                <span className="sr-only">Wishlist</span>
              </Button>
            </Link>
          </div>

          <Link to="/cart">
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </Link>

          {/* User Profile Avatar */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/library" className="cursor-pointer">
                    <Library className="mr-2 h-4 w-4" /> My Library
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'seller' || user?.role === 'admin' ? (
                  <DropdownMenuItem asChild>
                    <Link to="/seller" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleBecomeSeller} className="cursor-pointer">
                    <GraduationCap className="mr-2 h-4 w-4" /> Become a Seller
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="ml-2 font-bold transition-transform hover:scale-105">Login</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Search Row */}
      <div className="md:hidden container pb-4 px-4 -mt-1">
        <SearchForm mobile={true} />
      </div>

      <OmniSearch open={openSearch} onOpenChange={setOpenSearch} />
    </header>
  );
}

// MegaMenu Item Helper
import React from 'react';
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
