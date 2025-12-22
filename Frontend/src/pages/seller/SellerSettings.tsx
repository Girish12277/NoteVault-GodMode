import { useState, useRef, useEffect } from 'react';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Mail,
  Phone,
  Save,
  Eye,
  EyeOff,
  Radio,
  Wifi,
  Zap,
  Lock,
  Smartphone,
  AlertTriangle,
  Fingerprint,
  ChevronRight,
  Activity,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SellerLayout from '@/components/seller/SellerLayout';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- STYLES & ANIMATIONS ---
const HolographicEffect = () => (
  <style>{`
     .hologram-gradient {
       background: linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.05) 100%);
     }
     .control-deck-tabs .data-[state=active]:after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: #10b981;
        box-shadow: 0 0 10px #10b981;
     }
     .scan-line {
        position: absolute;
        width: 100%;
        height: 2px;
        background: rgba(16, 185, 129, 0.3);
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        animation: scan 3s linear infinite;
     }
     @keyframes scan {
        0% { top: 0%; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
     }
   `}</style>
);

const NavTile = ({ active, icon: Icon, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-xl transition-all duration-300 w-full text-left overflow-hidden group border",
      active
        ? "bg-primary/5 border-primary/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
        : "bg-white/40 border-transparent hover:border-zinc-200 hover:bg-white/60"
    )}
  >
    <div className={cn("p-1.5 sm:p-2 rounded-lg transition-colors border", active ? "bg-primary/10 border-primary/20 text-primary" : "bg-zinc-50 border-zinc-100 text-zinc-500 group-hover:text-zinc-900 group-hover:border-zinc-200")}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
    <span className={cn("font-medium text-xs sm:text-base tracking-wide transition-colors", active ? "text-primary" : "text-zinc-500 group-hover:text-zinc-900")}>
      {label}
    </span>
    {active && (
      <motion.div
        layoutId="active-glow"
        className="absolute inset-0 bg-primary/5 rounded-xl z-[-1]"
      />
    )}
    <ChevronRight className={cn("ml-auto w-3 h-3 sm:w-4 sm:h-4 transition-transform", active ? "text-primary translate-x-1" : "text-zinc-400 opacity-0 group-hover:opacity-100")} />
  </button>
);

