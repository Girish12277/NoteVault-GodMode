import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  Star,
  MoreVertical,
  TrendingUp,
  Filter,
  Grid,
  List,
  Zap,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import SellerLayout from '@/components/seller/SellerLayout';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- VISUAL COMPONENTS ---

const HolographicTicker = ({ stats }: { stats: { total: number, active: number, pending: number } }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-primary/5 border-primary/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Briefcase className="w-12 h-12" />
        </div>
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-primary/70 uppercase tracking-wider mb-1">Total Assets</p>
          <div className="text-3xl font-bold font-display flex items-baseline gap-2">
            {stats.total}
            <span className="text-xs font-normal text-muted-foreground bg-primary/10 px-1.5 py-0.5 rounded-full">Items</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-emerald-500/5 border-emerald-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-emerald-600/70 uppercase tracking-wider mb-1">Active</p>
          <div className="text-3xl font-bold font-display text-emerald-700 flex items-baseline gap-2">
            {stats.active}
            <span className="text-xs font-normal text-emerald-600/50">Live</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-500/5 border-amber-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <AlertCircle className="w-12 h-12 text-amber-500" />
        </div>
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-amber-600/70 uppercase tracking-wider mb-1">Pending</p>
          <div className="text-3xl font-bold font-display text-amber-700 flex items-baseline gap-2">
            {stats.pending}
            <span className="text-xs font-normal text-amber-600/50">Reviewing</span>
          </div>
        </CardContent>
      </Card>

      <Link to="/seller/upload" className="block h-full">
        <Button className="w-full h-full bg-gradient-to-br from-primary to-primary/80 hover:to-primary text-primary-foreground border-none rounded-xl shadow-lg shadow-primary/20 flex flex-col items-center justify-center gap-2 group transition-all hover:scale-[1.02]">
          <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
            <Rocket className="w-6 h-6" />
          </div>
          <span className="font-bold">Mint New Asset</span>
        </Button>
      </Link>
    </div>
  );
}

const EmptyVault = () => (
  <div className="text-center py-20 px-4 border-2 border-dashed border-muted-foreground/20 rounded-3xl bg-muted/5 animate-in fade-in zoom-in duration-500">
    <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
      <Briefcase className="w-10 h-10 text-muted-foreground/50" />
    </div>
    <h3 className="text-2xl font-bold font-display mb-2">The Vault is Empty</h3>
    <p className="text-muted-foreground max-w-md mx-auto mb-8">
      You haven't minted any digital assets yet. Upload your first note to start building your empire.
    </p>
    <Link to="/seller/upload">
      <Button size="lg" className="shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all rounded-full px-8">
        <Rocket className="mr-2 h-4 w-4" /> Initialize First Asset
      </Button>
    </Link>
  </div>
);

// --- MAIN COMPONENT ---

