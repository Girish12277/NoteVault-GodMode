import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Upload,
  FileText,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  BookOpen,
  Menu,
  Search,
  Bell,
  Command,
  Plus,
  Store,
  HelpCircle,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/layout/NotificationBell';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/seller' },
  { icon: Upload, label: 'Upload Notes', href: '/seller/upload' },
  { icon: FileText, label: 'My Notes', href: '/seller/notes' },
  { icon: Wallet, label: 'Wallet', href: '/seller/wallet' },
  { icon: BarChart3, label: 'Analytics', href: '/seller/analytics' },
  { icon: Settings, label: 'Settings', href: '/seller/settings' },
];

interface SellerLayoutProps {
  children: ReactNode;
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [notifications] = useState(3); // Preserved existing mock state

  const NavLinks = () => (
    <>
      {sidebarItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group relative',
              isActive
                ? 'bg-primary/10 text-primary hover:bg-primary/15'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            {item.label}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground hover:text-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4 border-b border-border bg-muted/20">
                  <Link to="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <span className="font-display text-lg font-bold block leading-none">NotesMarket</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Seller OS</span>
                    </div>
                  </Link>
                </div>
                <nav className="p-4 space-y-1">
                  <NavLinks />
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo Desktop */}
            <Link to="/seller" className="hidden lg:flex items-center gap-3 transition-opacity hover:opacity-90">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                <Store className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold leading-none">Seller Dashboard</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">StudyVault</span>
              </div>
            </Link>

            {/* System Health Divider */}
            <div className="hidden lg:block h-6 w-px bg-border/60 mx-2" />

            {/* Store Status Indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-medium cursor-help">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    Market Online
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your store is visible to students.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Center Omnibar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <Input
                placeholder="Search notes, orders, analytics..."
                className="pl-9 pr-12 bg-muted/50 border-border/50 focus:bg-background transition-all h-9"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
                <Command className="h-3 w-3" />
                <span className="text-xs font-bold">K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick Upload Action */}
            <Link to="/seller/upload">
              <Button size="sm" className="hidden sm:flex gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">New Asset</span>
              </Button>
            </Link>

            {/* Notifications */}
            {/* Notifications */}
            <NotificationBell />

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-border transition-all p-0">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=10b981&color=fff`} />
                    <AvatarFallback>{user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">{user?.fullName?.split(' ')[0] || 'User'}</p>
                      <Badge variant="outline" className="text-xs h-4 px-1 border-primary/30 text-primary bg-primary/5">PRO</Badge>
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || 'user@studyvault.com'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/seller/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/" className="cursor-pointer">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Switch to Buyer</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border bg-card/50 backdrop-blur-sm h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto custom-scrollbar">
          <nav className="p-4 space-y-2">
            <NavLinks />
          </nav>

          {/* Sidebar Footer info */}
          <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs font-bold">Seller Tips</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Complete your profile to increase trust and sales visibility by <span className="font-bold text-foreground">15%</span>.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 lg:max-w-[calc(100vw-16rem)] overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
