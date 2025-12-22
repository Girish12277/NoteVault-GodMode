import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Download,
  ArrowUpRight,
  Search,
  Command,
  Activity,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  CreditCard,
  ShieldAlert,
  Zap,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from './AdminLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// --- Omni-Search Component ---
function OmniSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard Shortcut (Cmd+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Simple Command Navigation Logic
  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.toLowerCase();
    if (q.includes('user')) navigate('/admin/users');
    else if (q.includes('note') || q.includes('content')) navigate('/admin/content');
    else if (q.includes('dispute') || q.includes('report')) navigate('/admin/disputes');
    else if (q.includes('setting')) navigate('/admin/settings');
    else if (q.includes('finance')) navigate('/admin/finance');
    else if (q.length > 0) navigate(`/admin/content?search=${query}`); // Default fallback
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8 relative z-20">
      <div className={cn(
        "relative flex items-center bg-background/50 backdrop-blur-xl border border-border/50 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
        isOpen && "ring-2 ring-primary/20 border-primary/50 scale-[1.02]"
      )}>
        <Search className="ml-3 sm:ml-4 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        <form onSubmit={handleCommand} className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder="Type a command or search..."
            className="h-10 sm:h-14 border-0 bg-transparent text-sm sm:text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </form>
        <div className="mr-3 sm:mr-4 flex items-center gap-2">
          <kbd className="pointer-events-none hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Quick Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && query.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-16 left-0 right-0 bg-card border border-border/50 rounded-xl shadow-2xl p-2 grid grid-cols-2 gap-2 z-50 backdrop-blur-md"
          >
            {[
              { label: 'Manage Users', icon: Users, link: '/admin/users', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Review Content', icon: FileText, link: '/admin/content', color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { label: 'Resolve Disputes', icon: ShieldAlert, link: '/admin/disputes', color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { label: 'Platform Settings', icon: TrendingUp, link: '/admin/settings', color: 'text-slate-500', bg: 'bg-slate-500/10' },
            ].map((item) => (
              <Link key={item.link} to={item.link} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", item.bg, item.color)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Status HUD Card ---
const HUDCard = ({ title, value, growth, icon: Icon, colorClass, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 sm:p-6 hover:bg-card/80 transition-all duration-500 group"
  >
    <div className={cn("absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500", colorClass)}>
      <Icon className="h-16 w-16 sm:h-24 sm:w-24" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 text-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider">
        <Icon className="h-3 w-3 sm:h-4 sm:w-4" /> {title}
      </div>
      <div className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
        {value}
      </div>
      {growth !== undefined && (
        <div className="flex items-center mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-emerald-500 bg-emerald-500/10 w-fit px-1.5 sm:px-2 py-0.5 rounded-full">
          <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          {growth}% <span className="text-muted-foreground ml-0.5 sm:ml-1 font-normal hidden sm:inline">vs last week</span>
        </div>
      )}
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard');
      return data.data;
    }
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center h-screen items-center flex-col gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
            <div className="absolute inset-2 rounded-full border-r-2 border-primary/50 animate-spin-reverse" />
          </div>
          <p className="text-muted-foreground font-mono text-sm animate-pulse">Initializing Orbital Command...</p>
        </div>
      </AdminLayout>
    );
  }

  const stats = {
    totalUsers: dashboardData?.users?.total || 0,
    activeNotes: dashboardData?.notes?.approved || 0,
    totalRevenue: dashboardData?.revenue?.totalRevenue || 0,
    pendingDisputes: dashboardData?.disputes?.pending || 0,
    usersGrowth: dashboardData?.growthStats?.users || 0,
    notesGrowth: dashboardData?.growthStats?.notes || 0,
    revenueGrowth: dashboardData?.growthStats?.revenue || 0,
    todaySales: dashboardData?.users?.newToday || 0,
    todayRevenue: dashboardData?.revenue?.today || 0
  };

  const recentOrders = dashboardData?.recentOrders || [];
  const topNotes = dashboardData?.topNotes || [];

  return (
    <AdminLayout>
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <div className="mb-6 sm:mb-10 text-center relative">
        <Badge variant="outline" className="mb-3 sm:mb-4 bg-background/50 backdrop-blur border-primary/20 text-primary text-[10px] sm:text-xs h-5 sm:h-6">
          <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 fill-current" /> System Status: Operational
        </Badge>
        <h1 className="font-display text-xl sm:text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
          Orbital Command
        </h1>
      </div>

      {/* 1. Omni-Search */}
      <OmniSearch />

      {/* 2. System Pulse HUD */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4 mb-8 md:mb-10">
        <HUDCard
          title="Total Users"
          value={stats.totalUsers}
          growth={stats.usersGrowth}
          icon={Users}
          colorClass="text-blue-500"
          delay={0.1}
        />
        <HUDCard
          title="Active Content"
          value={stats.activeNotes}
          growth={stats.notesGrowth}
          icon={FileText}
          colorClass="text-purple-500"
          delay={0.2}
        />
        <HUDCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          growth={stats.revenueGrowth}
          icon={IndianRupee}
          colorClass="text-emerald-500"
          delay={0.3}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={cn(
            "relative overflow-hidden rounded-xl sm:rounded-2xl border bg-card/50 backdrop-blur-sm p-4 sm:p-6 hover:bg-card/80 transition-all duration-500 group cursor-pointer",
            stats.pendingDisputes > 0 ? "border-orange-500/50 shadow-lg shadow-orange-500/10" : "border-border/50"
          )}
        >
          <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 text-orange-500">
            <AlertTriangle className="h-16 w-16 sm:h-24 sm:w-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 text-orange-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4" /> Attention Needed
            </div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
              {stats.pendingDisputes}
            </div>
            <div className="flex items-center mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-muted-foreground">
              Pending Disputes
            </div>
            {stats.pendingDisputes > 0 && (
              <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6">
                <Link to="/admin/disputes">
                  <Button size="sm" variant="destructive" className="rounded-full shadow-lg shadow-orange-500/20 h-6 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3">Resolve</Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Live Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden relative">
          <div className="absolute right-0 top-0 p-6 opacity-20"><TrendingUp className="h-32 w-32 -rotate-12 text-primary" /></div>
          <CardContent className="p-8 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <h3 className="font-semibold text-primary">Live Transaction Stream</h3>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold tracking-tight">{stats.todaySales}</p>
              <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest">Sales Today</p>
            </div>
            <div className="mt-6 pt-6 border-t border-primary/10">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Generated Today</p>
                </div>
                <Activity className="h-6 w-6 text-primary/50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20 overflow-hidden relative">
          <div className="absolute right-0 top-0 p-6 opacity-20"><FileText className="h-32 w-32 rotate-12 text-purple-500" /></div>
          <CardContent className="p-8 relative">
            <h3 className="font-semibold text-purple-600 mb-6 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Top Performing Asset
            </h3>
            {topNotes && topNotes[0] ? (
              <>
                <h4 className="text-2xl font-bold line-clamp-2 mb-2">{topNotes[0].title}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="bg-purple-500/10 text-purple-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{topNotes[0].subject || 'General'}</span>
                  <span className="flex items-center"><Download className="h-3 w-3 mr-1" /> {topNotes[0].downloads}</span>
                  <span className="font-mono text-foreground font-bold">₹{(topNotes[0].revenue / 1000).toFixed(1)}k</span>
                </div>
                <Link to="/admin/analytics">
                  <Button variant="outline" className="border-purple-500/20 hover:bg-purple-500/10 text-purple-700">View Analytics</Button>
                </Link>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Action Stream (Recent Orders) */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Action Stream
            </h3>
            <Link to="/admin/finance"><Button variant="ghost" size="sm" className="text-xs">View All History</Button></Link>
          </div>

          <div className="space-y-3">
            {recentOrders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    order.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" :
                      order.status === 'pending' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                  )}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      <span className="text-foreground">{order.buyer}</span> purchased <span className="text-primary">{order.note}</span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">{order.id.slice(0, 8)}</span>
                      <span>•</span>
                      <span>Just now</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-14 sm:pl-0">
                  <div className="text-right mr-2">
                    <div className="font-bold">₹{order.amount}</div>
                    <Badge variant="outline" className={cn(
                      "text-xs h-5 border-0",
                      order.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                        order.status === 'pending' ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                    )}>
                      {order.status}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Order actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem><FileText className="h-3.5 w-3.5 mr-2" /> View Invoice</DropdownMenuItem>
                      <DropdownMenuItem><Users className="h-3.5 w-3.5 mr-2" /> View Buyer</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><XCircle className="h-3.5 w-3.5 mr-2" /> Refund Order</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Links Sidebar */}
        <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 h-fit">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Command Links</h3>
          <div className="space-y-2">
            {[
              { label: 'Platform Users', path: '/admin/users', count: stats.totalUsers },
              { label: 'Content Library', path: '/admin/content', count: stats.activeNotes },
              { label: 'Dispute Center', path: '/admin/disputes', count: stats.pendingDisputes },
              { label: 'Financials', path: '/admin/finance', count: null },
            ].map((item) => (
              <Link key={item.path} to={item.path}>
                <Button variant="ghost" className="w-full justify-between h-12 hover:bg-background hover:shadow-sm" >
                  {item.label}
                  {item.count !== null && (
                    <Badge variant="secondary" className="bg-background text-xs">{item.count}</Badge>
                  )}
                </Button>
              </Link>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-border/50">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Top Notes</h3>
            <div className="space-y-4">
              {topNotes.slice(0, 3).map((note, idx) => (
                <div key={idx} className="flex items-center gap-3 group cursor-pointer hover:bg-background/50 p-2 rounded-lg transition-colors">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{note.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Download className="h-3 w-3" /> {note.downloads}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
