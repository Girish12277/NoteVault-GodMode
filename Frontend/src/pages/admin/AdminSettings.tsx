import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  IndianRupee,
  Percent,
  Save,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Globe,
  Mail,
  AlertOctagon,
  Power,
  CreditCard,
  Building,
  CheckCircle2,
  Lock,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AdminLayout from './AdminLayout';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSettings() {
  const queryClient = useQueryClient();

  // Fetch settings from API
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await api.get('/admin/settings');
      return response.data.data;
    }
  });

  const [settings, setSettings] = useState(settingsData || {
    defaultCommission: 15,
    premiumCommission: 10,
    minPayoutAmount: 500,
    payoutProcessingDays: 7,
    maintenanceMode: false,
    requireEmailVerify: true,
    platformName: 'StudyVault',
    supportEmail: 'support@studyvault.com',
  });

  // Update settings when data loads
  if (settingsData && settings.defaultCommission === 15 && settingsData.defaultCommission !== 15) {
    setSettings(settingsData);
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put('/admin/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('System configuration updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    }
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)] flex-col gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p className="font-mono text-muted-foreground animate-pulse">Loading System Config...</p>
        </div>
      </AdminLayout>
    );
  }

  // Helper for Simulator
  const SIMULATION_AMOUNT = 1000;
  const sellerCut = SIMULATION_AMOUNT * ((100 - settings.defaultCommission) / 100);
  const platformCut = SIMULATION_AMOUNT * (settings.defaultCommission / 100);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" /> Platform Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Global system configuration and policy management.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="shadow-lg hover:shadow-xl transition-all min-w-[160px]">
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Applying Changes...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="commission" className="space-y-6">
        <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none h-auto p-0 gap-6">
          <TabsTrigger value="commission" className="px-0 pb-3 text-base rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground transition-all">
            <Percent className="h-4 w-4 mr-2" /> Financials & Commission
          </TabsTrigger>
          <TabsTrigger value="platform" className="px-0 pb-3 text-base rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-500 data-[state=active]:font-semibold text-muted-foreground transition-all">
            <Globe className="h-4 w-4 mr-2" /> Global Identity
          </TabsTrigger>
          <TabsTrigger value="security" className="px-0 pb-3 text-base rounded-none border-b-2 border-transparent data-[state=active]:border-destructive data-[state=active]:bg-transparent data-[state=active]:text-destructive data-[state=active]:font-semibold text-muted-foreground transition-all">
            <ShieldCheck className="h-4 w-4 mr-2" /> Security & Access
          </TabsTrigger>
        </TabsList>

        {/* Commission Settings */}
        <TabsContent value="commission" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column: Controls */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-emerald-500" /> Revenue Model
                </CardTitle>
                <CardDescription>Adjust the platform's take-rate and payouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-base font-semibold">Base Commission</Label>
                      <p className="text-xs text-muted-foreground">Standard rate for all sellers</p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3 py-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                      {settings.defaultCommission}%
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.defaultCommission]}
                    onValueChange={([value]) => setSettings({ ...settings, defaultCommission: value })}
                    max={40}
                    min={5}
                    step={1}
                    className="py-2"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label className="text-base font-semibold">Premium Commission</Label>
                      <p className="text-xs text-muted-foreground">Reduced rate for top-tier sellers</p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                      {settings.premiumCommission}%
                    </Badge>
                  </div>
                  <Slider
                    value={[settings.premiumCommission]}
                    onValueChange={([value]) => setSettings({ ...settings, premiumCommission: value })}
                    max={30}
                    min={0}
                    step={1}
                    className="py-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right Column: Simulator */}
            <Card className="bg-muted/30 border-dashed border-2 border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Live Impact Simulator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
                  <p className="text-center text-sm text-muted-foreground mb-4">Simulating a <span className="font-bold text-foreground">₹{SIMULATION_AMOUNT.toLocaleString()}</span> Transaction</p>

                  <div className="flex items-stretch h-32 w-full rounded-md overflow-hidden ring-1 ring-border">
                    <div style={{ width: `${100 - settings.defaultCommission}%` }} className="bg-emerald-500 flex flex-col items-center justify-center text-white p-2 transition-all duration-300 relative group">
                      <span className="font-bold text-2xl">₹{sellerCut.toFixed(0)}</span>
                      <span className="text-xs opacity-90 uppercase font-bold tracking-wider">Seller Earns</span>
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div style={{ width: `${settings.defaultCommission}%` }} className="bg-blue-600 flex flex-col items-center justify-center text-white p-2 transition-all duration-300 relative group">
                      <span className="font-bold text-lg">₹{platformCut.toFixed(0)}</span>
                      <span className="text-[10px] opacity-90 uppercase font-bold tracking-wider">Platform</span>
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between text-xs text-muted-foreground px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                      <span>Seller Share ({100 - settings.defaultCommission}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full" />
                      <span>Platform Fee ({settings.defaultCommission}%)</span>
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900">
                  <IndianRupee className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 dark:text-blue-400">Payout Rules</AlertTitle>
                  <AlertDescription className="text-blue-700/80 dark:text-blue-500/80 text-xs mt-1">
                    Sellers must earn at least ₹{settings.minPayoutAmount} to withdraw. Processing takes {settings.payoutProcessingDays} business days.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Platform Settings */}
        <TabsContent value="platform" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* General Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" /> General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    className="font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Contact</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      className="pl-10 font-mono text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Functional: Payment Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-amber-500" /> Payout Mechanics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Withdrawal</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={settings.minPayoutAmount}
                        onChange={(e) => setSettings({ ...settings, minPayoutAmount: parseInt(e.target.value) })}
                        className="pl-8 font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Processing Time</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={settings.payoutProcessingDays}
                        onChange={(e) => setSettings({ ...settings, payoutProcessingDays: parseInt(e.target.value) })}
                        className="pr-12 font-mono font-bold text-right"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Days</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded">
                  Note: Changing processing time affects new payout requests only.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Identity Preview */}
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-primary mb-1">Brand Preview</p>
                <p className="text-sm text-muted-foreground">This is how your brand appears on receipts and emails.</p>
              </div>
              <div className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border/50 shadow-sm">
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground">
                  {settings.platformName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm leading-none">{settings.platformName}</p>
                  <p className="text-[10px] text-muted-foreground">{settings.supportEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Access Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md dark:bg-emerald-900/30">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Mandatory Email Verification</Label>
                    <p className="text-sm text-muted-foreground max-w-md">
                      If enabled, new users cannot purchase or sell until they verify their email address via OTP.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.requireEmailVerify}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerify: checked })}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* DANGER ZONE */}
          <Card className="border-destructive/30 bg-destructive/5 overflow-hidden">
            <CardHeader className="border-b border-destructive/10 bg-destructive/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertOctagon className="h-5 w-5" /> Danger Zone
              </CardTitle>
              <CardDescription className="text-destructive/70">
                Operational controls with high impact. Proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white text-destructive rounded-md border border-destructive/20 shadow-sm">
                    <Power className="h-5 w-5" />
                  </div>
                  <div>
                    <Label className="text-base font-bold text-destructive">Maintenance Mode</Label>
                    <p className="text-sm text-destructive/80 max-w-md mt-1">
                      Suspend all user activity. The platform will be accessible only to Admins.
                    </p>
                    {settings.maintenanceMode && (
                      <Badge variant="destructive" className="mt-2 animate-pulse">
                        SYSTEM OFFERLINE
                      </Badge>
                    )}
                  </div>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                  className="data-[state=checked]:bg-destructive"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