export default function MyNotes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Default to Immersive Grid

  // Fetch Seller Notes
  const { data: notesData, isLoading, refetch } = useQuery({
    queryKey: ['seller-notes', statusFilter],
    queryFn: async () => {
      const queryStatus = statusFilter === 'all' ? 'all' : statusFilter === 'active' ? 'active' : 'pending';
      const { data } = await api.get(`/seller/notes?status=${queryStatus}`);
      return data.data.notes;
    }
  });

  const sellerNotes = (notesData || []).map((note: any) => ({
    id: note.id,
    title: note.title,
    subject: note.subject,
    university: note.university.shortName || 'Unknown',
    semester: note.semester,
    price: parseFloat(note.priceInr),
    status: note.isApproved ? (note.isActive ? 'active' : 'inactive') : 'pending',
    coverImage: note.coverImage || (note.previewPages ? (typeof note.previewPages === 'string' ? JSON.parse(note.previewPages)[0] : note.previewPages[0]) : ''),
    views: note.viewCount || 0,
    downloadCount: note.downloadCount || 0,
    rating: note.rating || 0,
    createdAt: note.createdAt,
    conversionRate: note.conversionRate || 0
  }));

  // Logic
  const filteredNotes = sellerNotes
    .filter((note: any) => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || note.status === statusFilter || (statusFilter === 'draft' && note.status === 'pending');
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'downloads': return b.downloadCount - a.downloadCount;
        case 'rating': return b.rating - a.rating;
        case 'price-high': return b.price - a.price;
        case 'price-low': return a.price - b.price;
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const handleDelete = async (noteId: string) => {
    try {
      await api.delete(`/notes/${noteId}`);
      toast.success('Asset deleted from vault');
      refetch();
    } catch (error) { toast.error('Failed to delete asset'); }
  };

  const handleUnpublish = (noteId: string) => { toast.success('Status updated'); };

  const stats = {
    total: sellerNotes.length,
    active: sellerNotes.filter((n: any) => n.status === 'active').length,
    pending: sellerNotes.filter((n: any) => n.status === 'pending').length,
  };

  if (isLoading) {
    return (
      <SellerLayout>
        <div className="flex justify-center h-[calc(100vh-200px)] items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-20">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">The Asset Vault</h1>
            <p className="text-muted-foreground mt-1">Manage your intellectual property portfolio.</p>
          </div>
        </div>

        {/* HOLOGRAPHIC TICKER */}
        <HolographicTicker stats={stats} />

        {/* COMMAND DECK (Sticky Filter Bar) */}
        <div className="sticky top-[4.5rem] z-30 bg-background/80 backdrop-blur-md rounded-xl border border-border/50 shadow-sm p-2 flex flex-col md:flex-row gap-2 transition-all">

          {/* Search */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-transparent focus:bg-background transition-all rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {/* Quick Filter Chips (Replaces Status Dropdown for better UX) */}
            <div className="flex bg-muted/50 p-1 rounded-lg">
              {['all', 'active', 'pending'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all",
                    statusFilter === filter ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-border/50 mx-1" />

            {/* Sort & View Toggle */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-muted/50 border-transparent hover:bg-background focus:bg-background rounded-lg">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="downloads">Top Downloads</SelectItem>
                <SelectItem value="price-high">Highest Price</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-muted/50 p-1 rounded-lg">
              <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded transition-all", viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded transition-all", viewMode === 'list' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ASSET GRID/LIST */}
        {filteredNotes.length === 0 ? <EmptyVault /> : (
          <div className={cn(
            "grid gap-4 animate-in slide-in-from-bottom-4 duration-500",
            viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          )}>
            {filteredNotes.map((note) => (
              <Card key={note.id} className={cn(
                "group relative overflow-hidden transition-all hover:shadow-lg border-muted/50",
                viewMode === 'list' ? "flex flex-row items-center p-2" : "flex flex-col"
              )}>
                {/* Status Glow Border */}
                <div className={cn("absolute inset-0 border-2 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20",
                  note.status === 'active' ? "border-emerald-500/20" : "border-amber-500/20"
                )} />

                {/* Cover Image */}
                <div className={cn(
                  "relative bg-muted shrink-0 overflow-hidden",
                  viewMode === 'grid' ? "aspect-[4/3] w-full" : "w-20 h-20 rounded-lg ml-2"
                )}>
                  {note.coverImage ? (
                    <img src={note.coverImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Eye className="w-8 h-8 opacity-20" /></div>
                  )}

                  {/* Grid specific overlays */}
                  {viewMode === 'grid' && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge className={cn("shadow-sm backdrop-blur-md", note.status === 'active' ? "bg-emerald-500/90 hover:bg-emerald-600" : "bg-amber-500/90 hover:bg-amber-600")}>
                        {note.status}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={cn("flex-1", viewMode === 'grid' ? "p-4" : "p-4 pl-6 grid grid-cols-1 md:grid-cols-4 items-center gap-4")}>

                  {/* Title & Metadata */}
                  <div className={cn("min-w-0 space-y-1", viewMode === 'list' && "md:col-span-2")}>
                    <h3 className="font-bold truncate group-hover:text-primary transition-colors">{note.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">{note.subject}</span>
                      <span>•</span>
                      <span>{note.university}</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className={cn("flex items-center gap-4 text-xs font-medium text-muted-foreground", viewMode === 'grid' ? "mt-4 pt-4 border-t border-border/50 justify-between" : "")}>
                    <div className="flex items-center gap-1.5 tooltip-container" title="Total Views">
                      <Eye className="w-3.5 h-3.5" /> {note.views}
                    </div>
                    <div className="flex items-center gap-1.5" title="Downloads">
                      <Download className="w-3.5 h-3.5" /> {note.downloadCount}
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600" title="Earnings">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="bg-emerald-100/50 px-1 rounded">₹{note.price * note.downloadCount}</span>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className={cn("flex items-center justify-between", viewMode === 'grid' ? "mt-4" : "justify-end gap-2")}>
                    <div className="font-bold text-lg">
                      ₹{note.price}
                      <span className="text-[10px] text-muted-foreground font-normal ml-1">/sale</span>
                    </div>

                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/notes/${note.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary"><Eye className="w-4 h-4" /></Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>View</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/seller/notes/edit/${note.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary"><Edit className="w-4 h-4" /></Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Share Asset Link</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="w-4 h-4 mr-2" /> Burn Asset
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Burn this asset?</AlertDialogTitle>
                                <AlertDialogDescription>Permanently remove this note from the marketplace. All future earnings will cease.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(note.id)} className="bg-destructive hover:bg-destructive/90">Confirm Burn</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