const SignalTile = ({ label, description, checked, onChange, icon: Icon, importance }: any) => (
  <div
    onClick={() => onChange(!checked)}
    className={cn(
      "cursor-pointer group relative overflow-hidden rounded-lg sm:rounded-xl border p-3 sm:p-5 transition-all duration-300 hover:shadow-lg",
      checked
        ? "bg-primary/5 border-primary/50 shadow-[0_4px_15px_rgba(16,185,129,0.1)]"
        : "bg-white/60 border-zinc-100 opacity-70 hover:opacity-100 hover:border-zinc-200"
    )}
  >
    <div className="absolute right-2 sm:right-3 top-2 sm:top-3">
      <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-500", checked ? "bg-primary shadow-[0_0_8px_#10b981]" : "bg-zinc-200")} />
    </div>

    <div className="mb-2 sm:mb-4">
      <div className={cn("w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors mb-2 sm:mb-4 border", checked ? "bg-primary/10 border-primary/20 text-primary" : "bg-zinc-50 border-zinc-100 text-zinc-400")}>
        <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
      </div>
      <h3 className={cn("font-bold text-[10px] sm:text-sm tracking-wide mb-0.5 sm:mb-1 transition-colors", checked ? "text-zinc-900" : "text-zinc-500")}>{label}</h3>
      <p className="text-[9px] sm:text-xs text-zinc-500 leading-snug sm:leading-relaxed pr-3 sm:pr-4">{description}</p>
    </div>

    {/* Tech decoration */}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
  </div>
);

export default function SellerSettings() {
  const [activeTab, setActiveTab] = useState('identity');
  const [profile, setProfile] = useState({
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+91 98765 43210',
    bio: 'B.Tech CSE student at PRSU, passionate about sharing knowledge.',
    university: 'Pt. Ravishankar Shukla University',
    degree: 'B.Tech',
    specialization: 'Computer Science',
  });

  const [notifications, setNotifications] = useState({
    newSale: true,
    newReview: true,
    paymentCleared: true,
    withdrawalComplete: true,
    complaint: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-detect changes to show "Save" HUD
  useEffect(() => {
    // In a real app, compare with initial state. Here we toggle simple dirty state on interaction for demo.
  }, [profile, notifications]);

  const handleSave = () => {
    toast.success('Configuration Protocol Updated', {
      description: 'System parameters strictly synced.',
      classNames: {
        toast: 'bg-white border-zinc-200 text-zinc-900 shadow-xl',
      }
    });
    setIsDirty(false);
  };

  const handleChange = (setter: any, val: any) => {
    setter(val);
    setIsDirty(true);
  }

  return (
    <SellerLayout>
      <HolographicEffect />
      <div className="min-h-screen pb-20 relative">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500">
              Control Deck
            </h1>
            <p className="text-zinc-500 mt-1 font-mono text-[10px] sm:text-sm tracking-wider">
              SYSTEM CONFIGURATION_V2.1
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">SYSTEM ONLINE</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">

          {/* NAVIGATION RAIL */}
          <div className="space-y-2">
            <NavTile
              active={activeTab === 'identity'}
              icon={Fingerprint}
              label="Identity Core"
              onClick={() => setActiveTab('identity')}
            />
            <NavTile
              active={activeTab === 'signals'}
              icon={Radio}
              label="Signal Matrix"
              onClick={() => setActiveTab('signals')}
            />
            <NavTile
              active={activeTab === 'security'}
              icon={Shield}
              label="Shield Protocol"
              onClick={() => setActiveTab('security')}
            />
            <NavTile
              active={activeTab === 'danger'}
              icon={AlertTriangle}
              label="Danger Zone"
              onClick={() => setActiveTab('danger')}
            />
          </div>

          {/* CONTENT AREA */}
          <div className="relative min-h-[500px]">

            {/* IDENTITY MODULE */}
            {activeTab === 'identity' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid xl:grid-cols-2 gap-6">
                {/* INPUTS */}
                <Card className="border-zinc-200 bg-white/60 backdrop-blur-xl shadow-sm">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-zinc-900 text-sm sm:text-base">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Profile Parameters
                    </CardTitle>
                    <CardDescription className="text-zinc-500 text-[10px] sm:text-sm">Public facing vector data.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                    <div className="grid gap-3 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-[10px] sm:text-xs uppercase text-zinc-500">Full Name</Label>
                        <Input className="bg-white border-zinc-200 focus:border-primary/50 text-zinc-900 placeholder:text-zinc-300 h-9 sm:h-10 text-sm" value={profile.name} onChange={(e) => handleChange(setProfile, { ...profile, name: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-[10px] sm:text-xs uppercase text-zinc-500">Email Link</Label>
                          <Input className="bg-white border-zinc-200 text-zinc-900 h-9 sm:h-10 text-sm" value={profile.email} onChange={(e) => handleChange(setProfile, { ...profile, email: e.target.value })} />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-[10px] sm:text-xs uppercase text-zinc-500">Comms Line</Label>
                          <Input className="bg-white border-zinc-200 text-zinc-900 h-9 sm:h-10 text-sm" value={profile.phone} onChange={(e) => handleChange(setProfile, { ...profile, phone: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-[10px] sm:text-xs uppercase text-zinc-500">University Node</Label>
                        <Input className="bg-white border-zinc-200 text-zinc-900 h-9 sm:h-10 text-sm" value={profile.university} onChange={(e) => handleChange(setProfile, { ...profile, university: e.target.value })} />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-[10px] sm:text-xs uppercase text-zinc-500">Bio / Manifest</Label>
                        <Textarea className="bg-white border-zinc-200 min-h-[80px] sm:min-h-[100px] resize-none text-zinc-900 text-sm" value={profile.bio} onChange={(e) => handleChange(setProfile, { ...profile, bio: e.target.value })} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* HOLOGRAPHIC ID PREVIEW (ADAPTED FOR LIGHT MODE) */}
                <div className="relative hidden xl:block">
                  <div className="sticky top-6">
                    <Label className="text-xs uppercase text-zinc-500 mb-4 block text-center">Live Identity Projection</Label>
                    <div className="relative w-full aspect-[1.58] rounded-2xl overflow-hidden bg-white border border-zinc-200 shadow-2xl shadow-zinc-200 group cursor-default select-none transition-transform hover:scale-[1.02] duration-500">
                      {/* Holographic BG */}
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-50" />
                      <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-multiply" />
                      <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(16,185,129,0.1)_360deg)] opacity-50 animate-[spin_10s_linear_infinite]" />

                      <div className="relative p-8 h-full flex flex-col justify-between z-10">
                        <div className="flex justify-between items-start">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                            <span className="text-2xl font-bold text-white">{profile.name.charAt(0)}</span>
                          </div>
                          <Activity className="w-8 h-8 text-black/10" />
                        </div>

                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold text-zinc-900 tracking-wide">{profile.name}</h2>
                          <p className="text-emerald-600 font-mono text-sm font-medium">{profile.specialization} // {profile.degree}</p>
                          <p className="text-zinc-500 text-xs max-w-[80%] mt-2 line-clamp-2 leading-relaxed">{profile.bio}</p>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 border-t border-zinc-100 pt-4 mt-4 uppercase">
                          <span>ID: 884-X99</span>
                          <span>•</span>
                          <span>ACCESS LEVEL: SELLER</span>
                          <div className="ml-auto flex gap-1">
                            <div className="w-1 h-3 bg-emerald-500" />
                            <div className="w-1 h-3 bg-emerald-500/50" />
                            <div className="w-1 h-3 bg-emerald-500/20" />
                          </div>
                        </div>
                      </div>

                      {/* Scanline Effect */}
                      <div className="scan-line pointer-events-none opacity-30" />
                      <div className="absolute inset-0 border-2 border-primary/10 rounded-2xl pointer-events-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SIGNAL MATRIX */}
            {activeTab === 'signals' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">

                <div>
                  <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-zinc-800">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" /> Critical Transmissions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <SignalTile
                      label="New Sale Alert"
                      description="Instant notification when assets are purchased."
                      icon={CreditCard}
                      checked={notifications.newSale}
                      onChange={(v: boolean) => handleChange(setNotifications, { ...notifications, newSale: v })}
                    />
                    <SignalTile
                      label="Fund Clearence"
                      description="Alerts when pending balance becomes available."
                      icon={Award}
                      checked={notifications.paymentCleared}
                      onChange={(v: boolean) => handleChange(setNotifications, { ...notifications, paymentCleared: v })}
                    />
                    <SignalTile
                      label="Security Breach"
                      description="Login attempts from unrecognized devices."
                      icon={Shield}
                      checked={true} // Hardcoded for safety
                      onChange={() => toast.error("System Override Denied", { description: "Security alerts cannot be disabled." })}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-zinc-800">
                    <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" /> Standard Feeds
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <SignalTile
                      label="Email Summary"
                      description="Daily digest of performance metrics."
                      icon={Mail}
                      checked={notifications.emailNotifications}
                      onChange={(v: boolean) => handleChange(setNotifications, { ...notifications, emailNotifications: v })}
                    />
                    <SignalTile
                      label="Review Pings"
                      description="Feedback posted by buyers on your assets."
                      icon={Bell}
                      checked={notifications.newReview}
                      onChange={(v: boolean) => handleChange(setNotifications, { ...notifications, newReview: v })}
                    />
                    <SignalTile
                      label="SMS Link"
                      description="Urgent notifications via cellular network."
                      icon={Smartphone}
                      checked={notifications.smsNotifications}
                      onChange={(v: boolean) => handleChange(setNotifications, { ...notifications, smsNotifications: v })}
                    />
                  </div>
                </div>

              </motion.div>
            )}

            {/* SHIELD PROTOCOL */}
            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-8">

                {/* SHIELD HEALTH */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-zinc-200 shadow-sm">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-zinc-100 sm:hidden" />
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-emerald-500 sm:hidden" strokeDasharray="125.6" strokeDashoffset="30" strokeLinecap="round" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-100 hidden sm:block" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-emerald-500 hidden sm:block" strokeDasharray="175.9" strokeDashoffset="40" strokeLinecap="round" />
                      </svg>
                      <Shield className="absolute w-4 h-4 sm:w-6 sm:h-6 text-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-lg font-bold text-zinc-900">Shield Integrity: 78%</h3>
                      <p className="text-xs sm:text-sm text-zinc-500">Encryption active. 2FA recommended.</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm shrink-0">Run Diagnostic</Button>
                </div>

                <Card className="border-zinc-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-zinc-900">Access Keys</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="text-zinc-700">Current Passkey</Label>
                      <div className="relative">
                        <Input id="current-password" type={showPassword ? "text" : "password"} className="bg-white border-zinc-200 pr-10 text-zinc-900" />
                        <Button size="icon" variant="ghost" className="absolute right-0 top-0 text-zinc-400 hover:text-zinc-900" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-700">New Passkey</Label>
                      <Input type="password" className="bg-white border-zinc-200 text-zinc-900" />
                      {/* Password strength bar */}
                      <div className="flex gap-1 h-1 mt-2">
                        <div className="flex-1 bg-red-500 rounded-full" />
                        <div className="flex-1 bg-amber-500 rounded-full" />
                        <div className="flex-1 bg-zinc-200 rounded-full" />
                        <div className="flex-1 bg-zinc-200 rounded-full" />
                      </div>
                    </div>
                    <Button className="w-full mt-2">Update Credentials</Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* DANGER ZONE */}
            {activeTab === 'danger' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center items-center min-h-[400px] py-8">
                <div className="w-full max-w-lg p-1 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 animate-pulse">
                  <div className="bg-white/90 backdrop-blur-xl rounded-xl p-6 sm:p-8 border border-red-200/50 text-center space-y-4 sm:space-y-6 shadow-xl">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-50 flex items-center justify-center mb-3 sm:mb-4 border border-red-100">
                      <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                    </div>

                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-red-900">Red Alert Protocol</h2>
                      <p className="text-red-700/80 mt-2 text-xs sm:text-sm">Initiating this sequence will result in permanent data loss. This action cannot be overridden.</p>
                    </div>

                    <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-100 flex flex-col items-center gap-3 sm:gap-4">
                      <p className="font-mono text-[10px] sm:text-xs text-red-600 font-bold">TYPE 'DELETE' TO UNLOCK ARMING MECHANISM</p>
                      <Input className="text-center font-mono uppercase bg-white border-red-200 text-red-600 focus:border-red-500 w-28 sm:w-32 tracking-[0.2em] placeholder:text-red-200 h-9 sm:h-10 text-sm" placeholder="______" />
                    </div>

                    <Button variant="destructive" className="w-full font-bold tracking-widest bg-red-600 hover:bg-red-700 text-white h-10 sm:h-11 text-sm" disabled>
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" /> ARMED
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* UNSAVED CHANGES HUD */}
        <AnimatePresence>
          {isDirty && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-4 rounded-2xl bg-white/90 backdrop-blur-2xl border border-primary/20 shadow-2xl shadow-primary/10 pl-6 pr-4"
            >
              <div className="flex flex-col">
                <span className="font-bold text-zinc-900">Unsaved Configuration</span>
                <span className="text-xs text-zinc-500">Parameters modified locally.</span>
              </div>
              <div className="h-8 w-[1px] bg-zinc-200 mx-2" />
              <Button variant="ghost" onClick={() => setIsDirty(false)} className="text-zinc-500 hover:text-zinc-900">Revert</Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-emerald-600 text-black font-bold">
                <Save className="w-4 h-4 mr-2" /> Sync Protocol
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </SellerLayout>
  );
}
