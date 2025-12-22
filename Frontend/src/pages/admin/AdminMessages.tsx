import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Loader2, Search, Mail, Eye, Trash2, CheckCircle,
    MessageSquare, Copy, Star, Archive, MoreVertical,
    Reply
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AdminLayout from './AdminLayout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminMessages() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-messages', page, search, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search,
            });
            if (statusFilter !== 'all') params.append('status', statusFilter);
            const res = await api.get(`/contact?${params}`);
            return res.data.data;
        },
        placeholderData: (previousData) => previousData,
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await api.patch(`/contact/${id}/status`, { status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
            toast.success('Status updated');
        },
        onError: () => toast.error('Failed to update status'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/contact/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
            toast.success('Message deleted');
            if (selectedMessage) setSelectedMessage(null);
        },
        onError: () => toast.error('Failed to delete message'),
    });

    const handleReply = (msg: any) => {
        const subject = encodeURIComponent(`Re: ${msg.subject}`);
        const body = encodeURIComponent(`\n\n\n--- Original Message ---\nFrom: ${msg.name}\nDate: ${new Date(msg.createdAt).toLocaleString()}\n\n${msg.message}`);
        window.location.href = `mailto:${msg.email}?subject=${subject}&body=${body}`;
        updateStatusMutation.mutate({ id: msg.id, status: 'REPLIED' });
    };

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        toast.success("Email copied to clipboard");
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-500';
            case 'READ': return 'bg-gray-400';
            case 'REPLIED': return 'bg-emerald-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <AdminLayout>
            <div className="h-[calc(100vh-100px)] flex flex-col gap-4 md:gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-between items-end shrink-0">
                    <div>
                        <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-3">
                            Communications
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">Direct inquiries and support tickets</p>
                    </div>
                </div>

                {/* Inbox Interface */}
                <div className="flex-1 flex flex-col lg:flex-row border rounded-lg md:rounded-xl overflow-hidden bg-background shadow-sm min-h-0">
                    {/* LEFT: Message List */}
                    <div className="w-full lg:w-80 xl:w-96 lg:border-r flex flex-col bg-muted/10">
                        {/* Search & Filter */}
                        <div className="p-3 md:p-4 space-y-2 md:space-y-3 bg-background border-b z-10">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search inbox..."
                                    className="pl-9 bg-muted/20 border-none h-9 md:h-10 text-sm"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-8 text-xs w-full bg-background">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Messages</SelectItem>
                                        <SelectItem value="NEW">Unread</SelectItem>
                                        <SelectItem value="READ">Read</SelectItem>
                                        <SelectItem value="REPLIED">Replied</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* List */}
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {isLoading ? (
                                    <div className="p-8 flex justify-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : data?.inquiries.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No messages found
                                    </div>
                                ) : (
                                    data?.inquiries.map((msg: any) => (
                                        <div
                                            key={msg.id}
                                            onClick={() => {
                                                setSelectedMessage(msg);
                                                if (msg.status === 'NEW') {
                                                    updateStatusMutation.mutate({ id: msg.id, status: 'READ' });
                                                }
                                            }}
                                            className={cn(
                                                "p-2 md:p-3 rounded-lg cursor-pointer transition-all hover:bg-muted group relative",
                                                selectedMessage?.id === msg.id ? "bg-white shadow-sm border border-border" : "transparent",
                                                msg.status === 'NEW' && "bg-blue-50/50 hover:bg-blue-50 border-l-4 border-l-blue-500"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-1.5 md:gap-2">
                                                    <Avatar className="h-5 w-5 md:h-6 md:w-6">
                                                        <AvatarFallback className={cn("text-[10px] md:text-xs", getStatusColor(msg.status), "text-white")}>
                                                            {getInitials(msg.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className={cn("text-xs font-semibold truncate max-w-[100px] md:max-w-[120px]", msg.status === 'NEW' ? "text-foreground" : "text-muted-foreground")}>
                                                        {msg.name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(msg.createdAt), 'MMM d')}
                                                </span>
                                            </div>
                                            <div className={cn("text-xs md:text-sm mb-1 truncate", msg.status === 'NEW' ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                                                {msg.subject}
                                            </div>
                                            <div className="text-[10px] md:text-xs text-muted-foreground/70 line-clamp-2 break-words break-all whitespace-normal">
                                                {msg.message}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        <div className="p-2 border-t bg-background text-xs text-center text-muted-foreground flex justify-between items-center px-4">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page"><Trash2 className="h-3 w-3 rotate-180" /></Button>
                            <span>Page {page} of {data?.pagination?.totalPages || 1}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPage(p => p + 1)} disabled={!data || page >= data.pagination.totalPages} aria-label="Next page"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                    </div>

                    {/* RIGHT: Reading Pane */}
                    <div className="flex-1 bg-white flex flex-col h-full overflow-hidden hidden lg:flex">
                        {selectedMessage ? (
                            <>
                                {/* Toolbar */}
                                <div className="h-14 md:h-16 border-b flex items-center justify-between px-4 md:px-6 shrink-0 bg-white">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={() => deleteMutation.mutate(selectedMessage.id)} aria-label="Delete message">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => updateStatusMutation.mutate({ id: selectedMessage.id, status: 'NEW' })} aria-label="Mark as new">
                                            <Mail className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground mr-2">
                                            {format(new Date(selectedMessage.createdAt), 'PPP p')}
                                        </span>
                                        <Button size="sm" onClick={() => handleReply(selectedMessage)} disabled={selectedMessage.status === 'REPLIED'}>
                                            <Reply className="h-4 w-4 mr-2" />
                                            {selectedMessage.status === 'REPLIED' ? 'Replied' : 'Reply'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Content */}
                                <ScrollArea className="flex-1">
                                    <div className="p-8 max-w-3xl mx-auto">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="flex gap-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                                        {getInitials(selectedMessage.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="font-medium text-sm">{selectedMessage.name}</span>
                                                        <span className="text-xs text-muted-foreground">&lt;{selectedMessage.email}&gt;</span>
                                                        <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground" onClick={() => copyEmail(selectedMessage.email)} aria-label="Copy email address">
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="prose prose-slate max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed break-words break-all">
                                            {selectedMessage.message}
                                        </div>
                                    </div>
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                                <MessageSquare className="h-16 w-16 mb-4 opacity-10" />
                                <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
                                <p className="text-sm opacity-60">Choose a message from the list to view details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
