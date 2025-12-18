import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import {
    Bell,
    Check,
    Gift,
    ShoppingBag,
    MessageSquare,
    TrendingDown,
    Info,
    AlertTriangle,
    Eye,
    CheckCircle2,
    Clock,
    Sparkles
} from 'lucide-react';
import api from '@/lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Type definition based on backend response
interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

const ITEMS_PER_PAGE = 20;

export default function NotificationHistory() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    // Parse page from query string or default to 1
    const pageParam = searchParams.get('page');
    const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);

    // Sync state with URL
    useEffect(() => {
        const p = searchParams.get('page');
        if (p) setPage(parseInt(p));
    }, [searchParams]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        setSearchParams({ page: newPage.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Fetch notifications
    const { data, isLoading } = useQuery({
        queryKey: ['notifications', page],
        queryFn: async () => {
            const { data } = await api.get('/notifications', {
                params: {
                    page,
                    limit: ITEMS_PER_PAGE
                }
            });
            // Backend response check
            return data.data;
        },
        placeholderData: (previousData) => previousData,
    });

    // Mark single as read
    const { mutate: markRead } = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    // Mark all as read
    const { mutate: markAllRead, isPending: isMarkingAll } = useMutation({
        mutationFn: async () => {
            await api.put('/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All notifications marked as read');
        }
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'PURCHASE':
                return <ShoppingBag className="h-5 w-5 text-primary" />;
            case 'REFERRAL':
                return <Gift className="h-5 w-5 text-purple-500" />;
            case 'PRICE_DROP':
                return <TrendingDown className="h-5 w-5 text-emerald-500" />;
            case 'REVIEW':
                return <MessageSquare className="h-5 w-5 text-blue-500" />;
            case 'WARNING':
                return <AlertTriangle className="h-5 w-5 text-destructive" />;
            case 'SYSTEM':
            default:
                return <Info className="h-5 w-5 text-zinc-500" />;
        }
    };

    const getIconContainerClass = (type: string) => {
        switch (type) {
            case 'PURCHASE':
                return 'bg-primary/10 border-primary/20';
            case 'REFERRAL':
                return 'bg-purple-500/10 border-purple-500/20';
            case 'PRICE_DROP':
                return 'bg-emerald-500/10 border-emerald-500/20';
            case 'REVIEW':
                return 'bg-blue-500/10 border-blue-500/20';
            case 'WARNING':
                return 'bg-destructive/10 border-destructive/20';
            case 'SYSTEM':
            default:
                return 'bg-zinc-500/10 border-zinc-500/20';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';

        // Return structured date
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const notifications = data?.notifications || [];
    const totalPages = data?.pagination?.totalPages || 1;

    // Semantic Grouping Logic
    const unreadNotifications = notifications.filter((n: Notification) => !n.isRead);
    const readNotifications = notifications.filter((n: Notification) => n.isRead);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-background relative">
                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] mix-blend-multiply" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] mix-blend-multiply" />
                </div>

                <div className="container mx-auto px-4 py-12 max-w-3xl relative z-10">
                    {/* Header */}
                    <div className="flex items-end justify-between mb-8 pb-6 border-b border-border/40">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider mb-2">
                                <Bell className="h-3 w-3" /> Command Center
                            </div>
                            <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">Updates</h1>
                            <p className="text-muted-foreground mt-1 text-lg">
                                Stay informed about your activity and orders.
                            </p>
                        </div>
                        {notifications.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => markAllRead()}
                                disabled={isMarkingAll || unreadNotifications.length === 0}
                                className={cn("hidden sm:flex rounded-xl gap-2", unreadNotifications.length === 0 && "opacity-50")}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Mark all read
                            </Button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start gap-4 p-6 bg-card border border-border/60 rounded-2xl shadow-sm">
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                    <div className="space-y-3 flex-1">
                                        <Skeleton className="h-5 w-1/3" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        // Zen Mode Empty State
                        <div className="text-center py-24 px-4">
                            <div className="relative h-32 w-32 mx-auto mb-6">
                                <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-pulse-slow"></div>
                                <div className="relative h-32 w-32 rounded-full bg-gradient-to-tr from-emerald-50 to-background flex items-center justify-center border-2 border-emerald-100 shadow-xl shadow-emerald-500/10">
                                    <Sparkles className="h-12 w-12 text-emerald-500/80" />
                                </div>
                            </div>
                            <h3 className="font-display text-2xl font-bold text-foreground tracking-tight mb-2">You're all caught up</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed text-lg">
                                The horizon is clear. No new updates to display.
                            </p>
                            <Button variant="outline" className="mt-8 rounded-full px-8 border-dashed" onClick={() => navigate('/browse')}>
                                Explore Store
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8">

                            {/* NEW / UNREAD SECTION */}
                            {unreadNotifications.length > 0 && (
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide px-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                        New & Unread
                                    </div>
                                    <motion.div
                                        variants={container}
                                        initial="hidden"
                                        animate="show"
                                        className="space-y-3"
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {unreadNotifications.map((notification: Notification) => (
                                                <motion.div
                                                    layout
                                                    key={notification.id}
                                                    variants={item}
                                                    exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                                                    className="group relative overflow-hidden bg-card rounded-xl border border-border/60 shadow-sm transition-shadow hover:shadow-xl hover:shadow-primary/5 cursor-pointer border-l-4 border-l-primary"
                                                    onClick={() => {
                                                        markRead(notification.id);
                                                        if (notification.type === 'PURCHASE') {
                                                            navigate('/account');
                                                        } else if (notification.type === 'SYSTEM') {
                                                            navigate(`/notifications/${notification.id}`);
                                                        } else {
                                                            navigate(`/notifications/${notification.id}`);
                                                        }
                                                    }}
                                                    whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <CardContent className="p-5 flex gap-5 items-start">
                                                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-110", getIconContainerClass(notification.type))}>
                                                            {getIcon(notification.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0 pt-0.5">
                                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                                <h3 className="font-bold text-base text-foreground leading-tight group-hover:text-primary transition-colors">
                                                                    {notification.title}
                                                                </h3>
                                                                <span className="text-xs font-mono font-medium text-primary shrink-0 bg-primary/5 px-2 py-0.5 rounded">
                                                                    {formatTime(notification.createdAt)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                                                {notification.message}
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                </section>
                            )}

                            {/* EARLIER / READ SECTION */}
                            {readNotifications.length > 0 && (
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wide px-1 mt-6">
                                        <Clock className="h-3.5 w-3.5" />
                                        Earlier History
                                    </div>
                                    <motion.div
                                        variants={container}
                                        initial="hidden"
                                        animate="show"
                                        className="space-y-3"
                                    >
                                        {readNotifications.map((notification: Notification) => (
                                            <motion.div
                                                key={notification.id}
                                                variants={item}
                                                className="group bg-muted/20 border border-border/40 rounded-xl hover:bg-card transition-colors duration-300 hover:shadow-sm cursor-pointer"
                                                onClick={() => {
                                                    if (notification.type === 'PURCHASE') {
                                                        navigate('/account');
                                                    } else {
                                                        navigate(`/notifications/${notification.id}`);
                                                    }
                                                }}
                                                whileHover={{ y: -2, transition: { type: "spring", stiffness: 400 } }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <CardContent className="p-4 sm:p-5 flex gap-4 items-center">
                                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <h3 className="font-semibold text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                                                {notification.title}
                                                            </h3>
                                                            <span className="text-xs text-muted-foreground/60 shrink-0">
                                                                {formatTime(notification.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground/80 line-clamp-1 group-hover:line-clamp-none transition-all">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </section>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-12 pt-6 border-t border-border/40">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                                            className="gap-1 pl-2.5"
                                        >
                                            <span>Previous</span>
                                        </Button>
                                    </PaginationItem>
                                    <PaginationItem className="hidden sm:block">
                                        <div className="flex items-center justify-center px-4 text-sm font-medium text-muted-foreground">
                                            Page {page} of {totalPages}
                                        </div>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={page >= totalPages}
                                            onClick={() => handlePageChange(page + 1)}
                                            className="gap-1 pr-2.5"
                                        >
                                            <span>Next</span>
                                        </Button>
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
