import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, Calendar, Info, CheckCircle, AlertTriangle, MessageSquare,
    AlertCircle, ShoppingBag, Gift, TrendingDown, Wallet, ArrowRight,
    Shield, HelpCircle, Heart, FileText, ExternalLink
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NotificationDetails {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    status: string;
}

export default function NotificationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: notification, isLoading, isError, error } = useQuery({
        queryKey: ['notification', id],
        queryFn: async () => {
            try {
                const { data } = await api.get(`/notifications/${id}`);
                return data.data as NotificationDetails;
            } catch (err: any) {
                if (err.response?.status === 404) {
                    throw new Error('NOT_FOUND');
                }
                throw err;
            }
        },
        staleTime: 0,
        retry: 1
    });

    useEffect(() => {
        if (notification?.isRead) {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    }, [notification, queryClient]);

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getConfig = (type: string) => {
        switch (type) {
            case 'PURCHASE':
                return {
                    icon: ShoppingBag,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/20',
                    action: { label: 'View Wallet', route: '/seller/wallet', icon: Wallet }
                };
            case 'REFERRAL':
                return {
                    icon: Gift,
                    color: 'text-purple-600',
                    bg: 'bg-purple-500/10',
                    border: 'border-purple-500/20',
                    action: { label: 'Check Earnings', route: '/seller/wallet', icon: Wallet }
                };
            case 'PRICE_DROP':
                return {
                    icon: TrendingDown,
                    color: 'text-blue-600',
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/20',
                    action: { label: 'View Wishlist', route: '/wishlist', icon: Heart }
                };
            case 'REVIEW':
                return {
                    icon: MessageSquare,
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-500/10',
                    border: 'border-indigo-500/20',
                    action: { label: 'View Notes', route: '/seller/notes', icon: FileText }
                };
            case 'WARNING':
                return {
                    icon: AlertTriangle,
                    color: 'text-amber-600',
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20',
                    action: { label: 'Contact Support', route: '/contact', icon: HelpCircle }
                };
            case 'ERROR':
                return {
                    icon: AlertCircle,
                    color: 'text-red-600',
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/20',
                    action: { label: 'Report Issue', route: '/contact', icon: Shield }
                };
            case 'SUCCESS':
                return {
                    icon: CheckCircle,
                    color: 'text-green-600',
                    bg: 'bg-green-500/10',
                    border: 'border-green-500/20',
                    action: { label: 'Go to Library', route: '/library', icon: ArrowRight }
                };
            default:
                return {
                    icon: Info,
                    color: 'text-sky-600',
                    bg: 'bg-sky-500/10',
                    border: 'border-sky-500/20',
                    action: null
                };
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-lg shadow-sm">
                    <CardHeader className="flex flex-row gap-4 items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-6 w-3/4" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isError || !notification) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center py-10">
                    <div className="mx-auto h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold">Notification Unavailable</h3>
                    <p className="text-muted-foreground mt-2 mb-6">This message may have been deleted.</p>
                    <Button onClick={() => navigate('/notifications')} variant="outline">
                        Return to Inbox
                    </Button>
                </Card>
            </div>
        );
    }

    const config = getConfig(notification.type);
    const Icon = config.icon;

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 flex items-center justify-center">
            <div className="w-full max-w-2xl relative">
                {/* Back Link */}
                <div className="absolute -top-12 left-0">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="hover:bg-transparent pl-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Notifications
                    </Button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="overflow-hidden border-0 shadow-xl ring-1 ring-black/5">
                        {/* Header Section */}
                        <div className={cn("p-5 sm:p-8 relative overflow-hidden", config.bg)}>
                            {/* Decorative Background */}
                            <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/3 -translate-y-1/3 pointer-events-none">
                                <Icon className="w-64 h-64" />
                            </div>

                            <div className="relative z-10 flex items-start gap-5">
                                <div className={cn("p-4 rounded-2xl bg-white shadow-sm ring-1 ring-inset ring-black/5", config.color)}>
                                    <Icon className="w-8 h-8" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className={cn("text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/60 border shadow-sm", config.color, config.border)}>
                                            {notification.type}
                                        </span>
                                        <span className="flex items-center text-xs font-medium text-muted-foreground/80">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {getRelativeTime(notification.createdAt)}
                                        </span>
                                    </div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                                        {notification.title}
                                    </h1>
                                </div>
                            </div>
                        </div>

                        {/* Content Body */}
                        <CardContent className="p-5 sm:p-8">
                            <div className="prose prose-slate max-w-none">
                                <p className="text-sm sm:text-lg text-gray-600 leading-relaxed font-normal whitespace-pre-wrap break-words">
                                    {notification.message}
                                </p>
                            </div>
                        </CardContent>

                        {/* Action Deck & Footer */}
                        <CardFooter className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground/50 font-mono">
                                ID: {notification.id.substring(0, 8)}...
                            </div>

                            <div className="flex items-center gap-3">
                                {notification.isRead && (
                                    <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                        <CheckCircle className="w-3 h-3 mr-1.5" />
                                        Read
                                    </span>
                                )}

                                {config.action && (
                                    <Button
                                        onClick={() => navigate(config.action.route)}
                                        className={cn("gap-2 shadow-md hover:shadow-lg transition-all", config.bg, config.color, "hover:bg-opacity-20 bg-opacity-10")}
                                        variant="outline"
                                    >
                                        <config.action.icon className="w-4 h-4" />
                                        {config.action.label}
                                        <ArrowRight className="w-3 h-3 ml-1 opacity-50" />
                                    </Button>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
