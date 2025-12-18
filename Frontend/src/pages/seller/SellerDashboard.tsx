import { Link } from 'react-router-dom';
import {
  TrendingUp,
  IndianRupee,
  Download,
  Star,
  Plus,
  Wallet,
  Loader2,
  Zap,
  Award,
  ArrowRight,
  Target,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SellerLayout from '@/components/seller/SellerLayout';
import { SellerDashboardSkeleton } from '@/components/seller/SellerDashboardSkeleton';
import { Badge } from '@/components/ui/badge';

// --- SUB-COMPONENTS (Visual Logic) ---

const TimeBasedGreeting = ({ name }: { name?: string }) => {
  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  return (
    <div className="space-y-1">
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground/90">
        {greeting}, <span className="text-primary">{name || 'Partner'}</span>.
      </h1>
      <p className="text-muted-foreground flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
        Let's make some progress today.
      </p>
    </div>
  );
};

const EarningsGoalRing = ({ current, goal }: { current: number, goal: number }) => {
  const percentage = Math.min(100, Math.max(0, (current / goal) * 100));
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG Ring */}
      <svg className="transform -rotate-90 w-24 h-24">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-muted/20"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
        <span className="font-bold text-lg">{Math.round(percentage)}%</span>
        <span className="text-muted-foreground text-[10px]">to Goal</span>
      </div>
    </div>
  );
};

