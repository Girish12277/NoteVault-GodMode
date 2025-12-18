import { useState, useEffect } from 'react';
import {
  Search,
  MoreHorizontal,
  User,
  Ban,
  Eye,
  Trash2,
  Download,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Filter,
  Copy,
  CreditCard,
  MapPin,
  Laptop,
  AlertOctagon,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AdminLayout from './AdminLayout';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Phase 29 New State
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewingUser, setViewingUser] = useState<any | null>(null);

  // Debounce logic
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    setSelectedUsers([]); // Clear selection on filter change
  }, [roleFilter, statusFilter]);

  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch Users
  const { data: userData, isLoading } = useQuery({
    queryKey: ['admin-users', page, limit, debouncedSearch, roleFilter, statusFilter],
    queryFn: async () => {
      const params: any = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const { data } = await api.get('/admin/users', { params });
      return data.data;
    },
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData
  });

  const users = userData?.users || [];
  const pagination = userData?.pagination || { total: 0, totalPages: 1 };
  const totalUsers = pagination.total;

  const displayUsers = users.map((u: any) => ({
    id: u.id,
    name: u.fullName || 'Unknown User',
    email: u.email,
    role: u.isAdmin ? 'admin' : u.isSeller ? 'seller' : 'buyer',
    university: u.university || u.collegeName || '-',
    joinDate: new Date(u.createdAt),
    purchases: u._count?.purchases || 0,
    uploads: u._count?.notesCreated || 0,
    wallet: u.walletBalance || 0,
    status: u.isActive ? 'active' : 'suspended',
    isVerified: u.isVerified,
    // Mocked Risk/Device data for "God-Level" Dossier (since API doesn't have it yet)
    riskScore: u.isActive ? 12 : 88,
    lastIp: '192.168.1.1',
    device: 'Chrome / Windows'
  }));

  // --- Mutations ---
  const banMutation = useMutation({
    mutationFn: async ({ id, isSuspended }: { id: string; isSuspended: boolean }) => {
      const endpoint = isSuspended ? `/admin/users/${id}/unban` : `/admin/users/${id}/ban`;
      return await api.put(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated');
    },
    onError: () => toast.error('Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Account deleted');
      setUserToDelete(null);
    },
    onError: () => toast.error('Failed to delete user'),
  });

  // --- Bulk Actions ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedUsers(displayUsers.map((u: any) => u.id));
    else setSelectedUsers([]);
  };

  const handleSelectUser = (id: string, checked: boolean) => {
    if (checked) setSelectedUsers(prev => [...prev, id]);
    else setSelectedUsers(prev => prev.filter(uid => uid !== id));
  };

  const handleBulkSuspend = async () => {
    toast.promise(
      Promise.all(selectedUsers.map(id => api.put(`/admin/users/${id}/ban`))),
      {
        loading: `Suspending ${selectedUsers.length} users...`,
        success: () => {
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          setSelectedUsers([]);
          return 'Bulk Action Complete';
        },
        error: 'Failed to suspend some users'
      }
    );
  };

  // --- Logic Helpers ---
  const handleBanUser = (userId: string, currentStatus: string) => {
    banMutation.mutate({ id: userId, isSuspended: currentStatus === 'suspended' });
  };

  // --- Dossier Logic ---
  const openDossier = (user: any) => {
    setViewingUser(user);
  };

  if (isLoading && !userData) {
    return (
      <AdminLayout>
        <div className="flex justify-center h-screen items-center flex-col gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-mono">Loading Population Data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header & Smart Segments */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Population Nexus</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Governance Grid • {totalUsers} Identities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Smart Segments & Search */}
        <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center justify-between">
          <Tabs defaultValue="all" value={roleFilter} onValueChange={setRoleFilter} className="w-full xl:w-auto">
            <TabsList className="bg-muted/50 p-1 h-11">
              <TabsTrigger value="all" className="h-9 px-4">All Citizens</TabsTrigger>
              <TabsTrigger value="buyer" className="h-9 px-4">Buyers</TabsTrigger>
              <TabsTrigger value="seller" className="h-9 px-4">Sellers</TabsTrigger>
              <TabsTrigger value="admin" className="h-9 px-4">Admins</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by Hash / Email / Name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background"
            />
          </div>
        </div>
      </div>

      {/* Governance Grid */}
      <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedUsers.length === displayUsers.length && displayUsers.length > 0}
                  onCheckedChange={(c) => handleSelectAll(c as boolean)}
                />
              </TableHead>
              <TableHead>Identity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Metrics</TableHead>
              <TableHead className="text-right">Command</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayUsers.length > 0 ? (
              displayUsers.map((user: any) => (
                <TableRow
                  key={user.id}
                  className={cn(
                    "group transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted",
                    selectedUsers.includes(user.id) && "bg-primary/5"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(c) => handleSelectUser(user.id, c as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => openDossier(user)}>
                      <div className={cn(
                        "h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110",
                        user.role === 'admin' ? "bg-red-500/10 text-red-600" :
                          user.role === 'seller' ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                      )}>
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5 truncate">
                          {user.name}
                          {user.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10 flex-shrink-0" />}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "h-6 px-2.5 text-[10px] uppercase font-bold tracking-wider",
                      user.status === 'active' ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" : "border-red-500/30 text-red-600 bg-red-500/5"
                    )}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-muted-foreground">{user.university}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.joinDate.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground" title="Purchases">
                        <CreditCard className="h-3.5 w-3.5" />{user.purchases}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground" title="Uploads">
                        <Download className="h-3.5 w-3.5" />{user.uploads}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openDossier(user)}><Eye className="h-4 w-4 mr-2" />Inspect Dossier</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleBanUser(user.id, user.status)} className="text-warning">
                          <Ban className="h-4 w-4 mr-2" />{user.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setUserToDelete(user.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />Expel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Search className="h-10 w-10 mb-4 opacity-20" />
                    <p>No identities found in this sector.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/20">
          <p className="text-xs text-muted-foreground font-mono">
            SECTOR: {page} / {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8"
            >
              <ChevronLeft className="h-3 w-3 mr-1" /> Prev
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="h-8"
            >
              Next <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Mass Command Dock */}
      <AnimatePresence>
        {selectedUsers.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-foreground/95 backdrop-blur text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-white/10"
          >
            <span className="font-bold text-sm bg-white/20 px-2 py-0.5 rounded text-white">{selectedUsers.length} Selected</span>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-8 hover:bg-white/10 hover:text-white text-white/90">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Verify
              </Button>
              <Button size="sm" variant="ghost" className="h-8 hover:bg-white/10 hover:text-white text-white/90">
                <Mail className="h-4 w-4 mr-2" /> Email
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkSuspend}
                className="h-8 rounded-full px-4"
              >
                <Ban className="h-4 w-4 mr-2" /> Suspend All
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Dossier Sheet */}
      <Sheet open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <SheetContent className="sm:max-w-md w-full border-l border-border/50 shadow-2xl">
          {viewingUser && (
            <>
              <SheetHeader className="pb-6 border-b border-border/50">
                <SheetTitle className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-display">{viewingUser.name}</div>
                    <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                      {viewingUser.id.slice(0, 12)}...
                      <Copy className="h-3 w-3 cursor-pointer hover:text-primary" onClick={() => {
                        navigator.clipboard.writeText(viewingUser.id);
                        toast.success('ID Copied');
                      }} />
                    </div>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  Joined {viewingUser.joinDate.toDateString()} • {viewingUser.university}
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Transactions</div>
                    <div className="text-2xl font-bold">{viewingUser.purchases}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Uploads</div>
                    <div className="text-2xl font-bold">{viewingUser.uploads}</div>
                  </div>
                </div>

                {/* Risk Assessment Module */}
                <div className="p-4 rounded-xl border border-border/50 bg-card">
                  <h4 className="flex items-center gap-2 font-bold text-sm mb-4">
                    <Shield className={cn("h-4 w-4", viewingUser.riskScore > 50 ? "text-red-500" : "text-emerald-500")} />
                    Risk Assessment
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Session Risk Score</span>
                      <Badge variant={viewingUser.riskScore > 50 ? "destructive" : "outline"} className="font-mono">
                        {viewingUser.riskScore}/100
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><MapPin className="h-3 w-3" /> Last Known IP</span>
                      <span className="font-mono text-xs">{viewingUser.lastIp}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2"><Laptop className="h-3 w-3" /> Device Fingerprint</span>
                      <span className="font-mono text-xs text-right max-w-[150px] truncate">{viewingUser.device}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Links */}
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start h-12" onClick={() => window.open(`mailto:${viewingUser.email}`)}>
                    <Mail className="h-4 w-4 mr-3 text-muted-foreground" /> Send Official Notice
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12 text-destructive border-red-500/20 hover:bg-red-500/5 hover:text-red-600" onClick={() => setUserToDelete(viewingUser.id)}>
                    <AlertOctagon className="h-4 w-4 mr-3" /> Terminate Identity
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expel Identity?</DialogTitle>
            <DialogDescription className="text-destructive">
              This action is irreversible. The user's wallet, notes, and purchase history will be permanently erased from the Nexus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => userToDelete && deleteMutation.mutate(userToDelete)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Expulsion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
