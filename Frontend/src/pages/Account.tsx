import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Package,
  Wallet,
  Gift,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Download,
  Star,
  Clock,
  IndianRupee,
  Copy,
  Share2,
  Edit,
  Loader2,
  Sparkles,
  Shield,
  GraduationCap
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Mock data
const mockReferrals = [
  { name: 'Amit S.', status: 'purchased', date: new Date('2024-03-10') },
  { name: 'Priya P.', status: 'signed_up', date: new Date('2024-03-08') },
  { name: 'Rahul K.', status: 'purchased', date: new Date('2024-03-01') },
];

function OrdersList() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/payments/transactions');
      // Group by Payment ID
      const grouped = (data.data.transactions || []).reduce((acc: any, txn: any) => {
        const paymentId = txn.payment_gateway_payment_id;
        if (!acc[paymentId]) {
          acc[paymentId] = {
            id: paymentId,
            orderId: txn.payment_gateway_order_id,
            date: new Date(txn.created_at),
            totalAmount: 0,
            items: [],
            status: txn.status
          };
        }
        acc[paymentId].items.push(txn.note || txn.notes); // Handle potential naming diff
        acc[paymentId].totalAmount += Number(txn.amount_inr);
        return acc;
      }, {});

      return Object.values(grouped).sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
    }
  });

  const downloadInvoice = async (paymentId: string) => {
    try {
      const response = await api.get(`/payments/invoice/${paymentId}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloading...');
    } catch (err: any) {
      console.error('Invoice download failed', err);
      toast.error(`Download failed: ${err.response?.data?.message || err.message}`);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border backdrop-blur-sm">
        <Package className="h-10 w-10 mx-auto opacity-20 mb-3" />
        <p>No orders yet</p>
        <Link to="/browse"><Button variant="link" className="mt-1">Start Exploring Notes</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order: any) => (
        <Card key={order.id} className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-md shadow-lg group hover:shadow-xl transition-all duration-300">
          <CardHeader className="p-4 bg-muted/30 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground font-mono">ORDER ID: {order.orderId}</span>
                <span className="text-xs font-medium">{order.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-foreground">₹{order.totalAmount}</span>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <Badge variant="default" className="text-xs h-6 px-2 bg-accent/15 text-accent hover:bg-accent/25 border-accent/20">
                    Paid
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {/* Items List */}
            <div className="space-y-2">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start justify-between text-xs group/item">
                  <div className="flex gap-2">
                    <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-xs font-medium text-primary">
                      {idx + 1}
                    </div>
                    <span className="group-hover/item:text-primary transition-colors cursor-pointer line-clamp-1 font-medium">
                      <Link to={`/notes/${item.id}`}>{item.title}</Link>
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs whitespace-nowrap ml-2 bg-muted/30 px-2 py-0.5 rounded">
                    Full Access
                  </span>
                </div>
              ))}
            </div>

            <div className="my-3 border-t border-border/20" />

            {/* Actions - Single Receipt Download */}
            <div className="flex justify-end">
              <Button
                size="sm"
                className="h-9 text-xs font-medium bg-primary/90 hover:bg-primary shadow-sm hover:scale-105 transition-transform"
                onClick={() => downloadInvoice(order.id)}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NotificationsListHeader() {
  const queryClient = useQueryClient();
  const { mutate: markAllRead } = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All marked as read');
    }
  });

  return (
    <Button variant="ghost" size="sm" onClick={() => markAllRead()} className="text-primary hover:text-primary/80 hover:bg-primary/5">
      Mark all as read
    </Button>
  );
}

function NotificationsList() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data.data.notifications || [];
    }
  });

  const { mutate: markRead } = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-12 text-center">
          <div className="h-16 w-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-white/10">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No new notifications</h3>
          <p className="text-xs text-muted-foreground mt-1">
            We'll notify you when there's something new
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((n: any) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${n.isRead ? 'bg-background/40 border-border/40 hover:bg-background/60' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'}`}
          onClick={() => !n.isRead && markRead(n.id)}
        >
          <div className={`mt-2 h-2.5 w-2.5 rounded-full shrink-0 ${n.isRead ? 'bg-muted' : 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]'}`} />
          <div className="flex-1">
            <h4 className={`font-medium text-xs ${!n.isRead && 'text-primary'}`}>{n.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function EditProfileDialog({ user }: { user: any }) {
  const { refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    degree: user?.degree || '',
    collegeName: user?.university || '',
    semester: user?.semester || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: any) => {
      // Ensure numeric semester if needed
      const payload = {
        ...data,
        semester: data.semester ? Number(data.semester) : null
      };
      const res = await api.put('/auth/profile', payload);
      return res.data;
    },
    onSuccess: async () => {
      toast.success('Profile updated successfully');
      setOpen(false);
      // Refresh auth state and user data
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-primary group transition-all">
          <Edit className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-white/10 bg-background/95 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your student identity here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="college">University / College</Label>
            <Input
              id="college"
              value={formData.collegeName}
              onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degree">Degree</Label>
              <Input
                id="degree"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                type="number"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="resize-none min-h-[100px]"
              placeholder="Tell us about yourself..."
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Account() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const referralCode = 'NOTES' + (user?.id?.slice(-6) || '123456').toUpperCase();
  const referralLink = `https://notesmarket.in/ref/${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const completedReferrals = mockReferrals.filter(r => r.status === 'purchased').length;
  const referralProgress = (completedReferrals / 3) * 100;

  const NavItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "relative flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-300 whitespace-nowrap",
        activeTab === id
          ? "text-primary-foreground bg-primary shadow-lg shadow-primary/25 scale-105"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
      {label}
    </button>
  );

  return (
    <Layout>
      {/* HOLOGRAPHIC IDENTITY HUB CONTAINER */}
      <div className="min-h-screen bg-gradient-to-tr from-background via-background to-primary/5 pb-20">

        {/* 1. HEADS-UP DISPLAY (HUD) HEADER */}
        <div className="relative overflow-hidden border-b border-white/5 bg-background/60 backdrop-blur-xl">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
          <div className="absolute top-0 right-0 p-20 bg-primary/20 blur-[100px] rounded-full opacity-20" />

          <div className="container relative py-4 sm:py-12">
            <div className="grid grid-cols-[auto_1fr] md:flex md:flex-row items-start gap-4 md:gap-8">
              {/* AVATAR RING */}
              <div className="relative group shrink-0">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-secondary/50 opacity-75 blur transition duration-500 group-hover:opacity-100 hidden sm:block" />
                <div className="relative h-16 w-16 sm:h-28 sm:w-28 rounded-full bg-background border-2 sm:border-4 border-background overflow-hidden flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 sm:h-12 sm:w-12 text-primary/40" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-background rounded-full p-1 shadow-lg border border-border">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary fill-current" />
                </div>
              </div>

              {/* IDENTITY INFO */}
              <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <h1 className="text-xl sm:text-4xl font-display font-bold tracking-tight text-foreground truncate">{user?.name || 'Student Explorer'}</h1>
                  <Badge variant="outline" className="w-fit border-primary/20 bg-primary/5 text-primary text-[10px] sm:text-xs px-1.5 py-0">
                    {user?.role === 'seller' ? 'Seller Pro' : 'Student'}
                  </Badge>
                </div>

                <p className="text-muted-foreground text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2 truncate">
                  <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{user?.university || 'University of Excellence'}</span>
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs text-muted-foreground/80">
                  <span className="truncate max-w-[120px]">{user?.degree || 'Degree --'}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-border" />
                  <span>Sem {user?.semester || '-'}</span>
                  <span className="hidden sm:inline-block h-0.5 w-0.5 rounded-full bg-border" />
                  <span className="hidden sm:inline-block">{user?.email}</span>
                </div>
              </div>

              {/* LIVE COUNTERS (HUD STATS) */}
              <div className="col-span-2 w-full md:w-auto mt-2 md:mt-0">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardContent className="p-2 sm:p-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2">
                      <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Wallet</p>
                      <p className="text-base sm:text-2xl font-bold font-mono text-primary">₹0</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardContent className="p-2 sm:p-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2">
                      <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Credits</p>
                      <p className="text-base sm:text-2xl font-bold font-mono">0</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. NAVIGATION PILLS */}
        <div className="sticky top-[64px] z-30 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
          <div className="container py-2 sm:py-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              <NavItem id="profile" icon={User} label="Profile" />
              <NavItem id="orders" icon={Package} label="My Orders" />
              <Link to="/library" className="relative flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all whitespace-nowrap">
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                Library
              </Link>
              <NavItem id="wallet" icon={Wallet} label="Wallet" />
              <NavItem id="referrals" icon={Gift} label="Referrals" />
              <NavItem id="notifications" icon={Bell} label="Notifications" />
              <NavItem id="settings" icon={Settings} label="Settings" />
            </div>
          </div>
        </div>

        {/* 3. CONTENT AREA (BENTO GRID & LIQUID TABS) */}
        <div className="container py-3 sm:py-8">
          <AnimatePresence mode="wait">
            {/* PROFILE TAB (BENTO GRID) */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
              >
                {/* Identity Card */}
                <Card className="md:col-span-2 border-white/10 bg-white/5 shadow-xl backdrop-blur-3xl">
                  <CardHeader className="pb-2 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-6 p-3 sm:p-6">
                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-6">
                      <div className="space-y-0.5 sm:space-y-1">
                        <Label className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider">Full Name</Label>
                        <p className="font-medium text-sm sm:text-lg truncate">{user?.name}</p>
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        <Label className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider">Email</Label>
                        <p className="font-medium text-sm sm:text-lg truncate">{user?.email}</p>
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        <Label className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider">College</Label>
                        <p className="font-medium text-xs sm:text-base truncate">{user?.university || 'Not Set'}</p>
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        <Label className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider">Specs</Label>
                        <p className="font-medium text-xs sm:text-base truncate">{user?.degree} • {user?.specialization}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 bg-muted/20 p-3 sm:p-4 rounded-xl border border-white/5">
                      <Label className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider">Bio</Label>
                      <p className="text-[10px] sm:text-xs leading-relaxed text-muted-foreground/80 line-clamp-3">{user?.bio || 'No bio yet. Tell the world who you are!'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions Bento */}
                <div className="space-y-4 sm:space-y-6">
                  <Card className="border-white/10 bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg">
                    <CardContent className="p-3 sm:p-6">
                      <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2">Completion Status</h3>
                      <div className="flex items-end justify-between mb-1 sm:mb-2">
                        <span className="text-xl sm:text-3xl font-bold text-primary">85%</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Almost Pro!</span>
                      </div>
                      <Progress value={85} className="h-1.5 sm:h-2 mb-3 sm:mb-4" />
                      <EditProfileDialog user={user} />
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-white/5 shadow-lg">
                    <CardContent className="p-3 sm:p-6">
                      <h3 className="font-semibold text-sm sm:text-lg mb-2 sm:mb-4">Quick Preferences</h3>
                      <div className="space-y-2 sm:space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Language</span>
                          <Badge variant="secondary" className="text-[10px] sm:text-xs h-5 px-1.5">{user?.preferredLanguage === 'hi' ? 'Hindi' : 'English'}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Location</span>
                          <span className="text-[10px] sm:text-xs font-medium truncate max-w-[100px]">{typeof user?.location === 'string' ? user.location : 'Indore, MP'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold font-display">Order History</h2>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Export
                  </Button>
                </div>
                <OrdersList />
              </motion.div>
            )}

            {/* WALLET TAB */}
            {activeTab === 'wallet' && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 gap-4 sm:gap-6"
              >
                <Card className="bg-gradient-primary text-primary-foreground border-none overflow-hidden relative shadow-lg">
                  <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6" />
                  <CardContent className="p-5 sm:p-8 relative z-10">
                    <p className="text-[10px] sm:text-xs font-medium opacity-90 mb-1">Total Balance</p>
                    <h2 className="text-2xl sm:text-4xl font-bold mb-4">₹0.00</h2>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="h-8 text-xs sm:text-sm text-primary bg-white shadow-lg">Add Funds</Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs sm:text-sm text-primary-foreground border-white/20 hover:bg-white/10">Withdraw</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-secondary text-secondary-foreground border-none relative overflow-hidden shadow-lg">
                  <div className="absolute bottom-0 left-0 p-16 bg-white/5 rounded-full blur-3xl -ml-10 -mb-10" />
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Gift className="h-4 w-4 sm:h-5 sm:w-5" /> Referral Link</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 p-5 pt-0">
                    <p className="text-[10px] sm:text-xs opacity-80 mb-3 sm:mb-4">Share this link to earn free notes worth ₹500.</p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-black/20 rounded-lg px-3 py-2 font-mono text-[10px] sm:text-xs truncate border border-white/10">
                        {referralLink}
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10" onClick={copyReferralLink} aria-label="Copy referral link">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* REFERRALS TAB */}
            {activeTab === 'referrals' && (
              <motion.div
                key="referrals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto"
              >
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-base sm:text-lg">Your Referral Network</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="space-y-3 sm:space-y-4">
                      {mockReferrals.map((referral, index) => (
                        <div key={index} className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-muted/30 border border-white/5 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10">
                              <span className="font-bold text-xs sm:text-base text-primary">{referral.name[0]}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm sm:text-base">{referral.name}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{referral.date.toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge variant={referral.status === 'purchased' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5">
                            {referral.status === 'purchased' ? 'Purchased' : 'Signed Up'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto"
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold font-display">Notifications</h2>
                  <NotificationsListHeader />
                </div>
                <NotificationsList />
              </motion.div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto space-y-4 sm:space-y-6"
              >
                <Card>
                  <CardHeader className="pb-3 sm:pb-6"><CardTitle className="text-base sm:text-lg">Security</CardTitle></CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                    <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm sm:text-base">Password & Authentication</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Update password and security questions</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive/30 overflow-hidden">
                  <div className="absolute inset-0 bg-destructive/5 pointer-events-none" />
                  <CardHeader className="pb-3 sm:pb-6"><CardTitle className="text-destructive text-base sm:text-lg">Danger Zone</CardTitle></CardHeader>
                  <CardContent className="flex items-center justify-between relative z-10 p-3 sm:p-6 pt-0">
                    <div>
                      <p className="font-medium text-sm sm:text-base">Delete Account</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">This action cannot be undone.</p>
                    </div>
                    <Button variant="destructive" size="sm" className="text-xs sm:text-sm">Delete Account</Button>
                  </CardContent>
                </Card>

                <div className="flex justify-center mt-8 sm:mt-12">
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors text-xs font-medium px-6 py-3 rounded-full hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout from all devices
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