const LevelBadge = ({ sales }: { sales: number }) => {
  let level = "Rookie";
  let color = "bg-slate-500/10 text-slate-600 border-slate-500/20";
  let nextGoal = 10;

  if (sales >= 100) {
    level = "Empire Builder";
    color = "bg-purple-500/10 text-purple-600 border-purple-500/20";
    nextGoal = 1000;
  } else if (sales >= 50) {
    level = "Power Seller";
    color = "bg-amber-500/10 text-amber-600 border-amber-500/20";
    nextGoal = 100;
  } else if (sales >= 10) {
    level = "Rising Star";
    color = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    nextGoal = 50;
  }

  const progress = Math.min(100, (sales / nextGoal) * 100);

  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full border ${color} w-fit`}>
      <Award className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="text-xs font-bold leading-none">{level}</span>
        <span className="text-[10px] opacity-80 leading-tight">Level {sales >= 100 ? 4 : sales >= 50 ? 3 : sales >= 10 ? 2 : 1}</span>
      </div>
      {/* Mini Bar */}
      <div className="w-12 h-1 bg-current/20 rounded-full ml-1">
        <div className="h-full bg-current rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function SellerDashboard() {
  // Fetch dashboard stats
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/seller/dashboard');
      return data.data;
    }
  });

  const stats = dashboardData ? {
    totalEarnings: dashboardData.earnings.totalEarned,
    availableBalance: dashboardData.earnings.availableBalance,
    pendingBalance: dashboardData.earnings.pendingBalance,
    totalNotes: dashboardData.notes.total,
    totalDownloads: dashboardData.notes.totalSales, // Using sales as downloads
    averageRating: dashboardData.reviews.averageRating,
  } : {
    totalEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    totalNotes: 0,
    totalDownloads: 0,
    averageRating: 0,
  };

  const recentTransactions = dashboardData?.recentTransactions || [];

  // Gamification & Goals Logic
  const calcNextEarningsGoal = (current: number) => {
    if (current === 0) return 1000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(current)));
    if (current < magnitude * 2) return magnitude * 2;
    if (current < magnitude * 5) return magnitude * 5;
    return magnitude * 10;
  };
  const earningsGoal = calcNextEarningsGoal(stats.totalEarnings);

  if (isLoading) {
    return (
      <SellerLayout>
        <SellerDashboardSkeleton />
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      {/* 1. COMMAND CENTER HERO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 sm:mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="space-y-4">
          <TimeBasedGreeting />
          <LevelBadge sales={stats.totalDownloads} />
        </div>

        {/* Goal Ring Card */}
        <div className="bg-muted/30 border border-border/50 rounded-2xl p-4 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Monthly Goal</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">₹{stats.totalEarnings.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">/ ₹{earningsGoal.toLocaleString()}</span>
            </div>
          </div>
          <EarningsGoalRing current={stats.totalEarnings} goal={earningsGoal} />
        </div>
      </div>

      {/* 2. THE BENTO GRID (Data Vision) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">

        {/* Earnings (Wide Tile) */}
        <Card className="col-span-1 md:col-span-2 overflow-hidden relative group border-primary/10">
          <div className="absolute right-0 top-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-all" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground mb-1">₹{stats.totalEarnings.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                <TrendingUp className="w-3 h-3 mr-1" /> +12% Growth
              </Badge>
              <span className="text-muted-foreground text-xs">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Available Balance (Action Tile) */}
        <Card className="col-span-1 border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600/80 flex items-center justify-between">
              <span>Available</span>
              <IndianRupee className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-4">₹{stats.availableBalance.toLocaleString()}</div>
            <Link to="/seller/wallet">
              <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
                Withdraw Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Upload (Action Tile - Tall) */}
        <Link to="/seller/upload" className="col-span-1 row-span-2 hidden lg:block h-full group">
          <Card className="h-full bg-primary text-primary-foreground border-none hover:shadow-xl hover:shadow-primary/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Upload Note</h3>
              <p className="text-primary-foreground/80 text-sm mt-1">Add to your store</p>
            </div>
          </Card>
        </Link>

        {/* Stats Row 2 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Downloads
              <Download className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Top 10% of sellers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Rating
              <Star className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats.averageRating}
              <Star className="w-5 h-5 text-amber-400 fill-current" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Solid Reputation
            </p>
          </CardContent>
        </Card>

        {/* Mobile Upload (Visible only on small screens) */}
        <Link to="/seller/upload" className="col-span-1 lg:hidden">
          <Card className="bg-primary text-primary-foreground border-none flex items-center justify-between p-6">
            <div>
              <h3 className="font-bold">Upload Note</h3>
              <p className="text-xs opacity-80">Add to your store</p>
            </div>
            <Plus className="w-6 h-6" />
          </Card>
        </Link>

        {/* Analytics Link */}
        <Link to="/seller/analytics" className="col-span-1">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer group">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
              <BarChart3 className="w-8 h-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
              <h3 className="font-semibold text-sm">Analytics</h3>
            </CardContent>
          </Card>
        </Link>

      </div>

      {/* 3. PULSE FEED (Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Live Pulse</h2>
            <Link to="/seller/wallet">
              <Button variant="ghost" size="sm" className="text-xs">
                View All History <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-0 relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border z-0" />

            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx: any, i: number) => (
                <div key={tx.id} className="relative z-10 flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors group">
                  <div className={`w-12 h-12 rounded-full border-4 border-background flex items-center justify-center shrink-0 shadow-sm ${i === 0 ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        Sold: {tx.note.title}
                      </h4>
                      <span className="font-bold text-green-600">+₹{tx.sellerEarningInr}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()} • Direct Purchase
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-muted rounded-2xl">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="font-medium">No activity yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start your streak today.</p>
                <Link to="/seller/upload"><Button>Upload First Note</Button></Link>
              </div>
            )}

            {/* Gamification Nudge */}
            {recentTransactions.length > 0 && (
              <div className="relative z-10 flex items-start gap-4 p-4 opacity-50">
                <div className="w-12 h-12 rounded-full border-4 border-dashed border-muted bg-transparent flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                </div>
                <div className="pt-3">
                  <p className="text-sm font-medium text-muted-foreground">Your next sale will appear here...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. SIDEBAR WIDGETS */}
        <div className="space-y-6">
          {/* Tips Widget */}
          <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-4 h-4 text-indigo-500" /> Pro Tip
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="mb-4">
                Notes with detailed descriptions sell <strong>3x faster</strong>. Try adding a summary and keywords.
              </p>
              <Link to="/seller/guidelines">
                <Button variant="outline" size="sm" className="w-full">
                  Read Guidelines
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Messages Widget */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Messages
                <span className="text-xs font-normal text-muted-foreground">0 New</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-sm text-muted-foreground">
                No new messages.
                <br />
                <Link to="/messages" className="text-primary hover:underline mt-2 inline-block">Go to Inbox</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SellerLayout>
  );
}
