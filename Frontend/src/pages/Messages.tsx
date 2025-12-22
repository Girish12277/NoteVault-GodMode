import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
    Send,
    Search,
    User as UserIcon,
    ArrowLeft,
    Info,
    MoreVertical,
    ShieldCheck,
    Paperclip,
    Image as ImageIcon,
    Mic,
    Smile,
    Check,
    CheckCheck,
    Phone,
    Video,
    Reply,
    Trash2,
    Copy,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/types';
import { toast } from 'sonner';
import { ChatUserProfile } from '@/components/messaging/ChatUserProfile';
import { MessageSkeleton } from '@/components/messaging/MessageSkeleton';
import { cn } from '@/lib/utils';
// Note: date-fns imports removed to avoid conflict. Using local helpers.

// --- HELPERS ---

// Lightweight "isToday/isYesterday" implementation to avoid dependency assumption
function isToday(date: Date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

function isYesterday(date: Date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
}

const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};


export default function Messages() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const initialPartnerId = searchParams.get('userId');
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(initialPartnerId);
    const [newMessage, setNewMessage] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null); // NEW: Reply state
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const queryClient = useQueryClient();

    // Fetch Conversations
    const { data: conversations = [], isLoading: isLoadingConvos } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const { data } = await api.get('/messages/conversations');
            return data.data;
        }
    });

    // Fetch Messages
    const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
        queryKey: ['messages', selectedPartnerId],
        queryFn: async () => {
            if (!selectedPartnerId) return [];
            const { data } = await api.get(`/messages/${selectedPartnerId}`);
            return data.data;
        },
        enabled: !!selectedPartnerId,
        refetchInterval: 5000
    });

    // --- PROCESSED MESSAGES (Grouping & Dates) ---
    const processedGroups = useMemo(() => {
        if (!messages || messages.length === 0) return [];

        const groups: { date: string; msgs: Message[] }[] = [];

        messages.forEach((msg: Message) => {
            const dateLabel = formatMessageDate(msg.createdAt);
            const lastGroup = groups[groups.length - 1];

            if (lastGroup && lastGroup.date === dateLabel) {
                lastGroup.msgs.push(msg);
            } else {
                groups.push({ date: dateLabel, msgs: [msg] });
            }
        });

        return groups;
    }, [messages]);


    const safeFormatTime = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    const scrollToBottom = (instant = false) => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' });
        }
    };

    useLayoutEffect(() => {
        const isMyLastMessage = messages.length > 0 && messages[messages.length - 1]?.senderId === user?.id;
        scrollToBottom(isMyLastMessage);
    }, [messages, selectedPartnerId, isLoadingMessages]);

    const { mutate: sendMessage, isPending: isSending } = useMutation({
        mutationFn: async () => {
            if (!selectedPartnerId || !newMessage.trim()) return;
            const content = newMessage;
            setNewMessage('');
            setReplyingTo(null); // Clear reply context

            await api.post('/messages', {
                receiverId: selectedPartnerId,
                content: content
                // Note: If backend supports parentId, we'd add it here: parentId: replyingTo?.id
            });
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['messages', selectedPartnerId] });
            const previousMessages = queryClient.getQueryData(['messages', selectedPartnerId]);

            const optimisticMessage: Message = {
                id: 'temp-' + Date.now(),
                senderId: user?.id || 'me',
                receiverId: selectedPartnerId!,
                content: newMessage,
                createdAt: new Date().toISOString(),
                isRead: false,
            };

            queryClient.setQueryData(['messages', selectedPartnerId], (old: Message[] = []) => {
                return [...old, optimisticMessage];
            });

            return { previousMessages };
        },
        onError: (_err, _newTodo, context: any) => {
            toast.error('Message failed to send. Please retry.');
            if (context?.previousMessages) {
                queryClient.setQueryData(['messages', selectedPartnerId], context.previousMessages);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedPartnerId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || isSending) return;
        sendMessage();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReply = (msg: Message) => {
        setReplyingTo(msg);
        inputRef.current?.focus();
    };

    const [isMobileView, setIsMobileView] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobileView(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleBackToConversations = () => {
        setSelectedPartnerId(null);
        setShowProfile(false);
        setReplyingTo(null);
    };

    const currentConversation = conversations.find((c: any) => c.other_user?.user_id === selectedPartnerId);
    const partnerDisplay = currentConversation?.other_user;
    const statusText = "Active now";

    return (
        <Layout>
            <div className="container py-2 md:py-4 h-[calc(100vh-3.5rem)] flex gap-0 md:gap-4 relative overflow-hidden">

                {/* --- LEFT SIDEBAR: CONVERSATIONS (Floating Style) --- */}
                <Card className={cn(
                    "w-full md:w-80 flex-col h-full border-border/50 shadow-lg bg-card/80 backdrop-blur-xl border-0 md:border md:rounded-3xl overflow-hidden mb-16 md:mb-0",
                    isMobileView && selectedPartnerId ? 'hidden' : 'flex'
                )}>
                    <div className="p-5 border-b border-border/10 bg-gradient-to-b from-background to-transparent z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-display font-bold text-2xl tracking-tight">Chats</h2>
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-muted/40 hover:bg-muted" aria-label="Conversation options"><MoreVertical className="h-4 w-4" /></Button>
                        </div>
                        <div className="relative group transition-all duration-300 focus-within:scale-[1.02]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input placeholder="Search" className="pl-10 h-11 bg-muted/30 border-0 focus:bg-muted/50 focus:ring-1 focus:ring-primary/20 transition-all rounded-2xl" />
                        </div>
                    </div>
                    <ScrollArea className="flex-1 px-3">
                        <div className="py-2 space-y-1">
                            {isLoadingConvos ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl mb-1">
                                        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                                            <div className="h-2 w-3/4 bg-muted animate-pulse rounded" />
                                        </div>
                                    </div>
                                ))
                            ) : conversations.length === 0 ? (
                                <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-3 mt-10">
                                    <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                                        <UserIcon className="h-7 w-7 opacity-30" />
                                    </div>
                                    <p className="text-sm font-medium">No messages yet</p>
                                </div>
                            ) : (
                                conversations.map((convo: any) => (
                                    <button
                                        key={convo.conversation_id}
                                        onClick={() => setSelectedPartnerId(convo.other_user.user_id)}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-3.5 rounded-2xl text-left transition-all duration-300 group relative mb-1 border border-transparent",
                                            selectedPartnerId === convo.other_user.user_id
                                                ? "bg-background shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] scale-[1.02] border-border/40 z-10"
                                                : "hover:bg-muted/40 hover:scale-[1.01]"
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                                                <AvatarImage src={convo.other_user.avatar_url} />
                                                <AvatarFallback className="text-lg bg-indigo-50 text-indigo-500 font-bold">{convo.other_user.display_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-[3px] border-background shadow-sm" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className={cn("font-bold text-sm truncate transition-colors", selectedPartnerId === convo.other_user.user_id ? "text-primary" : "text-foreground")}>
                                                    {convo.other_user.display_name}
                                                </span>
                                                {convo.last_message_at && (
                                                    <span className="text-xs opacity-50 shrink-0 font-semibold uppercase tracking-wide">
                                                        {new Date(convo.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={cn("text-xs truncate max-w-[180px] font-medium", selectedPartnerId === convo.other_user.user_id ? "opacity-90 text-foreground/80" : "opacity-50")}>
                                                {convo.last_message_preview || 'Start chatting'}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </Card>

                {/* --- MAIN CHAT AREA --- */}
                <Card className={cn(
                    "flex-1 flex-col h-full border-0 md:border md:border-border/50 shadow-2xl overflow-hidden bg-[#f4f5f8] dark:bg-[#020202] md:rounded-3xl relative",
                    isMobileView && !selectedPartnerId ? 'hidden' : 'flex'
                )}>
                    {selectedPartnerId ? (
                        <>
                            {/* 1. Glass Header */}
                            <div className="px-5 py-3 border-b border-white/20 bg-background/70 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20 shadow-sm transition-all duration-500">
                                <div className="flex items-center gap-3">
                                    {isMobileView && (
                                        <Button variant="ghost" size="icon" onClick={handleBackToConversations} className="-ml-2 rounded-full hover:bg-black/5" aria-label="Back to conversations">
                                            <ArrowLeft className="h-5 w-5" />
                                        </Button>
                                    )}
                                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowProfile(!showProfile)}>
                                        <div className="relative transform transition-transform group-hover:scale-105 duration-300">
                                            <Avatar className="h-10 w-10 border border-border shadow-sm">
                                                <AvatarImage src={partnerDisplay?.avatar_url} />
                                                <AvatarFallback>{partnerDisplay?.display_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm leading-none mb-0.5 text-foreground/90">{partnerDisplay?.display_name || 'Loading...'}</h3>
                                            <p className="text-xs text-green-600 font-bold leading-none tracking-wide">{statusText}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Button variant="ghost" size="icon" className="hidden md:flex rounded-full hover:bg-black/5 hover:text-foreground transition-colors" aria-label="Start voice call"><Phone className="h-[18px] w-[18px]" /></Button>
                                    <Button variant="ghost" size="icon" className="hidden md:flex rounded-full hover:bg-black/5 hover:text-foreground transition-colors" aria-label="Start video call"><Video className="h-[18px] w-[18px]" /></Button>
                                    <div className="w-px h-5 bg-border mx-2 hidden md:block" />
                                    <Button variant="ghost" size="icon" onClick={() => setShowProfile(!showProfile)} className="rounded-full hover:bg-black/5 hover:text-foreground" aria-label={showProfile ? "Hide user profile" : "Show user profile"}>
                                        <Info className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* 2. Chat Canvas (Fluid Layout) */}
                            <ScrollArea className="flex-1 bg-[url('https://adrianatoledo.es/wp-content/uploads/2021/08/whatsapp-chat-doodle-pattern.png')] bg-[length:400px] dark:opacity-10 dark:invert">
                                <div className="min-h-full flex flex-col justify-end p-4 pb-0">
                                    {isLoadingMessages ? (
                                        <MessageSkeleton />
                                    ) : (
                                        <div className="space-y-6 pb-24 md:pb-6">
                                            {/* Encryption Badge */}
                                            <div className="flex justify-center my-6">
                                                <div className="bg-yellow-100/40 dark:bg-yellow-900/10 backdrop-blur-md text-yellow-700 dark:text-yellow-500 text-xs px-4 py-1.5 rounded-full border border-yellow-200/30 flex items-center gap-2 shadow-sm font-semibold tracking-tight">
                                                    <ShieldCheck className="h-3 w-3" /> End-to-end encrypted
                                                </div>
                                            </div>

                                            {/* Date Groups */}
                                            {processedGroups.map((group, groupIndex) => (
                                                <div key={group.date} className="space-y-1 relative">
                                                    <div className="flex justify-center sticky top-4 z-10 mb-4 pointer-events-none">
                                                        <span className="bg-muted/80 backdrop-blur-xl text-xs font-bold text-muted-foreground/80 px-3 py-1 rounded-full shadow-sm border border-white/20 uppercase tracking-widest">
                                                            {group.date}
                                                        </span>
                                                    </div>

                                                    {group.msgs.map((msg: Message, i: number, arr: Message[]) => {
                                                        const isMe = msg.senderId === user?.id;
                                                        const isOptimistic = msg.id.startsWith('temp-');
                                                        const isPreviousSameSender = i > 0 && arr[i - 1].senderId === msg.senderId;
                                                        const isNextSameSender = i < arr.length - 1 && arr[i + 1].senderId === msg.senderId;

                                                        return (
                                                            <div
                                                                key={msg.id}
                                                                className={cn(
                                                                    "flex w-full group relative",
                                                                    isMe ? "justify-end" : "justify-start",
                                                                    isNextSameSender ? "mb-0.5" : "mb-3"
                                                                )}
                                                            >
                                                                {/* Hover Actions (Floating Menu) */}
                                                                <div className={cn(
                                                                    "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-0.5 bg-background/50 backdrop-blur rounded-full p-1 border border-border/20 shadow-sm z-10",
                                                                    isMe ? "-left-20" : "-right-20"
                                                                )}>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-background" title="Reply" onClick={() => handleReply(msg)}>
                                                                        <Reply className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-background" title="React">
                                                                        <Smile className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-background" aria-label="More options">
                                                                        <MoreVertical className="h-3 w-3" />
                                                                    </Button>
                                                                </div>

                                                                <div className={cn(
                                                                    "relative max-w-[85%] sm:max-w-[70%] px-4 py-2 text-[14px] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 transform origin-bottom",
                                                                    isMe
                                                                        ? "bg-primary text-primary-foreground"
                                                                        : "bg-white dark:bg-slate-800 text-foreground border border-transparent dark:border-border/20",
                                                                    "rounded-2xl",
                                                                    isMe
                                                                        ? (isNextSameSender ? "rounded-br-sm" : "rounded-br-xl")
                                                                        : (isNextSameSender ? "rounded-bl-sm" : "rounded-bl-xl"),
                                                                    isOptimistic && "opacity-70 grayscale-[0.5]"
                                                                )}>

                                                                    {!isMe && !isPreviousSameSender && (
                                                                        <div className="text-xs font-bold text-primary mb-1 opacity-90 tracking-wide">
                                                                            {partnerDisplay?.display_name}
                                                                        </div>
                                                                    )}

                                                                    <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>

                                                                    <div className={cn(
                                                                        "flex items-center gap-1 mt-1 opacity-70 select-none",
                                                                        isMe ? "justify-end text-primary-foreground/90" : "justify-end text-muted-foreground"
                                                                    )}>
                                                                        <span className="text-xs font-medium">{safeFormatTime(msg.createdAt)}</span>
                                                                        {isMe && (
                                                                            <span className="ml-0.5">
                                                                                {isOptimistic ? <Check className="h-3 w-3" /> : <CheckCheck className="h-3 w-3" />}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}

                                            <div ref={scrollRef} className="h-px w-full" />
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* 3. Floating Input Pill */}
                            <div className="absolute bottom-5 left-0 right-0 px-4 z-20 pointer-events-none flex justify-center w-full">
                                <div className="pointer-events-auto w-full max-w-4xl bg-background/80 backdrop-blur-2xl border border-white/20 dark:border-border/40 p-2 rounded-[2rem] shadow-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/20 flex flex-col gap-2">

                                    {/* Quote Banner */}
                                    {replyingTo && (
                                        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-xl mb-1 border-l-4 border-primary mx-1 animate-in slide-in-from-bottom-2 fade-in">
                                            <div className="flex flex-col text-xs overflow-hidden">
                                                <span className="font-bold text-primary">Replying to {replyingTo.senderId === user?.id ? 'Yourself' : partnerDisplay?.display_name}</span>
                                                <span className="truncate opacity-70 max-w-[200px] md:max-w-md">{replyingTo.content}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Tools & Input */}
                                    <div className="flex items-end gap-2 px-1">
                                        <div className="flex gap-1 pb-1.5 pl-1">
                                            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-all active:scale-90" aria-label="Attach file"><Paperclip className="h-5 w-5" /></Button>
                                            <Button variant="ghost" size="icon" className="hidden sm:inline-flex rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-all active:scale-90" aria-label="Attach image"><ImageIcon className="h-5 w-5" /></Button>
                                        </div>

                                        <Textarea
                                            ref={inputRef}
                                            placeholder="Message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            rows={1}
                                            className="min-h-[44px] max-h-[120px] bg-transparent border-0 focus-visible:ring-0 resize-none py-3 px-2 text-base"
                                            disabled={isSending}
                                        />

                                        {newMessage.trim() ? (
                                            <Button
                                                onClick={() => handleSend()}
                                                size="icon"
                                                disabled={isSending}
                                                className="h-10 w-10 mb-1 mr-1 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90"
                                            >
                                                <Send className="h-5 w-5 ml-0.5" />
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="icon" className="h-10 w-10 mb-1 mr-1 rounded-full bg-muted/30 text-muted-foreground hover:bg-muted/80" aria-label="Send message emoji">
                                                <Mic className="h-5 w-5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50 dark:bg-slate-900/10">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                                <div className="bg-background p-8 rounded-3xl border border-border/50 shadow-2xl relative z-10 transform hover:scale-105 transition-transform duration-500">
                                    <UserIcon className="h-20 w-20 text-muted-foreground/30" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-display font-bold text-foreground mb-3">Welcome to Chats</h3>
                            <p className="text-sm max-w-xs text-center leading-relaxed opacity-70">
                                Select a conversation to start messaging securely. <br /> End-to-end encrypted & Private.
                            </p>
                            <Button className="mt-8 rounded-full px-8 shadow-xl shadow-primary/20" onClick={() => { toast.info('Search for a user in the Browse page') }}>Start New Chat</Button>
                        </div>
                    )}
                </Card>

                {/* Profile Panel */}
                <Sheet open={showProfile} onOpenChange={setShowProfile}>
                    <SheetContent className="w-full sm:max-w-md p-0 border-l border-border/50 rounded-l-[2rem] overflow-hidden">
                        {selectedPartnerId && (
                            <div className="h-full">
                                <ChatUserProfile
                                    userId={selectedPartnerId}
                                    isOpen={true}
                                    onClose={() => setShowProfile(false)}
                                    hideCloseButton={false}
                                />
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </Layout>
    );
}
