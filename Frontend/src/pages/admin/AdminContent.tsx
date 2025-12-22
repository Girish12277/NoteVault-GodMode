import { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  Shield,
  Loader2,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AdminLayout from './AdminLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// --- Types & Interfaces ---
interface Note {
  id: string;
  title: string;
  description: string;
  subject: string;
  priceInr: number;
  fileUrl: string;
  coverImage?: string;
  seller: {
    fullName: string;
    email: string;
  };
  createdAt: string;
}

export default function AdminContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [queueMode, setQueueMode] = useState(false);

  const queryClient = useQueryClient();

  // Fetch Stats (Keep for context if needed, or remove if unused in UI. Keeping for cache validity)
  useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard');
      return data.data;
    }
  });

  // Fetch Pending Notes
  const { data: pendingNotes = [], isLoading: isLoadingNotes, refetch } = useQuery({
    queryKey: ['admin-pending-notes'],
    queryFn: async () => {
      const { data } = await api.get('/admin/notes/pending');
      return data.data.notes;
    }
  });

  // --- Adjudication Logic ---
  const handleApprove = async (noteId: string) => {
    try {
      await api.put(`/admin/notes/${noteId}/approve`);
      toast.success('Note Approved', { icon: <CheckCircle className="text-emerald-500 h-4 w-4" /> });
      advanceQueue(noteId);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    } catch (error) {
      toast.error('Failed to approve note');
    }
  };

  const handleReject = async (noteId: string) => {
    try {
      await api.put(`/admin/notes/${noteId}/reject`, { reason: 'Policy Violation' });
      toast.success('Note Rejected', { icon: <XCircle className="text-red-500 h-4 w-4" /> });
      advanceQueue(noteId);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    } catch (error) {
      toast.error('Failed to reject note');
    }
  };

  const advanceQueue = (currentId: string) => {
    if (queueMode && pendingNotes.length > 0) {
      const currentIndex = pendingNotes.findIndex((n: Note) => n.id === currentId);
      const nextNote = pendingNotes[currentIndex + 1] || null;
      setSelectedNote(nextNote);
      if (!nextNote) setQueueMode(false); // Exit queue if done
    } else {
      setSelectedNote(null);
    }
  };

  // Keyboard Shortcuts for Queue Mode
  useEffect(() => {
    if (!queueMode || !selectedNote) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') handleApprove(selectedNote.id);
      if (e.key === 'r' || e.key === 'R') handleReject(selectedNote.id);
      if (e.key === 'Escape') setQueueMode(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queueMode, selectedNote]);

  // --- Render ---
  if (isLoadingNotes) {
    return (
      <AdminLayout>
        <div className="flex justify-center h-screen items-center flex-col gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-mono">Loading Content Matrix...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">The Panopticon</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm md:text-base">
            <Shield className="h-4 w-4" /> Content Adjudication System
          </p>
        </div>
        {/* Queue Mode Toggle */}
        {pendingNotes.length > 0 && (
          <Button
            variant={queueMode ? "destructive" : "default"}
            onClick={() => {
              setQueueMode(!queueMode);
              if (!queueMode) setSelectedNote(pendingNotes[0]);
            }}
            className={cn("gap-2 shadow-lg", queueMode && "animate-pulse")}
          >
            {queueMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {queueMode ? "Exit Queue Mode (Esc)" : "Start Queue Mode"}
          </Button>
        )}
      </div>

      {/* --- ADJUDICATOR VIEW (No Tabs) --- */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)] lg:h-[calc(100vh-200px)] min-h-[600px]">
        {/* Left: List View */}
        <Card className={cn(
          "flex flex-col overflow-hidden border-border/50 transition-all duration-300",
          "w-full lg:w-1/3",
          // On mobile, if a note is selected, hide the list to show the detail view (optional, or just stack them)
          // For now, let's stack them but limit height of list on mobile
          "h-1/3 lg:h-auto"
        )}>
          <div className="p-4 border-b border-border/50 bg-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter pending..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            {pendingNotes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 text-emerald-500/50" />
                <p>All clear. No pending items.</p>
              </div>
            ) : (
              pendingNotes
                .filter((n: Note) => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((note: Note) => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={cn(
                      "group p-4 border-b border-border/40 cursor-pointer transition-all hover:bg-muted/30",
                      selectedNote?.id === note.id
                        ? "bg-muted relative"
                        : "bg-transparent"
                    )}
                  >
                    {/* Active Indicator Line */}
                    {selectedNote?.id === note.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                    )}

                    <div className="flex items-start justify-between mb-1">
                      <h4 className={cn("font-medium text-sm line-clamp-1", selectedNote?.id === note.id ? "text-foreground font-bold" : "text-foreground/80")}>
                        {note.title}
                      </h4>
                      <Badge variant="outline" className="text-[10px] h-5 border-border/60">{note.subject}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span className="truncate max-w-[120px]">by {note.seller.fullName}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-foreground/70">₹{note.priceInr}</span>
                        <span>{new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>

        {/* Right: Adjudication Stage */}
        <Card className="flex-1 flex flex-col overflow-hidden border-border/50 relative bg-muted/10 h-2/3 lg:h-auto">
          {selectedNote ? (
            <>
              {/* Safe Preview */}
              <div className="flex-1 bg-muted/20 relative overflow-hidden group">
                <iframe
                  src={selectedNote.fileUrl}
                  className="w-full h-full border-0"
                  title="Document Preview"
                />
                {/* Overlay Controls */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" onClick={() => window.open(selectedNote.fileUrl, '_blank')}>
                    <Maximize2 className="h-4 w-4 mr-2" /> Open Full
                  </Button>
                </div>
              </div>

              {/* Decision Bar */}
              <div className="p-4 bg-background border-t border-border/50 flex flex-col sm:flex-row items-center justify-between z-10 shadow-lg gap-4 sm:gap-0">
                <div className="min-w-0 flex-1 mr-0 sm:mr-4 w-full sm:w-auto text-center sm:text-left">
                  <h3 className="font-bold text-lg truncate" title={selectedNote.title}>{selectedNote.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    Seller: <span className="text-foreground font-medium">{selectedNote.seller.fullName}</span> •
                    Email: <span className="font-mono text-xs">{selectedNote.seller.email}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                  {queueMode && <span className="text-xs font-mono text-muted-foreground mr-2 hidden sm:inline">Queue Mode Active (A/R)</span>}
                  <Button
                    variant="outline"
                    className="border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-700 flex-1 sm:flex-none"
                    onClick={() => handleReject(selectedNote.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject {queueMode && '(R)'}
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
                    onClick={() => handleApprove(selectedNote.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve {queueMode && '(A)'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Shield className="h-16 w-16 mb-4 opacity-10" />
              <h3 className="text-lg font-medium">Select a note to adjudicate</h3>
              <p className="text-sm opacity-60">Preview content and make decisions here.</p>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
