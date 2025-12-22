import { useState, useMemo } from 'react';
import {
  IndianRupee,
  TrendingUp,
  Download,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  Wallet,
  ArrowDownLeft,
  PieChart,
  AlertTriangle,
  User,
  FileText,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import AdminLayout from './AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// --- Components ---

const StatCard = ({ title, value, subtext, trend, icon: Icon, color, chartData, dataKey }: any) => {
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all relative">
      <div className={cn("absolute top-0 right-0 p-3 opacity-10", color)}>
        <Icon className="h-16 w-16" />
      </div>
      <CardContent className="p-6">
        <div className="flex flex-col h-full justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl md:text-3xl font-bold font-display mt-2 tracking-tight">{value}</h3>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-center text-xs font-medium">
              {trend && (
                <span className={cn("flex items-center px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400", trend < 0 && "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400")}>
                  {trend > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownLeft className="h-3 w-3 mr-1" />}
                  {Math.abs(trend)}%
                </span>
              )}
              <span className="text-muted-foreground ml-2">{subtext}</span>
            </div>

            {/* Mini Sparkline */}
            <div className="h-10 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" className={color.replace('text-', 'text-opacity-50 text-')} />
                      <stop offset="100%" stopColor="currentColor" className={color.replace('text-', 'text-opacity-0 text-')} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey={dataKey} strokeWidth={2} stroke="currentColor" fill={`url(#gradient-${dataKey})`} className={color} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AdminFinance() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Refund dialog state
  const [selectedRefund, setSelectedRefund] = useState<any | null>(null);
  const [refundAction, setRefundAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch Payouts
  const { data: payouts = [], refetch: refetchPayouts } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async () => {
      const { data } = await api.get('/admin/payouts');
      return data.data;
    }
  });

  // Fetch Transactions
  const { data: transactionsData } = useQuery({
    queryKey: ['admin-transactions', searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter.toUpperCase());
      const { data } = await api.get(`/admin/finance/transactions?${params.toString()}`);
      return data.data;
    }
  });

  const transactions: any[] = transactionsData?.transactions || [];

  // Fetch Financial Stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-finance-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/finance/stats');
      return data.data;
    }
  });

  // Fetch Pending Refunds
  const { data: pendingRefundsData, refetch: refetchRefunds } = useQuery({
    queryKey: ['admin-refunds-pending'],
    queryFn: async () => {
      const { data } = await api.get('/refunds/admin/pending');
      return data.data;
    }
  });

  const pendingRefunds: any[] = pendingRefundsData || [];

  const financialStats = {
    totalRevenue: statsData?.totalRevenue || 0,
    monthlyRevenue: 0, // Placeholder
    revenueGrowth: 12.5, // Mock
    platformCommission: statsData?.totalCommission || 0,
    pendingPayouts: payouts.filter((p: any) => p.status === 'PENDING').reduce((acc: number, p: any) => acc + parseFloat(p.amountInr), 0),
    refundedAmount: statsData?.refundedAmount || 0,
    pendingRefundsCount: pendingRefunds.length,
    pendingRefundsAmount: pendingRefunds.reduce((acc: number, r: any) => acc + parseFloat(r.amount_inr || 0), 0)
  };

  // --- Process Data for Charts ---
  const chartData = useMemo(() => {
    // Group transactions by date
    const grouped = transactions.reduce((acc: any, curr: any) => {
      const dateKey = new Date(curr.date).toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          displayDate: new Date(curr.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          revenue: 0,
          commission: 0,
          payouts: 0
        };
      }
      if (curr.status === 'completed') {
        acc[dateKey].revenue += curr.amount;
        acc[dateKey].commission += curr.commission;
      }
      return acc;
    }, {});

    // Convert to array and sort
    let data = Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) as any[];

    // If empty or sparse, fill with mock trend if needed, but for "God Protocol" we stick to real data or handle empty state visually.
    // However, to make the Sparklines work nicely with 0 data, we need at least a fallback.
    if (data.length < 2) {
      // Only if NO data, we refrain from showing broken charts.
      // But assuming the user has seed data.
    }
    return data;
  }, [transactions]);


  const handleApprovePayout = async (payoutId: string) => {
    try {
      await api.put(`/admin/payouts/${payoutId}/process`, {
        transactionReference: `REF-${Date.now()}`
      });
      toast.success('Payout processed successfully');
      refetchPayouts();
    } catch (error) {
      toast.error('Failed to process payout');
    }
  };

  // Refund mutations
  const approveRefundMutation = useMutation({
    mutationFn: async ({ refundId, adminNotes }: { refundId: string; adminNotes?: string }) => {
      const { data } = await api.post(`/refunds/admin/${refundId}/approve`, { adminNotes });
      return data;
    },
    onSuccess: () => {
      toast.success('Refund approved and processed');
      refetchRefunds();
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-stats'] });
      setSelectedRefund(null);
      setRefundAction(null);
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve refund');
    }
  });

  const rejectRefundMutation = useMutation({
    mutationFn: async ({ refundId, adminNotes }: { refundId: string; adminNotes?: string }) => {
      const { data } = await api.post(`/refunds/admin/${refundId}/reject`, { adminNotes });
      return data;
    },
    onSuccess: () => {
      toast.success('Refund rejected');
      refetchRefunds();
      setSelectedRefund(null);
      setRefundAction(null);
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject refund');
    }
  });

  const handleRefundAction = (refund: any, action: 'approve' | 'reject') => {
    setSelectedRefund(refund);
    setRefundAction(action);
  };

  const confirmRefundAction = () => {
    if (!selectedRefund || !refundAction) return;

    if (refundAction === 'approve') {
      approveRefundMutation.mutate({ refundId: selectedRefund.id, adminNotes });
    } else {
      rejectRefundMutation.mutate({ refundId: selectedRefund.id, adminNotes });
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" /> Financial Overview
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Real-time revenue analytics, cashflow monitoring, and payout adjudication.
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
        <StatCard
          title="Total Revenue"
          value={`₹${(financialStats.totalRevenue / 100000).toFixed(2)}L`}
          trend={12.5}
          subtext="vs last month"
          icon={IndianRupee}
          color="text-emerald-500"
          chartData={chartData}
          dataKey="revenue"
        />
        <StatCard
          title="Platform Profit"
          value={`₹${(financialStats.platformCommission / 1000).toFixed(1)}K`}
          trend={8.2}
          subtext="Net Commission"
          icon={Wallet}
          color="text-blue-500"
          chartData={chartData}
          dataKey="commission"
        />
        <StatCard
          title="Pending Payouts"
          value={`₹${(financialStats.pendingPayouts / 1000).toFixed(1)}K`}
          subtext="3 Sellers Waiting"
          icon={Clock}
          color="text-amber-500"
          chartData={chartData} // Using visual placeholder
          dataKey="revenue" // Re-using revenue curve for visual consistency
        />
        <StatCard
          title="Refund Volume"
          value={`₹${(financialStats.refundedAmount || 0)}`}
          trend={-2.4}
          subtext="Low Risk"
          icon={PieChart}
          color="text-rose-500"
          chartData={chartData}
          dataKey="revenue"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Analytics</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution / Quick Actions (Visual Filler/Functional) */}
        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Cashflow Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center relative">
            {/* Simple Donut Representation */}
            <div className="relative h-48 w-48 rounded-full border-[16px] border-emerald-500/20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[16px] border-emerald-500 border-t-transparent border-l-transparent rotate-45" />
              <div className="text-center">
                <span className="block text-3xl font-bold font-display">85%</span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Payouts</span>
              </div>
            </div>
          </CardContent>
          <div className="p-4 border-t border-border/50 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-600">85%</div>
              <div className="text-xs text-muted-foreground">Seller Payouts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">15%</div>
              <div className="text-xs text-muted-foreground">Platform Fee</div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none h-auto p-0 gap-6">
          <TabsTrigger value="transactions" className="px-0 pb-3 text-base rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground transition-all">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="payouts" className="px-0 pb-3 text-base rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground transition-all">
            Payout Request
            {payouts.filter((p: any) => p.status === 'PENDING').length > 0 && <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 hover:bg-amber-200 h-5 px-1.5">{payouts.filter((p: any) => p.status === 'PENDING').length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="refunds" className="px-0 pb-3 text-base rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground transition-all">
            Refunds
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4 border-b border-border/50 bg-muted/20">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>

            <CardContent className="p-0">
              <div className="overflow-x-auto relative w-full">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="w-[120px]">ID</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Parties</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((txn) => (
                        <TableRow key={txn.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-xs text-muted-foreground">#{txn.id.slice(-6)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <CheckCircle className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 max-w-[180px]">
                                <div className="font-medium truncate text-sm" title={txn.note}>{txn.note}</div>
                                <div className="text-xs text-muted-foreground">Note Sale</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div className="flex items-center gap-1"><span className="text-muted-foreground">From:</span> {txn.buyer}</div>
                              <div className="flex items-center gap-1"><span className="text-muted-foreground">To:</span> {txn.seller}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600">+₹{txn.amount}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">₹{txn.commission}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "bg-opacity-10 border-opacity-20",
                                txn.status === 'completed' ? "bg-emerald-500 text-emerald-700 border-emerald-500" :
                                  txn.status === 'pending' ? "bg-amber-500 text-amber-700 border-amber-500" : "bg-red-500 text-red-700 border-red-500"
                              )}
                            >
                              {txn.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {new Date(txn.date).toLocaleDateString()}
                            <div className="text-xs">{new Date(txn.date).toLocaleTimeString()}</div>
                          </TableCell>
                        </TableRow>
                      )))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
              <CardTitle className="text-lg">Pending Seller Payouts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {payouts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">All caught up! No pending payouts.</div>
                ) : payouts.map((payout: any) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{payout.seller?.fullName || 'Unknown Seller'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{payout.seller?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{parseFloat(payout.amountInr).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Accrued Commission: N/A</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {payout.status === 'PENDING' ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                            onClick={() => handleApprovePayout(payout.id)}
                          >
                            Approve Transfer
                          </Button>
                        ) : (
                          <Badge variant="secondary">Processed</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Refund Requests</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Review and process customer refund requests</p>
                </div>
                {pendingRefunds.length > 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 h-6 px-2">
                    {pendingRefunds.length} Pending
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pendingRefunds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mb-4 text-emerald-500/20" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">All Clear!</h3>
                  <p className="text-sm">No pending refund requests at this time.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {pendingRefunds.map((refund: any) => (
                    <motion.div
                      key={refund.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Left: User & Transaction Info */}
                        <div className="flex-1 space-y-4">
                          {/* User Info */}
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                              <User className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm">{refund.user_name}</p>
                                {refund.user_is_flagged && (
                                  <Badge variant="destructive" className="text-xs h-5 px-1.5">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Flagged
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono">{refund.user_email}</p>
                              {refund.user_total_refunds > 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                  {refund.user_total_refunds} previous refund{refund.user_total_refunds > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Note Info */}
                          <div className="flex items-start gap-3 pl-16">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate" title={refund.note_title}>
                                {refund.note_title}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                TXN: {refund.transaction_id?.slice(0, 12)}...
                              </p>
                            </div>
                          </div>

                          {/* Refund Reason */}
                          <div className="pl-16 bg-muted/20 p-3 rounded-lg border border-border/50">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                              <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">
                                {refund.reason?.replace(/_/g, ' ')}
                              </span>
                            </div>
                            {refund.reason_details && (
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {refund.reason_details}
                              </p>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pl-16">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(refund.created_at).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {refund.ip_address && (
                              <div className="font-mono bg-muted/30 px-2 py-0.5 rounded">
                                IP: {refund.ip_address}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex flex-col items-end gap-4 lg:min-w-[200px]">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-600">₹{parseFloat(refund.amount_inr).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Net: ₹{parseFloat(refund.net_refund_inr || refund.amount_inr).toFixed(2)}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 w-full"
                              onClick={() => handleRefundAction(refund, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Refund
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-700 w-full"
                              onClick={() => handleRefundAction(refund, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed/Rejected Refunds History */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/10 pb-4 border-b border-border/50">
              <CardTitle className="text-base">Processed Refunds</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {transactions.filter(t => t.status === 'refunded').map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                        <ArrowDownLeft className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{txn.note}</p>
                        <p className="text-xs text-muted-foreground">
                          {txn.buyer} • {new Date(txn.date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-red-600">-₹{txn.amount}</p>
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Refunded</Badge>
                    </div>
                  </div>
                ))}
                {transactions.filter(t => t.status === 'refunded').length === 0 && (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    No completed refunds yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Action Confirmation Dialog */}
      <Dialog open={!!selectedRefund && !!refundAction} onOpenChange={() => {
        setSelectedRefund(null);
        setRefundAction(null);
        setAdminNotes('');
      }}>
        <DialogContent className="sm:max-w-[500px] border-border bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {refundAction === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Approve Refund
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Reject Refund
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {refundAction === 'approve'
                ? 'This will process the refund immediately via Razorpay and credit the buyer.'
                : 'Provide a reason for rejecting this refund request. The user will be notified.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4 py-4">
              {/* Refund Summary */}
              <div className="bg-muted/20 p-4 rounded-lg border border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">User:</span>
                  <span className="font-medium">{selectedRefund.user_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Note:</span>
                  <span className="font-medium truncate max-w-[250px]" title={selectedRefund.note_title}>
                    {selectedRefund.note_title}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-red-600">₹{parseFloat(selectedRefund.amount_inr).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
                    {selectedRefund.reason?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes">
                  Admin Notes {refundAction === 'reject' && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="adminNotes"
                  placeholder={refundAction === 'approve'
                    ? 'Optional: Add internal notes about this approval...'
                    : 'Explain why this refund is being rejected...'}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRefund(null);
                setRefundAction(null);
                setAdminNotes('');
              }}
              disabled={approveRefundMutation.isPending || rejectRefundMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRefundAction}
              disabled={(refundAction === 'reject' && !adminNotes.trim()) || approveRefundMutation.isPending || rejectRefundMutation.isPending}
              className={refundAction === 'approve'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {(approveRefundMutation.isPending || rejectRefundMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {refundAction === 'approve' ? 'Approve & Process Refund' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
