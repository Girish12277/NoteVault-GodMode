import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Users,
  FileText,
  IndianRupee,
  Download,
  Star,
  ArrowUpRight,
  Building,
  GraduationCap,
  Loader2,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Medal,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';

export default function AdminAnalytics() {
  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: async () => {
      const response = await api.get('/admin/analytics/overview');
      return response.data.data;
    }
  });

  const { data: topSubjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['admin-analytics-top-subjects'],
    queryFn: async () => {
      const response = await api.get('/admin/analytics/top-subjects');
      return response.data.data;
    }
  });

  const { data: topSellers, isLoading: sellersLoading } = useQuery({
    queryKey: ['admin-analytics-top-sellers'],
    queryFn: async () => {
      const response = await api.get('/admin/analytics/top-sellers');
      return response.data.data;
    }
  });

  const { data: universities, isLoading: universitiesLoading } = useQuery({
    queryKey: ['admin-analytics-universities'],
    queryFn: async () => {
      const response = await api.get('/admin/analytics/universities');
      return response.data.data;
    }
  });

  const isLoading = overviewLoading || subjectsLoading || sellersLoading || universitiesLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)] flex-col gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p className="font-mono text-muted-foreground animate-pulse">Loading Intelligence...</p>
        </div>
      </AdminLayout>
    );
  }

  // --- Data Processing for Charts ---

  // Transform Revenue Logic for Chart
  const revenueChartData = overview?.revenueChartData?.map((item: any) => ({
    name: item.month, // Short month name
    revenue: item.revenue,
    revenueK: parseFloat((item.revenue / 1000).toFixed(1))
  })) || [];

  // Transform Subjects for Pie Chart
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
  const subjectChartData = topSubjects?.slice(0, 5).map((subject: any) => ({
    name: subject.name,
    value: subject.downloads
  })) || [];

  // Transform Universities for Bar Chart
  const universityChartData = universities?.slice(0, 5).map((uni: any) => ({
    name: uni.name.length > 20 ? uni.name.substring(0, 18) + '..' : uni.name,
    fullname: uni.name,
    students: uni.students
  })) || [];


  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChartIcon className="h-6 w-6 md:h-8 md:w-8 text-primary" /> Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Real-time platform insights and performance indicators.
          </p>
        </div>
      </div>

      {/* KPI Cards (Glassmorphic) */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/20">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Users className="h-24 w-24" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                <ArrowUpRight className="h-3 w-3 mr-1" /> Live
              </Badge>
            </div>
            <p className="text-4xl font-bold tracking-tight">{overview?.totalUsers?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Active Users</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-info/5 via-transparent to-transparent border-blue-200 dark:border-blue-900">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <FileText className="h-24 w-24" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <FileText className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Database
              </Badge>
            </div>
            <p className="text-4xl font-bold tracking-tight">{overview?.totalNotes?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Total Notes</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent border-emerald-200 dark:border-emerald-900">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <IndianRupee className="h-24 w-24" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <IndianRupee className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                Revenue
              </Badge>
            </div>
            <p className="text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              ₹{overview?.totalRevenue ? (overview.totalRevenue / 100000).toFixed(1) : 0}L
            </p>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Gross Revenue</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-transparent to-transparent border-amber-200 dark:border-amber-900">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Download className="h-24 w-24" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Download className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="border-amber-200 text-amber-600 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                Volume
              </Badge>
            </div>
            <p className="text-4xl font-bold tracking-tight">{overview?.totalPurchases?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Total Purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-7 mb-6 md:mb-8">

        {/* Revenue Trend (Area Chart) - Occupies 4/7 cols */}
        <Card className="lg:col-span-4 border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Revenue Trajectory
            </CardTitle>
            <CardDescription>Monthly revenue performance over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenueGraph" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenueGraph)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mb-2 opacity-20" />
                <p>No revenue data recorded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Subjects (Donut Chart) - Occupies 3/7 cols */}
        <Card className="lg:col-span-3 border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-500" />
              Category Distribution
            </CardTitle>
            <CardDescription>Market share by subject downloads</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px] flex items-center justify-center">
            {subjectChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {subjectChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <PieChartIcon className="h-12 w-12 mb-2 opacity-20" />
                <p>No categorical data available.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Top Universities (Bar Chart) - Occupies 5/12 cols */}
        <Card className="lg:col-span-5 border-border/50 shadow-sm h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-500" />
              Top Universities
            </CardTitle>
            <CardDescription>Institutions with highest student activity</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {universityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={universityChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted/30" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px' }}
                    formatter={(val: number) => [`${val} Students`, 'Activity']}
                  />
                  <Bar dataKey="students" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Building className="h-12 w-12 mb-2 opacity-20" />
                <p>No university data recorded.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Sellers (Podium List) - Occupies 7/12 cols */}
        <Card className="lg:col-span-7 border-border/50 shadow-sm h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Seller Leaderboard
            </CardTitle>
            <CardDescription>Top performing contributors by earnings</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-[350px]">
              <div className="p-6 pt-0 space-y-4">
                {topSellers && topSellers.length > 0 ? (
                  topSellers.map((seller: any, index: number) => (
                    <div key={seller.id} className="group flex items-center justify-between p-3 rounded-xl bg-background border border-border/40 hover:border-primary/30 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm",
                          index === 0 ? "bg-amber-100 text-amber-700 border-2 border-amber-200" :
                            index === 1 ? "bg-slate-100 text-slate-700 border-2 border-slate-200" :
                              index === 2 ? "bg-orange-100 text-orange-800 border-2 border-orange-200" :
                                "bg-muted text-muted-foreground border border-border"
                        )}>
                          {index <= 2 ? <Medal className="h-5 w-5" /> : `#${index + 1}`}
                        </div>

                        {/* Avatar & Info */}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${seller.name}&background=random`} />
                            <AvatarFallback>{seller.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{seller.name}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {seller.rating}
                              </span>
                              <span>•</span>
                              <span>{seller.notes} Notes</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Right */}
                      <div className="text-right">
                        <p className="font-bold text-base text-emerald-600">₹{(seller.earnings / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-muted-foreground">{seller.downloads.toLocaleString()} downloads</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-10">
                    <Trophy className="h-12 w-12 mb-2 opacity-20" />
                    <p>No seller rankings available.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

    </AdminLayout>
  );
}
