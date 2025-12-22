import { useState, useEffect } from 'react';
import {
    Bell, Send, Users, AlertCircle, CheckCircle, Loader2, RefreshCw,
    Smartphone, MessageSquare, Info, AlertTriangle, Megaphone, Radio
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Broadcast {
    id: string;
    type: string;
    title: string;
    message: string;
    status: string;
    target_count: number;
    sent_count: number;
    failed_count: number;
    created_at: string;
    completed_at?: string;
    admin?: {
        full_name: string;
        email: string;
    };
}

interface User {
    id: string;
    fullName: string;
    email: string;
}

const NOTIFICATION_TYPES = [
    { value: 'INFO', label: 'Information', color: 'bg-blue-500', icon: Info },
    { value: 'SUCCESS', label: 'Success', color: 'bg-green-500', icon: CheckCircle },
    { value: 'WARNING', label: 'Warning', color: 'bg-yellow-500', icon: AlertTriangle },
    { value: 'ANNOUNCEMENT', label: 'Announcement', color: 'bg-purple-500', icon: Megaphone },
];

const TEMPLATES = [
    { type: 'INFO', title: 'System Maintenance', message: 'We will be undergoing scheduled maintenance in 1 hour. Service may be intermittent.' },
    { type: 'ANNOUNCEMENT', title: 'New Features Live!', message: 'Explore the new "Knowledge Vault" library features now available in your dashboard.' },
    { type: 'WARNING', title: 'Policy Update', message: 'We have updated our terms of service. Please review the changes.' },
    { type: 'SUCCESS', title: 'Welcome!', message: 'Thanks for joining StudyVault. Start your learning journey today.' }
];

export default function AdminNotifications() {
    // Form state
    const [mode, setMode] = useState<'targeted' | 'broadcast'>('broadcast');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('INFO');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // History state
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [pollingBroadcastId, setPollingBroadcastId] = useState<string | null>(null);

    // Real-time clock for simulator
    const [currentTime, setCurrentTime] = useState(new Date());

    // Character counters
    const titleRemaining = 100 - title.length;
    const messageRemaining = 500 - message.length;

    // Validation
    const isValidForm =
        title.trim().length >= 3 &&
        title.length <= 100 &&
        message.trim().length >= 10 &&
        message.length <= 500 &&
        (mode === 'broadcast' || selectedUsers.length > 0);

    // Load users for selection
    useEffect(() => {
        if (mode === 'targeted') {
            const timer = setTimeout(async () => {
                setIsLoadingUsers(true);
                try {
                    const { data } = await api.get(`/admin/users?limit=1000&search=${encodeURIComponent(userSearch)}`);
                    if (data.success) {
                        setUsers(data.data.users || []);
                    }
                } catch (err) {
                    console.error('Failed to search users:', err);
                } finally {
                    setIsLoadingUsers(false);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [mode, userSearch]);

    // Load broadcast history
    const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const { data } = await api.get('/admin/notifications?limit=20');
            if (data.success) {
                setBroadcasts(data.data.broadcasts || []);
            }
        } catch (err) {
            console.error('Failed to load history:', err);
            toast.error('Failed to load notification history');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Poll for broadcast progress
    useEffect(() => {
        if (!pollingBroadcastId) return;

        const interval = setInterval(async () => {
            try {
                const { data } = await api.get(`/admin/notifications/broadcasts/${pollingBroadcastId}`);

                if (data.success) {
                    setBroadcasts(prev => prev.map(b =>
                        b.id === pollingBroadcastId ? { ...b, ...data.data } : b
                    ));

                    if (data.data.status === 'COMPLETED' || data.data.status === 'FAILED') {
                        setPollingBroadcastId(null);
                        toast.success(data.data.status === 'COMPLETED'
                            ? `Broadcast completed: ${data.data.sent_count} notifications sent`
                            : 'Broadcast failed'
                        );
                    }
                }
            } catch (err) {
                console.error('Failed to poll broadcast status:', err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [pollingBroadcastId]);

    const handleSubmit = async () => {
        if (!isValidForm) return;
        if (mode === 'broadcast' && !showConfirmDialog) {
            setShowConfirmDialog(true);
            return;
        }

        setIsSubmitting(true);
        setShowConfirmDialog(false);

        try {
            const idempotencyKey = uuidv4();
            const endpoint = mode === 'broadcast' ? '/admin/notifications/broadcast' : '/admin/notifications/send';
            const body = mode === 'broadcast'
                ? { type, title, message, idempotencyKey }
                : { userIds: selectedUsers, type, title, message, idempotencyKey };

            const { data } = await api.post(endpoint, body);

            if (data.success) {
                toast.success(mode === 'broadcast' ? 'Broadcast queued!' : `Sent to ${data.data.sent} users`);
                setTitle('');
                setMessage('');
                setSelectedUsers([]);
                if (mode === 'broadcast' && data.data.broadcastId) {
                    setPollingBroadcastId(data.data.broadcastId);
                }
                loadHistory();
            } else {
                toast.error(data.message || 'Failed to send');
            }
        } catch (err: any) {
            console.error('Send error:', err);
            toast.error(err.response?.data?.message || 'Failed to send notification');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusInfo = (status: string) => {
        const map: any = {
            PENDING: { color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            PROCESSING: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
            COMPLETED: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            FAILED: { color: 'text-red-500', bg: 'bg-red-500/10' },
        };
        return map[status] || map.PENDING;
    };

    const applyTemplate = (tpl: any) => {
        setTitle(tpl.title);
        setMessage(tpl.message);
        setType(tpl.type);
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-4 md:gap-6 h-[calc(100vh-100px)]">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <Radio className="h-5 w-5 md:h-6 md:w-6 text-primary animate-pulse" /> The Broadcast Command
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">Global Signal Control & Telemetry</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-full min-h-0">
                    {/* LEFT: Signal Composer */}
                    <Card className="w-full lg:w-1/2 flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
                        <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-4 md:space-y-6">
                            {/* Mode Select */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg">
                                <button
                                    onClick={() => setMode('broadcast')}
                                    className={cn(
                                        "flex items-center justify-center gap-1 md:gap-2 py-2 md:py-2.5 rounded-md text-xs md:text-sm font-medium transition-all",
                                        mode === 'broadcast' ? "bg-background shadow text-primary" : "text-muted-foreground hover:bg-background/50"
                                    )}
                                >
                                    <Radio className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">Broadcast (All)</span><span className="sm:hidden">All</span>
                                </button>
                                <button
                                    onClick={() => setMode('targeted')}
                                    className={cn(
                                        "flex items-center justify-center gap-1 md:gap-2 py-2 md:py-2.5 rounded-md text-xs md:text-sm font-medium transition-all",
                                        mode === 'targeted' ? "bg-background shadow text-blue-500" : "text-muted-foreground hover:bg-background/50"
                                    )}
                                >
                                    <Users className="h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">Targeted</span><span className="sm:hidden">Select</span>
                                </button>
                            </div>

                            {/* Type Select */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {NOTIFICATION_TYPES.map(t => (
                                    <div
                                        key={t.value}
                                        onClick={() => setType(t.value)}
                                        className={cn(
                                            "cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all hover:border-primary/50",
                                            type === t.value ? "bg-primary/5 border-primary shadow-sm" : "bg-card hover:bg-accent/50"
                                        )}
                                    >
                                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", t.color, "text-white")}>
                                            <t.icon className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-medium">{t.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Smart Templates */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Smart Templates</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                                    {TEMPLATES.map((tpl, i) => (
                                        <Button
                                            key={i}
                                            variant="outline"
                                            size="sm"
                                            className="whitespace-nowrap h-7 text-xs bg-muted/20 flex-shrink-0"
                                            onClick={() => applyTemplate(tpl)}
                                        >
                                            {tpl.title}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-xs font-bold">Subject Line</span>
                                        <span className={cn("text-xs", titleRemaining < 5 ? "text-red-500" : "text-muted-foreground")}>{titleRemaining}</span>
                                    </div>
                                    <Input
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Enter notification title..."
                                        className="font-medium"
                                        maxLength={100}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-xs font-bold">Broadcast Message</span>
                                        <span className={cn("text-xs", messageRemaining < 10 ? "text-red-500" : "text-muted-foreground")}>{messageRemaining}</span>
                                    </div>
                                    <Textarea
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="Type your message here..."
                                        rows={5}
                                        className="resize-none"
                                        maxLength={500}
                                    />
                                </div>
                            </div>

                            {/* Broadcast Audience Indicator */}
                            {mode === 'broadcast' && (
                                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase text-blue-600">Target Audience</div>
                                            <div className="text-sm font-medium">All Active Users (Global Broadcast)</div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs hover:bg-blue-500/10 h-7"
                                        onClick={() => setMode('targeted')}
                                    >
                                        Edit Selection
                                    </Button>
                                </div>
                            )}

                            {/* User Select (Targeted Mode) */}
                            {mode === 'targeted' && (
                                <div className="space-y-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold uppercase">Target Audience</label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedUsers(users.map(u => u.id))}
                                                className="text-xs text-blue-500 hover:text-blue-600 font-bold uppercase hover:underline"
                                            >
                                                Select All
                                            </button>
                                            <span className="text-muted-foreground/30 text-xs">|</span>
                                            <button
                                                onClick={() => setSelectedUsers([])}
                                                className="text-xs text-red-500 hover:text-red-600 font-bold uppercase hover:underline"
                                            >
                                                Clear
                                            </button>
                                            <Badge variant="secondary" className="ml-1">{selectedUsers.length}</Badge>
                                        </div>
                                    </div>
                                    <Input
                                        placeholder="Search users..."
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                    <div className="h-32 border rounded-md overflow-y-auto p-2 space-y-1 bg-muted/20">
                                        {isLoadingUsers ? <Loader2 className="h-4 w-4 animate-spin mx-auto mt-4" /> :
                                            users.map(user => (
                                                <div key={user.id} className="flex items-center gap-2 text-sm p-1 hover:bg-accent rounded cursor-pointer" onClick={() => {
                                                    if (selectedUsers.includes(user.id)) setSelectedUsers(prev => prev.filter(id => id !== user.id));
                                                    else setSelectedUsers(prev => [...prev, user.id]);
                                                }}>
                                                    <input type="checkbox" checked={selectedUsers.includes(user.id)} readOnly className="rounded border-gray-300" />
                                                    <span className="truncate">{user.fullName}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-border/50 bg-muted/10">
                            <Button
                                onClick={handleSubmit}
                                disabled={!isValidForm || isSubmitting}
                                className={cn("w-full shadow-lg font-bold h-11", mode === 'broadcast' ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700")}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                                {mode === 'broadcast' ? 'INITIATE BROADCAST' : 'DISPATCH MESSAGE'}
                            </Button>
                        </div>
                    </Card>

                    {/* RIGHT: Visual Simulator & Telemetry */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-4 md:gap-6 h-full min-h-0">
                        {/* Simulator */}
                        <div className="flex-1 flex items-center justify-center bg-gray-950 rounded-2xl md:rounded-3xl relative overflow-hidden border-4 md:border-8 border-gray-900 shadow-2xl min-h-[300px] md:min-h-0">
                            {/* Mobile Frame Content */}
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8 lg:p-12 z-10 overflow-hidden">
                                <div className="text-center text-white/80 font-mono text-[10px] md:text-xs mb-2 md:mb-3">
                                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </div>
                                <div className="text-center text-white text-3xl md:text-4xl lg:text-5xl font-thin mb-4 md:mb-6 lg:mb-8">
                                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </div>

                                {/* Notification Toast */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="bg-white/90 backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-4 shadow-xl w-full max-w-[90%] md:max-w-[75%] lg:max-w-[70%]"
                                >
                                    <div className="flex gap-2 md:gap-3">
                                        <div className={cn("h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0", NOTIFICATION_TYPES.find(t => t.value === type)?.color)}>
                                            <Bell className="h-4 w-4 md:h-5 md:w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <span className="font-bold text-xs md:text-sm text-gray-900">StudyVault</span>
                                                <span className="text-[10px] md:text-xs text-gray-500">NOW</span>
                                            </div>
                                            <h4 className="font-semibold text-xs md:text-sm text-gray-900 truncate">{title || 'Notification Title'}</h4>
                                            <p className="text-[10px] md:text-xs text-gray-600 line-clamp-2 leading-relaxed">{message || 'Your notification message will appear here exactly as users see it.'}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                            {/* Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                        </div>

                        {/* Telemetry Deck */}
                        <Card className="h-48 md:h-64 flex flex-col bg-card/50 border-border/50">
                            <div className="p-3 border-b border-border/50 flex justify-between items-center bg-muted/20">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-70">
                                    <Radio className="h-3 w-3" /> Telemetry Deck
                                </div>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={loadHistory} aria-label="Refresh broadcast history"><RefreshCw className={cn("h-3 w-3", isLoadingHistory && "animate-spin")} /></Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-0">
                                {broadcasts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                        <Radio className="h-8 w-8 mb-2" />
                                        <span className="text-xs">No Signal Data</span>
                                    </div>
                                ) : (
                                    broadcasts.map(b => {
                                        const info = getStatusInfo(b.status);
                                        const progress = b.target_count > 0 ? (b.sent_count / b.target_count) * 100 : 0;
                                        return (
                                            <div key={b.id} className="p-3 border-b border-border/30 hover:bg-muted/30 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-bold text-xs truncate" title={b.title}>{b.title}</div>
                                                        <div className="text-xs text-muted-foreground line-clamp-2 break-words break-all whitespace-normal max-w-[200px]">{b.message}</div>
                                                    </div>
                                                    <Badge variant="outline" className={cn("text-xs h-5 border-0", info.bg, info.color)}>
                                                        {b.status}
                                                    </Badge>
                                                </div>
                                                {b.status === 'PROCESSING' && (
                                                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-blue-500"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground font-mono">
                                                    <span>{new Date(b.created_at).toLocaleTimeString()}</span>
                                                    <span>{b.sent_count} / {b.target_count} RECIPIENTS</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Confirm Dialog */}
                {showConfirmDialog && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-card border border-border p-6 rounded-2xl max-w-sm w-full shadow-2xl"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="h-16 w-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Global Broadcast</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    You are about to signal <strong>ALL active users</strong>. This action is irreversible.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                                    <Button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold" onClick={handleSubmit}>
                                        Confirm Signal
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
