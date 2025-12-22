import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  IndianRupee,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  BookOpen,
  Shield,
  Menu,
  Bell,
  MessageSquare,
  Search,
  Activity,
  PlusCircle,
  HelpCircle,
  Zap,
  Command,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/layout/NotificationBell';

const formatCount = (count: number) => {
  if (!count) return null;
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['admin-sidebar-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/analytics/sidebar-stats');
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: Users, label: 'Users', href: '/admin/users', badge: formatCount(stats?.usersCount) },
    { icon: FileText, label: 'Content', href: '/admin/content', badge: formatCount(stats?.contentCount) },
    { icon: Ticket, label: 'Coupons', href: '/admin/coupons' },
    { icon: Bell, label: 'Notifications', href: '/admin/notifications', badge: formatCount(stats?.unreadNotificationsCount) },
    { icon: MessageSquare, label: 'Messages', href: '/admin/messages', badge: formatCount(stats?.unreadMessagesCount) },
    { icon: IndianRupee, label: 'Finance', href: '/admin/finance' },
    { icon: AlertTriangle, label: 'Disputes', href: '/admin/disputes', badge: formatCount(stats?.disputesCount) },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];


  const NavLinks = () => (
    <>
      {sidebarItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              'flex items-center justify-between px-4 py-3 text-sm transition-all duration-200 group border-l-[3px]',
              isActive
                ? 'border-primary bg-primary/5 text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium'
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
            </div>
            {item.badge && (
              <Badge variant={isActive ? 'default' : 'outline'} className={cn("text-xs px-1.5 min-w-[20px] justify-center", !isActive && "text-muted-foreground border-border")}>
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4 border-b border-border bg-muted/20">
                  <Link to="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shadow-sm">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <span className="font-display text-lg font-bold block leading-none">Admin Panel</span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">StudyVault</span>
                    </div>
                  </Link>
                </div>
                <nav className="p-4 space-y-1">
                  <NavLinks />
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo Desktop */}
            <Link to="/admin" className="hidden lg:flex items-center gap-3 transition-opacity hover:opacity-90">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold leading-none">Administration</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">StudyVault v2.4</span>
              </div>
            </Link>

            {/* System Health Divider */}
            <div className="hidden lg:block h-6 w-px bg-border/60 mx-2" />

            {/* System Status Status */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border text-muted-foreground text-xs font-medium cursor-help">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </div>
                    Systems Nominal
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>All services operational • Latency: 24ms</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

          </div>

          {/* Center Omnibar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <Input
                placeholder="Search users, transactions, logs..."
                className="pl-9 pr-12 bg-muted/50 border-border/50 focus:bg-background transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
                <Command className="h-3 w-3" />
                <span className="text-xs font-bold">K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="hidden sm:flex gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 shadow-none">
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden lg:inline">Quick Action</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Create New</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <MessageSquare className="mr-2 h-4 w-4" /> Broadcast Message
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" /> Verify User
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Zap className="mr-2 h-4 w-4" /> Trigger Payouts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <NotificationBell />

            {/* View Site */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="View notifications">
                      <BookOpen className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Switch to Student View</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1 ring-2 ring-transparent hover:ring-border transition-all">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=0f172a&color=fff`} />
                    <AvatarFallback>{user?.name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'AD'}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Administrator'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || 'admin@studyvault.com'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Admin Guide</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
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
          <div className="absolute bottom-4 left-4 right-4 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pro Tip</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use <kbd className="px-1 py-0.5 rounded bg-background border border-border font-mono text-foreground font-bold">⌘K</kbd> to open quick search anytime.
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
