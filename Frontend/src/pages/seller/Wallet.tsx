import { useState, useRef, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Plus,
  History,
  TrendingUp,
  CreditCard,
  Target,
  ChevronRight,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from "@/components/ui/slider"
import SellerLayout from '@/components/seller/SellerLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- COMPONENTS ---

const BlackCard = ({ balance, pending, earnings }: { balance: number, pending: number, earnings: number }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;

    // Calculate rotation (limit to +/- 10 deg)
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => setRotation({ x: 0, y: 0 });

  return (
    <div
      className="perspective-1000 w-full aspect-[1.586/1] max-w-md mx-auto sm:mx-0 group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="w-full h-full rounded-2xl bg-gradient-to-br from-zinc-800 to-black text-white relative shadow-2xl transition-transform duration-100 ease-out p-6 sm:p-8 flex flex-col justify-between overflow-hidden border border-white/10"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

        {/* Top Row */}
        <div className="flex justify-between items-start z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-gradient-to-tr from-amber-200 to-amber-500 opacity-90 shadow-lg" />
            <span className="font-display font-bold tracking-widest text-sm sm:text-base opacity-90">STUDYVAULT</span>
          </div>
          <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
        </div>

        {/* Middle Row */}
        <div className="z-10 mt-4 sm:mt-0">
          <p className="text-xs text-white/60 font-mono mb-1 uppercase tracking-wider">Available Balance</p>
          <h2 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight">₹{balance.toLocaleString()}</h2>
        </div>

        {/* Bottom Row */}
        <div className="flex justify-between items-end z-10">
          <div>
            <p className="text-[10px] sm:text-xs text-white/50 font-mono uppercase">Pending Clearance</p>
            <p className="text-sm sm:text-base font-medium">₹{pending.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-white/50 font-mono uppercase">Total Earnings</p>
            <p className="text-sm sm:text-base font-medium text-emerald-400">₹{earnings.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MoneyStream = ({ transactions }: { transactions: any[] }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <History className="w-10 h-10 mx-auto mb-2 opacity-20" />
        <p>No transaction history yet.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-muted">
      {transactions.map((tx, idx) => (
        <div key={tx.id || idx} className="relative animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
          {/* Node */}
          <div className={cn(
            "absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 border-background shadow-sm flex items-center justify-center",
            tx.type === 'sale' ? "bg-emerald-500" : tx.type === 'withdrawal' ? "bg-primary" : "bg-destructive"
          )}>
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>

          {/* Content */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 bg-muted/20 p-3 rounded-xl border border-border/50 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", tx.type === 'sale' ? "bg-emerald-500/10 text-emerald-600" : tx.type === 'withdrawal' ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
                {tx.type === 'sale' ? <ArrowDownRight className="w-4 h-4" /> : tx.type === 'withdrawal' ? <ArrowUpRight className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {tx.type === 'sale' ? 'Asset Sold' : tx.type === 'withdrawal' ? 'Payout Processed' : 'Refund Issued'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tx.note || tx.bank || 'Transaction'} • {new Date(tx.date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 min-w-[100px]">
              <Badge variant="outline" className={cn("text-[10px] uppercase",
                tx.status === 'completed' ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" :
                  tx.status === 'pending' ? "border-amber-500/30 text-amber-600 bg-amber-500/5" : ""
              )}>
                {tx.status}
              </Badge>
              <span className={cn("font-mono font-bold", tx.type === 'sale' ? "text-emerald-600" : "text-foreground")}>
                {tx.type === 'sale' ? '+' : '-'}₹{tx.amount}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SlideToPay = ({ onUnlock, disabled }: { onUnlock: () => void, disabled: boolean }) => {
  const [value, setValue] = useState([0]);
  const [unlocked, setUnlocked] = useState(false);

  const handleValueChange = (val: number[]) => {
    setValue(val);
    if (val[0] === 100 && !unlocked) {
      setUnlocked(true);
      onUnlock();
      // Reset after delay if needed, but usually the dialog closes or logic handles it
      setTimeout(() => {
        setValue([0]);
        setUnlocked(false);
      }, 1000);
    }
  };

  return (
    <div className={cn("relative h-12 rounded-full bg-muted overflow-hidden select-none transition-all", disabled && "opacity-50 cursor-not-allowed")}>
      {/* Background Text */}
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-muted-foreground z-0">
        {unlocked ? "Processing..." : "Slide to Withdraw"}
      </div>

      {/* Progress Fill */}
      <div
        className="absolute inset-y-0 left-0 bg-primary/20 transition-all duration-75 z-0"
        style={{ width: `${value[0]}%` }}
      />

      {/* The Slider Primitive */}
      <Slider
        disabled={disabled}
        value={value}
        onValueChange={handleValueChange}
        max={100}
        step={1}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing opacity-0 sm:opacity-100" // Opacity hack to hide track but keep thumb logic if using default shadcn slider which has visible track. 
      // Better to use custom thumb:
      />

      {/* Custom Thumb Visual (Since shadcn slider thumb is hard to style perfectly inside here without modifying global CSS, we fake it using the value) */}
      <div
        className="absolute top-1 bottom-1 w-10 h-10 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground transition-all duration-75 z-20 pointer-events-none"
        style={{ left: `calc(${value[0]}% - ${value[0] * 0.4}px)` }} // simple offset calculation
      >
        {unlocked ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </div>
    </div>
  )
}


export default function Wallet() {
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('1'); // Default HDFC
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // MOCK DATA FOR BANK (Since explicit DB table might not be fully wired for 'bank_accounts' yet)
  const bankAccounts = [
    { id: '1', bank: 'HDFC Bank', accountNumber: '****1234', ifsc: 'HDFC0001234', primary: true },
  ];

  // 1. Safe Wallet Data
  const { data: rawWalletData, isLoading: isWalletLoading } = useQuery({
    queryKey: ['seller-wallet'],
    queryFn: async () => {
      const { data } = await api.get('/seller/wallet');
      return data.data;
    },
    initialData: { totalEarnings: 0, availableBalance: 0, pendingBalance: 0, totalWithdrawn: 0, minimumWithdrawal: 100 }
  });

  const walletData = {
    totalEarnings: rawWalletData?.totalEarnings ?? 0,
    availableBalance: rawWalletData?.availableBalance ?? 0,
    pendingBalance: rawWalletData?.pendingBalance ?? 0,
    totalWithdrawn: rawWalletData?.totalWithdrawn ?? 0,
    minimumWithdrawal: rawWalletData?.minimumWithdrawal ?? 100
  };

  // 2. Safe Payouts
  const { data: payouts } = useQuery({
    queryKey: ['seller-payouts'],
    queryFn: async () => (await api.get('/seller/payouts')).data.data
  });
  const safePayouts = Array.isArray(payouts) ? payouts : [];

  // 3. Safe Dashboard
  const { data: dashboardData } = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: async () => (await api.get('/seller/dashboard')).data.data
  });
  const safeTransactions = dashboardData?.recentTransactions && Array.isArray(dashboardData.recentTransactions) ? dashboardData.recentTransactions : [];

  // 4. Safe Merging
  const transactions = [
    ...safePayouts.map((p: any) => ({
      id: p.id,
      type: 'withdrawal',
      amount: parseFloat(p.amountInr || 0),
      date: p.createdAt,
      status: (p.status || '').toLowerCase(),
      bank: 'Bank Transfer'
    })),
    ...safeTransactions.map((t: any) => ({
      id: t.id,
      type: 'sale',
      amount: parseFloat(t.sellerEarningInr || 0),
      note: t.note?.title || 'Unknown Asset',
      date: t.createdAt,
      status: 'completed'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < walletData.minimumWithdrawal) {
      toast.error(`Min withdrawal: ₹${walletData.minimumWithdrawal}`);
      return;
    }
    if (amount > walletData.availableBalance) {
      toast.error('Insufficient funds');
      return;
    }

    try {
      const selectedAccount = bankAccounts.find(b => b.id === selectedBank);
      await api.post('/seller/payouts/request', { amount, bankDetails: selectedAccount });
      toast.success('Funds on the way! 🚀');
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      queryClient.invalidateQueries({ queryKey: ['seller-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['seller-payouts'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Payout failed');
    }
  };

  const unlockWithdraw = () => {
    // Trigger the confirmation dialog or direct withdraw
    // For safety, we open the dialog to confirm amount
    setIsWithdrawOpen(true);
  }

  // Calculate Progress Logic
  const nextMilestone = 5000;
  // Safety: Prevent divide by zero or NaN
  const earnings = walletData.totalEarnings || 0;
  const progressPercent = Math.min((earnings / nextMilestone) * 100, 100);
  const displayPercent = isNaN(progressPercent) ? 0 : Math.floor(progressPercent);

  if (isWalletLoading) {
    return <SellerLayout><div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin" /></div></SellerLayout>;
  }

  return (
    <SellerLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Financial Command</h1>
            <p className="text-muted-foreground">Capital Flow & Asset Management</p>
          </div>

          <div className="hidden sm:flex items-center gap-3 bg-muted/50 p-2 rounded-lg border border-border/50">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Next Milestone</p>
              <p className="text-xs font-semibold">Silver Tier (₹5k)</p>
            </div>
            <div className="relative w-10 h-10">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-muted" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                <path className="text-primary transition-all duration-1000" strokeDasharray={`${displayPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{displayPercent}%</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN (Card & Actions) */}
          <div className="lg:col-span-5 space-y-8">
            <BlackCard
              balance={walletData.availableBalance}
              pending={walletData.pendingBalance}
              earnings={walletData.totalEarnings}
            />

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Quick Withdraw
                  <Badge variant="outline" className="font-normal text-xs">Min ₹100</Badge>
                </CardTitle>
                <CardDescription>Transfer funds to your primary bank.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {walletData.availableBalance >= 100 ? (
                  <SlideToPay onUnlock={unlockWithdraw} disabled={false} />
                ) : (
                  <div className="bg-muted p-3 rounded-lg flex items-center gap-3 opacity-80">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Reach ₹100 to unlock withdrawals.</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Building2 className="w-3 h-3" />
                  <span>Primary: HDFC Bank (****1234)</span>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">Change</Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Tips */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary">Funds Protection</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Earnings are held for 24 hours post-sale for refund security. Once cleared, they appear in your Available Balance instantly.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Timeline) */}
          <div className="lg:col-span-7">
            <Tabs defaultValue="activity" className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="activity">Money Stream</TabsTrigger>
                  <TabsTrigger value="banks">Bank Accounts</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="activity" className="min-h-[400px]">
                <MoneyStream transactions={transactions} />
              </TabsContent>

              <TabsContent value="banks">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <h3>Bank Account Management</h3>
                      <p className="text-sm">Feature locked for security in this demo.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* HIDDEN DIALOG FOR WITHDRAWAL LOGIC */}
        <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payout</DialogTitle>
              <DialogDescription>Initiate transfer to HDFC Bank (****1234)</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Available to Payout</p>
                <p className="text-3xl font-display font-bold">₹{walletData.availableBalance.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <Label>Amount to Withdraw</Label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={walletData.availableBalance}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsWithdrawOpen(false)}>Cancel</Button>
              <Button onClick={handleWithdraw}>Transact Now</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </SellerLayout>
  );
}
