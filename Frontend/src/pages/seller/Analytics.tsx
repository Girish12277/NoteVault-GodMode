import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  IndianRupee,
  Activity,
  Zap,
  Target,
  Radar,
  Calendar,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  Legend
} from 'recharts';
import SellerLayout from '@/components/seller/SellerLayout';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// --- COMPONENTS ---

// Self-contained style for Marquee to avoid global CSS dependency
const MarqueeStyles = () => (
  <style>{`
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .animate-marquee-infinite {
        animation: marquee 30s linear infinite;
      }
      .hover-pause:hover .animate-marquee-infinite {
        animation-play-state: paused;
      }
    `}</style>
);

const PredictiveCard = ({ title, value, subtext, trend, icon: Icon, color }: any) => {
  // Extract colors for styling
  const [fromColor, toColor] = color.replace('from-', '').replace('to-', '').split(' ');

  return (
    <Card className="relative overflow-hidden border-border/40 bg-background/50 backdrop-blur-sm group hover:border-primary/50 transition-all duration-500 hover:shadow-lg">
      {/* Ambient Glow */}
      <div className={cn("absolute -right-10 -top-10 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br", color)} />

      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-2.5 rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-md shadow-inner")}>
            <Icon className="w-5 h-5 text-foreground/80 group-hover:text-primary transition-colors" />
          </div>
          {trend !== undefined && (
            <Badge variant="outline" className={cn("border-opacity-20 font-mono", trend > 0 ? "text-emerald-500 border-emerald-500 bg-emerald-500/5" : "text-rose-500 border-rose-500 bg-rose-500/5")}>
              {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(trend)}%
            </Badge>
          )}
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-display font-bold tracking-tight">{value}</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 opacity-80">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            {subtext}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Simple Live Feed (Mocked for visual delight, as real-time requires websocket, but we can seed it with real note names if needed later)
// Keeping it simple for now as requested "Data" focus is on Charts.
const liveFeed = [
  "User_88 just purchased 'Advanced Algorithms'",
  "New 5-star rating on 'OS Internals'",
  "Traffic spike detected in 'AI/ML' category",
  "Wallet: ₹450 credited from recent sales",
  "System: 'DBMS Notes' is trending in your region",
  "Milestone: You reached 500 total downloads!"
];

const Ticker = () => (
  <div className="w-full bg-primary/5 border-y border-primary/10 py-2.5 overflow-hidden flex relative hover-pause">
    <MarqueeStyles />
    <div className="absolute left-0 top-0 bottom-0 w-8 md:w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
    <div className="absolute right-0 top-0 bottom-0 w-8 md:w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

    <div className="flex items-center space-x-8 animate-marquee-infinite whitespace-nowrap px-4 w-max">
      {[...liveFeed, ...liveFeed, ...liveFeed].map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs font-mono text-primary/80">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {item}
        </div>
      ))}
    </div>
  </div>
);

export default function Analytics() {
  const [range, setRange] = useState('30d');

  // --- REAL DATA FETCHING ---

  const { data: performanceData = [], isLoading: isPerformanceLoading } = useQuery({
    queryKey: ['analytics-performance'],
    queryFn: async () => (await api.get('/seller/analytics/performance')).data.data
  });

  const { data: demandData = [], isLoading: isDemandLoading } = useQuery({
    queryKey: ['analytics-radar'],
    queryFn: async () => (await api.get('/seller/analytics/demand-radar')).data.data
  });

  const { data: predictiveData, isLoading: isPredictiveLoading } = useQuery({
    queryKey: ['analytics-predictive'],
    queryFn: async () => (await api.get('/seller/analytics/predictive')).data.data,
    initialData: {
      revenue: { value: 0, subtext: 'Calculating...', trend: 0 },
      views: { value: 0, subtext: 'Estimating...', trend: 0 },
      conversion: { value: 0, subtext: 'Analyzing...', trend: 0 },
      demand: { value: 'Low', subtext: 'Scanning...', trend: 0 },
    }
  });

  const isLoading = isPerformanceLoading || isDemandLoading || isPredictiveLoading;

  if (isLoading) {
    return <SellerLayout><div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div></SellerLayout>
  }

  return (
    <SellerLayout>
      <div className="min-h-screen pb-20 space-y-6 md:space-y-8">

        {/* HEADER */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                Intelligence Hub
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </h1>
              <p className="text-muted-foreground">Predictive insights & market vectors.</p>
            </div>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Ticker />
        </div>

        {/* PREDICTIVE HUD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PredictiveCard
            title="Total Revenue"
            value={`₹${predictiveData.revenue.value.toLocaleString()}`}
            subtext={`Forecast: ₹${predictiveData.revenue.forecast?.toLocaleString()}`}
            trend={predictiveData.revenue.trend}
            icon={IndianRupee}
            color="from-emerald-500 to-teal-500"
          />
          <PredictiveCard
            title="Asset Views"
            value={`${(predictiveData.views.value / 1000).toFixed(1)}K`}
            subtext="High traffic detected"
            trend={predictiveData.views.trend}
            icon={Eye}
            color="from-blue-500 to-indigo-500"
          />
          <PredictiveCard
            title="Conversion Rate"
            value={`${predictiveData.conversion.value}%`}
            subtext="Top 5% of sellers"
            trend={predictiveData.conversion.trend}
            icon={Target}
            color="from-amber-500 to-orange-500"
          />
          <PredictiveCard
            title="Market Demand"
            value={predictiveData.demand.value}
            subtext="Limited supply detected"
            trend={predictiveData.demand.trend}
            icon={Activity}
            color="from-rose-500 to-pink-500"
          />
        </div>

        {/* VISUALIZATION ROW */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* NEON AREA CHART */}
          <Card className="lg:col-span-2 border-border/50 shadow-lg bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" /> Revenue Landscape
              </CardTitle>
              <CardDescription>Growth trajectory with predictive smoothing.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs text-muted-foreground font-mono" dy={10} />
                  <YAxis axisLine={false} tickLine={false} className="text-xs text-muted-foreground font-mono" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase' }}
                    cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={2000} />
                  <Area type="monotone" dataKey="traffic" stroke="hsl(var(--accent))" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* DEMAND RADAR */}
          <Card className="border-border/50 shadow-lg bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Radar className="w-5 h-5 text-accent" /> Demand Radar
              </CardTitle>
              <CardDescription>Supply vs Market Demand</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={demandData}>
                  <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <PolarAngleAxis dataKey="subject" className="text-[10px] font-bold fill-muted-foreground uppercase tracking-widest" />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <RechartsRadar name="Market Demand" dataKey="demand" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <RechartsRadar name="Your Supply" dataKey="supply" stroke="hsl(var(--muted-foreground))" strokeWidth={2} fill="hsl(var(--muted))" fillOpacity={0.1} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </SellerLayout>
  );
}
