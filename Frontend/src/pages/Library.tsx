import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Download,
    Eye,
    Search,
    BookOpen,
    Clock,
    FileText,
    Grid,
    List,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Library as LibraryIcon,
    Layers,
    Calendar,
    ArrowUpRight,
    History,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Timer,
    MoreVertical
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// --- Types ---
type GroupMode = 'none' | 'subject' | 'semester';
type ViewMode = 'grid' | 'list';
type SortMode = 'recent' | 'oldest' | 'az';

// --- Local Storage Helper for Resume Station ---
const useReadingHistory = () => {
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('notes_reading_history');
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse reading history');
            }
        }
    }, []);

    const addToHistory = (noteId: string) => {
        const newHistory = [noteId, ...history.filter(id => id !== noteId)].slice(0, 3);
        setHistory(newHistory);
        localStorage.setItem('notes_reading_history', JSON.stringify(newHistory));
    };

    return { history, addToHistory };
};

export default function Library() {
    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortMode>('recent');
    const [groupMode, setGroupMode] = useState<GroupMode>('subject');
    const [selectedSemester, setSelectedSemester] = useState<string>('all');

    // Logic State
    const { history, addToHistory } = useReadingHistory();
    const [selectedDisputeNote, setSelectedDisputeNote] = useState<any>(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [debugLog, setDebugLog] = useState<string[]>([]);

    const log = (msg: string) => setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    // --- Data Fetching (Preserved) ---
    const fetchLibrary = async () => {
        const timestamp = Date.now();
        try {
            const { data } = await api.get(`/orders?_t=${timestamp}`, { params: { limit: 100 } });
            if (!data || !data.success || !Array.isArray(data.data)) {
                return [];
            }
            return data.data;
        } catch (err: any) {
            console.error('Library fetch error:', err);
            throw err;
        }
    };

    const { data: libraryData, isLoading, refetch } = useQuery({
        queryKey: ['library-orders'],
        queryFn: fetchLibrary,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: true
    });

    // --- Mutations (Preserved) ---
    const createDisputeMutation = useMutation({
        mutationFn: async ({ transactionId, reason }: any) => {
            const idempotencyKey = `idempotency-${Date.now()}-${Math.random()}`;
            const response = await api.post('/disputes', { transactionId, reason }, {
                headers: { 'Idempotency-Key': idempotencyKey }
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Issue reported successfully');
            setSelectedDisputeNote(null);
            setDisputeReason('');
            refetch();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to report issue');
        }
    });

    const handleSubmitDispute = () => {
        if (!selectedDisputeNote || !disputeReason) return toast.error('Please provide a reason');
        createDisputeMutation.mutate({
            transactionId: selectedDisputeNote.transactionId,
            reason: disputeReason
        });
    };

    const handleDownload = async (noteId: string) => {
        addToHistory(noteId); // Track interaction
        try {
            const response = await api.get(`/download/note/${noteId}`, { responseType: 'blob' });
            if (response.data.type !== 'application/pdf') throw new Error('Server returned non-PDF data');

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            let fileName = `note-${noteId}.pdf`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) fileName = match[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Download started');
        } catch (error: any) {
            toast.error('Download failed. Please try again.');
        }
    };

    const handleView = (noteId: string) => {
        addToHistory(noteId); // Track interaction
        window.open(`/notes/${noteId}`, '_self');
    };

    // --- Data Processing & Logic ---
    const purchasedNotes = useMemo(() => {
        if (!Array.isArray(libraryData)) return [];
        return libraryData.map((order: any, index: number) => {
            try {
                const note = order?.note || {};
                const createdDate = order?.purchasedAt ? new Date(order.purchasedAt) :
                    order?.created_at ? new Date(order.created_at) : new Date();

                return {
                    id: note.id || `safe-id-${index}`,
                    title: note.title || 'Unknown Note',
                    coverImage: note.cover_image || note.cover_image_url || 'https://placehold.co/600x800?text=No+Cover',
                    subject: note.subject || 'General',
                    semester: note.semester ? String(note.semester) : 'N/A',
                    college: note.college_name || 'Note',
                    purchaseDate: isNaN(createdDate.getTime()) ? new Date() : createdDate,
                    transactionId: order.id,
                    dispute: order?.dispute || null
                };
            } catch (e) {
                return null;
            }
        }).filter(Boolean);
    }, [libraryData]);

    // Derived: Resume Station Notes
    const recentNotes = useMemo(() => {
        return history
            .map(id => purchasedNotes.find((n: any) => n.id === id))
            .filter(Boolean);
    }, [history, purchasedNotes]);

    // Derived: Filtering & Sorting
    const processedNotes = useMemo(() => {
        let notes = [...purchasedNotes];

        // 1. Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            notes = notes.filter((n: any) =>
                n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q)
            );
        }

        // 2. Filter by Semester
        if (selectedSemester !== 'all') {
            notes = notes.filter((n: any) => String(n.semester) === selectedSemester);
        }

        // 3. Sort
        notes.sort((a: any, b: any) => {
            if (sortBy === 'recent') return (b.purchaseDate?.getTime() || 0) - (a.purchaseDate?.getTime() || 0);
            if (sortBy === 'oldest') return (a.purchaseDate?.getTime() || 0) - (b.purchaseDate?.getTime() || 0);
            if (sortBy === 'az') return a.title.localeCompare(b.title);
            return 0;
        });

        return notes;
    }, [purchasedNotes, searchQuery, selectedSemester, sortBy]);

    // Derived: Grouping (The Smart Shelves)
    const shelvedNotes = useMemo(() => {
        if (groupMode === 'none') return { 'All Notes': processedNotes };

        return processedNotes.reduce((acc: any, note: any) => {
            const key = groupMode === 'subject' ? note.subject : `Semester ${note.semester}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(note);
            return acc;
        }, {});
    }, [processedNotes, groupMode]);

    // --- Dispute Status Helper ---
    const getDisputeStatus = (dispute: any) => {
        if (!dispute) return null;
        const status = dispute.status.toUpperCase();

        // "BEFORE THAT RED" (Open/Pending)
        if (status === 'OPEN' || status === 'PENDING') return { color: 'text-red-500 bg-red-50 border-red-200', icon: AlertCircle, label: 'Issue Reported' };

        // "ON PROGRESS YELLOW"
        if (status === 'IN_PROGRESS' || status === 'REVIEWING') return { color: 'text-yellow-500 bg-yellow-50 border-yellow-200', icon: Timer, label: 'In Review' };

        // "RESOLVED WITH GREEN"
        if (status === 'RESOLVED' || status === 'APPROVED' || status === 'REFUNDED') return { color: 'text-green-500 bg-green-50 border-green-200', icon: CheckCircle2, label: 'Resolved' };

        // Rejected/Closed
        return { color: 'text-muted-foreground bg-muted border-border', icon: XCircle, label: 'Closed' };
    };

    // --- Renderers ---
    if (isLoading) {
        return (
            <Layout>
                <div className="container py-32 flex justify-center flex-col items-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Opening Vault...</p>
                </div>
            </Layout>
        );
    }

    if (purchasedNotes.length === 0) {
        return (
            <Layout>
                <div className="min-h-[80vh] flex flex-col items-center justify-center container text-center bg-background">
                    <div className="relative h-32 w-32 mx-auto mb-8 cursor-pointer hover:scale-105 transition-transform duration-500">
                        <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl" />
                        <div className="absolute inset-0 border border-primary/20 rounded-full animate-pulse-slow" />
                        <div className="absolute inset-4 bg-background rounded-full flex items-center justify-center border border-primary/10 shadow-lg">
                            <BookOpen className="h-12 w-12 text-primary/60" />
                        </div>
                    </div>
                    <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/5">New Student?</Badge>
                    <h1 className="font-display text-4xl font-bold mb-4 text-foreground">Your Vault is Empty</h1>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-lg">
                        Build your personal knowledge base. Purchased notes will appear here instantly.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/browse">
                            <Button size="lg" className="rounded-full px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold">
                                Browse Marketplace
                            </Button>
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-background pb-20">
                {/* 1. RESUME STATION (Horizontal Rail) */}
                {recentNotes.length > 0 && (
                    <div className="border-b border-border/40 bg-background/50 backdrop-blur-sm">
                        <div className="container py-8">
                            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-primary uppercase tracking-widest">
                                <History className="h-3 w-3" /> Resume Learning
                            </div>
                            <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar snap-x">
                                {recentNotes.map((note: any) => (
                                    <motion.div
                                        key={note.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="snap-start shrink-0 w-[280px] flex gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                        onClick={() => handleView(note.id)}
                                    >
                                        <div className="h-16 w-12 shrink-0 rounded-lg overflow-hidden bg-muted relative">
                                            <img src={note.coverImage} className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="" />
                                        </div>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{note.title}</h4>
                                            <p className="text-xs text-muted-foreground truncate">{note.subject}</p>
                                            <div className="flex items-center gap-1 text-[10px] font-medium text-primary mt-1">
                                                Continue <ArrowUpRight className="h-2 w-2" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="container py-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="font-display text-4xl font-bold text-foreground">My Library</h1>
                            <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                {purchasedNotes.length} Secure Assets
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => refetch()} variant="outline" size="icon" className="rounded-full bg-background border-border/60 hover:bg-muted">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* 2. CONTROLS DECK (Floating Glass) */}
                    <div className="sticky top-20 z-30 bg-background/80 backdrop-blur-xl border border-primary/10 rounded-2xl p-2 mb-10 shadow-lg shadow-black/5 flex flex-col xl:flex-row gap-2 ring-1 ring-black/5">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search your vault..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 border-transparent bg-muted/40 focus:bg-background rounded-xl transition-all"
                            />
                        </div>

                        <div className="h-8 w-px bg-border/50 hidden xl:block my-auto" />

                        {/* Filters Row */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 px-2 no-scrollbar">
                            {/* Group By */}
                            <div className="flex items-center bg-muted/40 rounded-lg p-1">
                                <Button
                                    variant={groupMode === 'subject' ? 'secondary' : 'ghost'}
                                    size="sm" className={cn("h-8 text-xs rounded-md font-medium", groupMode === 'subject' && "bg-background text-primary shadow-sm")}
                                    onClick={() => setGroupMode('subject')}
                                >
                                    Subject
                                </Button>
                                <Button
                                    variant={groupMode === 'semester' ? 'secondary' : 'ghost'}
                                    size="sm" className={cn("h-8 text-xs rounded-md font-medium", groupMode === 'semester' && "bg-background text-primary shadow-sm")}
                                    onClick={() => setGroupMode('semester')}
                                >
                                    Sem
                                </Button>
                                <Button
                                    variant={groupMode === 'none' ? 'secondary' : 'ghost'}
                                    size="sm" className={cn("h-8 text-xs rounded-md font-medium", groupMode === 'none' && "bg-background text-primary shadow-sm")}
                                    onClick={() => setGroupMode('none')}
                                >
                                    All
                                </Button>
                            </div>

                            {/* Sort */}
                            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                <SelectTrigger className="h-10 w-[130px] rounded-lg text-xs font-medium border-transparent bg-muted/40">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">Recently Added</SelectItem>
                                    <SelectItem value="oldest">Date (Oldest)</SelectItem>
                                    <SelectItem value="az">Title (A-Z)</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* View Toggle */}
                            <div className="flex p-1 bg-muted/40 rounded-lg">
                                <Button
                                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                    size="sm" className={cn("h-8 w-8 p-0 rounded-md", viewMode === 'grid' && "bg-background shadow-sm text-primary")}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <Grid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                    size="sm" className={cn("h-8 w-8 p-0 rounded-md", viewMode === 'list' && "bg-background shadow-sm text-primary")}
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* 3. SMART SHELVES RENDERER */}
                    <div className="space-y-12">
                        {Object.entries(shelvedNotes).map(([shelfTitle, notes]: [string, any]) => (
                            <div key={shelfTitle} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {groupMode !== 'none' && (
                                    <div className="flex items-center gap-4 mb-6 sticky top-[140px] z-20 bg-background/95 backdrop-blur py-3 border-b border-border/40">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-4 w-4 text-primary" />
                                            <h3 className="font-bold text-foreground">{shelfTitle}</h3>
                                        </div>
                                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 rounded-md px-2">
                                            {notes.length}
                                        </Badge>
                                    </div>
                                )}

                                <div className={cn(
                                    viewMode === 'grid' ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3"
                                )}>
                                    {notes.map((note: any) => {
                                        const disputeStatus = getDisputeStatus(note.dispute);

                                        return (
                                            <div key={note.id} className="group relative">
                                                {viewMode === 'grid' ? (
                                                    <Card className="overflow-hidden border-border/50 bg-card hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                                                        <div className="relative aspect-[3/4] overflow-hidden bg-muted group-hover:shadow-inner cursor-pointer" onClick={() => handleView(note.id)}>
                                                            <img
                                                                src={note.coverImage}
                                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                                alt=""
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                                                            {/* Dispute Badge Overlay */}
                                                            {disputeStatus && (
                                                                <div className={cn("absolute top-3 left-3 right-3 flex items-center gap-2 px-2 py-1.5 rounded-lg backdrop-blur-md border shadow-sm", disputeStatus.color)}>
                                                                    <disputeStatus.icon className="h-3.5 w-3.5 shrink-0" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wide truncate">{disputeStatus.label}</span>
                                                                </div>
                                                            )}

                                                            <div className="absolute bottom-4 left-4 right-4">
                                                                <h3 className="font-bold text-white line-clamp-2 mb-1 drop-shadow-md">{note.title}</h3>
                                                                <p className="text-xs text-white/80">{note.subject}</p>
                                                            </div>
                                                        </div>
                                                        <CardContent className="p-4 flex flex-col gap-3 flex-1 bg-gradient-to-b from-card to-background">
                                                            <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {new Date(note.purchaseDate).toLocaleDateString()}
                                                                </div>
                                                                <Badge variant="outline" className="h-5 text-[10px] px-1.5 border-border/60">Sem {note.semester}</Badge>
                                                            </div>

                                                            {/* Actions Row */}
                                                            <div className="flex items-center gap-2 mt-auto">
                                                                {/* BIG DOWNLOAD BUTTON (Primary Action) */}
                                                                <Button
                                                                    className="flex-1 h-10 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10 transition-all hover:scale-[1.02]"
                                                                    onClick={() => handleDownload(note.id)}
                                                                >
                                                                    <Download className="h-4 w-4 mr-2" />
                                                                    Download
                                                                </Button>

                                                                {/* More Actions Menu */}
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button size="icon" variant="ghost" className="h-10 w-10 text-muted-foreground hover:text-foreground">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48">
                                                                        <DropdownMenuItem onClick={() => handleView(note.id)}>
                                                                            <Eye className="h-4 w-4 mr-2" /> Read Online
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => setSelectedDisputeNote(note)} className="text-red-500 focus:text-red-600 focus:bg-red-50">
                                                                            <AlertTriangle className="h-4 w-4 mr-2" /> Report Issue
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ) : (
                                                    // List View (Preserved but Polished)
                                                    <div className="flex items-center gap-4 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-all group hover:border-primary/20 hover:shadow-sm">
                                                        <div className="h-16 w-12 shrink-0 rounded-lg bg-muted overflow-hidden relative cursor-pointer" onClick={() => handleView(note.id)}>
                                                            <img src={note.coverImage} className="h-full w-full object-cover" alt="" />
                                                            {disputeStatus && (
                                                                <div className={cn("absolute inset-0 flex items-center justify-center bg-black/40")}>
                                                                    <disputeStatus.icon className={cn("h-6 w-6 text-white drop-shadow-md", disputeStatus.color.replace('text-', 'text-white '))} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleView(note.id)}>
                                                            <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{note.title}</h4>
                                                            <p className="text-xs text-muted-foreground">{note.subject} • Sem {note.semester}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {disputeStatus && (
                                                                <Badge variant="outline" className={cn("hidden sm:flex items-center gap-1", disputeStatus.color)}>
                                                                    {disputeStatus.label}
                                                                </Badge>
                                                            )}
                                                            <Button size="sm" onClick={() => handleDownload(note.id)} className="font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground">
                                                                <Download className="h-4 w-4 mr-1.5" /> Download
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => setSelectedDisputeNote(note)}>
                                                                <AlertTriangle className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dispute Dialog (Polished) */}
                <Dialog open={!!selectedDisputeNote} onOpenChange={() => setSelectedDisputeNote(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" /> Report Verification Issue
                            </DialogTitle>
                            <DialogDescription>
                                Found a problem with <strong>{selectedDisputeNote?.title}</strong>? Our team handles these cases with priority (2-4hr resolution).
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="grid gap-2">
                                <Label>Describe the issue</Label>
                                <Textarea
                                    value={disputeReason}
                                    onChange={e => setDisputeReason(e.target.value)}
                                    placeholder="e.g., Pages 4-5 are blank, Content doesn't match subject..."
                                    className="min-h-[100px] resize-none focus-visible:ring-red-500/20"
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setSelectedDisputeNote(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleSubmitDispute} disabled={createDisputeMutation.isPending} className="font-bold">
                                {createDisputeMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : 'Open Dispute Ticket'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}
