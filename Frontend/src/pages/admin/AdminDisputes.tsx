import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  User,
  Clock,
  CheckCircle,
  XCircle,
  IndianRupee,
  Loader2,
  Scale,
  Gavel,
  FileText,
  ShieldAlert,
  UserX,
  History,
  Hammer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import AdminLayout from './AdminLayout';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function AdminDisputes() {
  const queryClient = useQueryClient();
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolution, setResolution] = useState('');
  const [refund, setRefund] = useState(false);

  // Reject State
  const [disputeToReject, setDisputeToReject] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch disputes
  const { data: disputes, isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const response = await api.get('/admin/disputes');
      return response.data.data.disputes;
    }
  });

  // Helper to generate UUID for idempotency
  const generateIdempotencyKey = () => crypto.randomUUID();

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ id, resolution, refund, version }: any) => {
      const idempotencyKey = generateIdempotencyKey();
      const response = await api.put(`/admin/disputes/${id}/resolve`, {
        resolution,
        refund,
        currentVersion: version
      }, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      setSelectedDispute(null);
      setResolution('');
      setRefund(false);
      toast.success(data.message || 'Verdict Delivered: Case Resolved');
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error('Conflict: Docket updated by another judge. Refreshing...');
        queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
        setSelectedDispute(null);
      } else {
        toast.error(error.response?.data?.message || 'Failed to resolve dispute');
      }
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason, version }: any) => {
      const idempotencyKey = generateIdempotencyKey();
      const response = await api.put(`/admin/disputes/${id}/reject`, {
        reason,
        currentVersion: version
      }, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      setDisputeToReject(null);
      setRejectReason('');
      toast.success(data.message || 'Verdict Delivered: Case Dismissed');
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error('Conflict: Docket updated by another judge. Refreshing...');
        queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
        setDisputeToReject(null);
      } else {
        toast.error(error.response?.data?.message || 'Failed to reject dispute');
      }
    }
  });

  const handleResolve = () => {
    if (!selectedDispute || !resolution) {
      toast.error('Please provide a resolution statement');
      return;
    }
    resolveMutation.mutate({
      id: selectedDispute.id,
      resolution,
      refund,
      version: selectedDispute.version
    });
  };

  const handleReject = (dispute: any) => {
    setDisputeToReject(dispute);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (!disputeToReject || !rejectReason.trim()) {
      toast.error('Please provide a dismissal reason');
      return;
    }
    rejectMutation.mutate({
      id: disputeToReject.id,
      reason: rejectReason,
      version: disputeToReject.version
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)] flex-col gap-4">
          <Gavel className="h-10 w-10 animate-pulse text-primary/50" />
          <p className="font-mono text-muted-foreground">Loading Court Dockets...</p>
        </div>
      </AdminLayout>
    );
  }

  const pendingDisputes = disputes?.filter((d: any) => d.status === 'OPEN') || [];
  const rejectedDisputes = disputes?.filter((d: any) => d.status === 'REJECTED') || [];
  const resolvedDisputes = disputes?.filter((d: any) => d.status === 'RESOLVED') || [];

  const VerdictBadge = ({ status }: { status: string }) => {
    const styles: any = {
      OPEN: 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse',
      REJECTED: 'bg-muted text-muted-foreground border-muted-foreground/20',
      RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    const icon: any = {
      OPEN: <Scale className="h-3 w-3 mr-1" />,
      REJECTED: <Gavel className="h-3 w-3 mr-1" />,
      RESOLVED: <CheckCircle className="h-3 w-3 mr-1" />
    };
    return (
      <Badge variant="outline" className={cn("uppercase tracking-wider font-bold h-6", styles[status])}>
        {icon[status]} {status === 'OPEN' ? 'Active Docket' : status === 'REJECTED' ? 'Dismissed' : 'Settled'}
      </Badge>
    );
  };

  const CaseFile = ({ dispute }: { dispute: any }) => (
    <Card key={dispute.id} className="group relative overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
      {/* Status Strip */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full",
        dispute.status === 'OPEN' ? "bg-destructive" : dispute.status === 'RESOLVED' ? "bg-emerald-500" : "bg-muted-foreground"
      )} />

      <CardContent className="p-0">
        {/* Case Header */}
        <div className="p-3 md:p-4 bg-muted/20 border-b border-border/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <div className="font-mono text-[10px] md:text-xs text-muted-foreground bg-background px-1.5 md:px-2 py-0.5 md:py-1 rounded border border-border">
              CASE #{dispute.id.slice(0, 8).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground px-1 md:px-2 hidden sm:inline">•</span>
            <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-medium text-muted-foreground">
              <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <span className="hidden sm:inline">Filed </span>{new Date(dispute.createdAt).toLocaleDateString()}
            </div>
          </div>
          <VerdictBadge status={dispute.status} />
        </div>

        {/* The VS Layout */}
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/50 min-h-[140px] md:min-h-[160px]">

          {/* Plaintiff (Buyer) */}
          <div className="flex-1 p-4 md:p-6 bg-gradient-to-br from-red-50/10 to-transparent">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-border shadow-sm">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${dispute.buyer.name}&background=fecaca&color=7f1d1d`} />
                <AvatarFallback className="bg-red-100 text-red-700 text-xs">PL</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <p className="text-xs md:text-sm font-bold text-foreground">{dispute.buyer.name}</p>
                  <Badge variant="outline" className="text-[10px] md:text-xs h-3.5 md:h-4 px-1 border-red-200 text-red-700 bg-red-50">Plaintiff</Badge>
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground">Buyer</p>
              </div>
            </div>

            <div className="bg-background border border-red-100 rounded-lg p-2 md:p-3 relative">
              <div className="absolute -top-2 left-2 md:left-3 px-1 bg-background text-[10px] md:text-xs font-bold text-red-500 uppercase">Complaint</div>
              <p className="text-xs md:text-sm text-foreground/80 leading-relaxed italic">"{dispute.reason}"</p>
            </div>
          </div>

          {/* VS Badge (Desktop) */}
          <div className="hidden md:flex items-center justify-center w-0 relative z-10">
            <div className="absolute top-1/2 -translate-y-1/2 bg-background border border-border rounded-full h-7 w-7 md:h-8 md:w-8 flex items-center justify-center font-black text-[10px] md:text-xs text-muted-foreground shadow-sm">
              VS
            </div>
          </div>

          {/* Defendant (Seller) & Evidence */}
          <div className="flex-1 p-4 md:p-6 bg-gradient-to-bl from-blue-50/10 to-transparent">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 justify-end">
              <div className="text-right">
                <div className="flex items-center gap-1.5 md:gap-2 justify-end">
                  <Badge variant="outline" className="text-[10px] md:text-xs h-3.5 md:h-4 px-1 border-blue-200 text-blue-700 bg-blue-50">Defendant</Badge>
                  <p className="text-xs md:text-sm font-bold text-foreground">{dispute.seller.name}</p>
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground">Seller</p>
              </div>
              <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-border shadow-sm">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${dispute.seller.name}&background=bfdbfe&color=1e3a8a`} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">DF</AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between p-1.5 md:p-2 rounded bg-background border border-border/50">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                  <span className="text-[10px] md:text-xs font-medium truncate max-w-[80px] md:max-w-[120px]">{dispute.note?.title}</span>
                </div>
                <a href={`/notes/${dispute.note?.id}`} target="_blank" className="text-[10px] md:text-xs text-primary hover:underline font-medium">View</a>
              </div>

              <div className="flex items-center justify-between p-1.5 md:p-2 rounded bg-background border border-border/50">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <IndianRupee className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                  <span className="text-[10px] md:text-xs font-medium">Disputed Amount</span>
                </div>
                <span className="text-xs md:text-sm font-bold">₹{dispute.amount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verdict Action Bar */}
        <div className="p-3 md:p-4 bg-muted/10 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-0">
          <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1.5 md:gap-2">
            <span className="font-medium">Order ID:</span>
            <span className="font-mono">{dispute.orderId}</span>
          </div>

          {dispute.status === 'OPEN' ? (
            <div className="flex gap-2 md:gap-3">
              <Button
                size="sm"
                variant="outline"
                className="h-7 md:h-8 text-xs border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
                onClick={(e) => { e.stopPropagation(); handleReject(dispute); }}
              >
                <Hammer className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5" /> Dismiss
              </Button>
              <Button
                size="sm"
                className="h-7 md:h-8 text-xs bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
                onClick={(e) => { e.stopPropagation(); setSelectedDispute(dispute); }}
              >
                <Gavel className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5" /> Issue Verdict
              </Button>
            </div>
          ) : (
            <div className="text-[10px] md:text-xs flex items-center gap-1.5 md:gap-2">
              <span className="font-bold text-muted-foreground uppercase">Verdict:</span>
              <span className="italic text-foreground/80">"{dispute.resolution || dispute.reason}"</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Scale className="h-6 w-6 md:h-8 md:w-8 text-primary" /> High Court of Disputes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Adjudication system for buyer-seller conflict resolution.
          </p>
        </div>
      </div>

      {/* Dockets Summary */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3 mb-6 md:mb-8">
        <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white border border-destructive/20 flex items-center justify-center shadow-sm">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-3xl font-bold font-display text-destructive">{pendingDisputes.length}</p>
                <p className="text-sm font-medium text-destructive/80">Active Dockets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white border border-border/50 flex items-center justify-center shadow-sm">
                <UserX className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold font-display">{rejectedDisputes.length}</p>
                <p className="text-sm font-medium text-muted-foreground">Dismissed Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm dark:bg-emerald-950/10 dark:border-emerald-900/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white border border-emerald-100 flex items-center justify-center shadow-sm dark:bg-emerald-950 dark:border-emerald-900">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold font-display text-emerald-700 dark:text-emerald-400">{resolvedDisputes.length}</p>
                <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-500/80">Settled Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Files List */}
      <Tabs defaultValue="open" className="space-y-4 md:space-y-6">
        <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none h-auto p-0 gap-3 md:gap-6">
          <TabsTrigger value="open" className="px-0 pb-2 md:pb-3 text-sm md:text-base rounded-none border-b-2 border-transparent data-[state=active]:border-destructive data-[state=active]:bg-transparent data-[state=active]:text-destructive data-[state=active]:font-semibold text-muted-foreground transition-all">
            <span className="hidden sm:inline">Active Dockets</span>
            <span className="sm:hidden">Active</span>
            {pendingDisputes.length > 0 && <span className="ml-1.5 md:ml-2 bg-destructive text-white text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded-full">{pendingDisputes.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="px-0 pb-2 md:pb-3 text-sm md:text-base rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground transition-all">
            Dismissed
          </TabsTrigger>
          <TabsTrigger value="resolved" className="px-0 pb-2 md:pb-3 text-sm md:text-base rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 data-[state=active]:font-semibold text-muted-foreground transition-all">
            Settled
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {pendingDisputes.length > 0 ? (
            pendingDisputes.map((dispute: any) => <CaseFile key={dispute.id} dispute={dispute} />)
          ) : (
            <div className="py-20 text-center bg-muted/10 rounded-xl border border-dashed border-border">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="font-medium text-foreground">Court is adjourned.</p>
              <p className="text-sm text-muted-foreground">No active dockets pending review.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedDisputes.map((dispute: any) => <CaseFile key={dispute.id} dispute={dispute} />)}
          {rejectedDisputes.length === 0 && <p className="text-center py-8 text-muted-foreground">No dismissed cases.</p>}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedDisputes.map((dispute: any) => <CaseFile key={dispute.id} dispute={dispute} />)}
          {resolvedDisputes.length === 0 && <p className="text-center py-8 text-muted-foreground">No settled cases.</p>}
        </TabsContent>
      </Tabs>

      {/* Verdict Dialog (Resolve) */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-display">
              <Gavel className="h-5 w-5 text-primary" /> Deliver Verdict
            </DialogTitle>
            <DialogDescription>
              Issuing a final decision for Case #{selectedDispute?.id?.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <Label className="text-xs uppercase font-bold text-muted-foreground mb-3 block">Judicial Ruling</Label>
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Resolution Statement</span>
                  <Textarea
                    placeholder="Enter the official verdict statement and reasoning..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={3}
                    className="bg-background"
                  />
                </div>

                <div className="pt-2 border-t border-border/50">
                  <RadioGroup value={refund ? 'refund' : 'no-refund'} onValueChange={(v) => setRefund(v === 'refund')} className="flex gap-4">
                    <div className={cn("flex-1 p-3 rounded-lg border cursor-pointer transition-all", !refund ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-background border-border hover:bg-muted/50")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no-refund" id="no-refund" />
                        <Label htmlFor="no-refund" className="cursor-pointer font-bold">Rule for Defendant</Label>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6 mt-1">No refund issued. Seller keeps funds.</p>
                    </div>
                    <div className={cn("flex-1 p-3 rounded-lg border cursor-pointer transition-all", refund ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-background border-border hover:bg-muted/50")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="refund" id="refund" />
                        <Label htmlFor="refund" className="cursor-pointer font-bold">Rule for Plaintiff</Label>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6 mt-1">Full refund issued to buyer.</p>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedDispute(null)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={resolveMutation.isPending} className="bg-primary font-bold min-w-[140px]">
              {resolveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gavel className="h-4 w-4 mr-2" />}
              Execute Verdict
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dismissal Dialog (Reject) */}
      <Dialog open={!!disputeToReject} onOpenChange={() => setDisputeToReject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Hammer className="h-5 w-5" /> Dismiss Case
            </DialogTitle>
            <DialogDescription>
              Reject the validity of this dispute docket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Dismissal Reason</Label>
              <Textarea
                placeholder="Why is this dispute invalid?"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="mt-1.5 focus-visible:ring-destructive"
              />
            </div>
            <div className="p-3 bg-destructive/5 text-destructive text-sm rounded-md border border-destructive/10 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <p>This action will close the docket permanently. The buyer will not receive a refund.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeToReject(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              className="font-bold"
            >
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Confirm Dismissal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
