import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FileText,
    Upload,
    Info,
    IndianRupee,
    CheckCircle2,
    Save,
    Loader2,
    ArrowLeft,
    Eye,
    Star,
    MonitorSmartphone,
    Smartphone,
    Monitor,
    Sparkles,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SellerLayout from '@/components/seller/SellerLayout';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Reuse NoteCard Preview logic (localized for isolation)
const LivePreviewCard = ({ formData, device }: { formData: any, device: 'mobile' | 'desktop' }) => {
    return (
        <div className={cn(
            "bg-background rounded-xl overflow-hidden shadow-2xl transition-all duration-500 border border-border/50",
            device === 'mobile' ? "w-[320px] mx-auto min-h-[500px]" : "w-full aspect-video flex"
        )}>
            {/* Visual Side */}
            <div className={cn("relative overflow-hidden bg-muted", device === 'mobile' ? "aspect-[4/3] w-full" : "w-1/3 h-full")}>
                {formData.coverImage ? (
                    <img src={formData.coverImage} className="w-full h-full object-cover" alt="Cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
                        <Eye className="w-8 h-8 opacity-20" />
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <Badge className={cn("backdrop-blur-md shadow-sm", formData.isActive ? "bg-accent/90" : "bg-warning/90")}>
                        {formData.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
            </div>

            {/* Content Side */}
            <div className={cn("p-4 flex flex-col", device === 'mobile' ? "flex-1" : "flex-1 justify-center")}>
                <div className="space-y-2">
                    <h3 className={cn("font-bold leading-tight", device === 'mobile' ? "text-lg line-clamp-2" : "text-xl")}>
                        {formData.title || "Untitled Asset"}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">Subject</span>
                        <span>•</span>
                        <span>University</span>
                    </div>
                </div>

                <p className={cn("text-xs text-muted-foreground mt-2 line-clamp-3", device === 'mobile' ? "" : "text-sm")}>
                    {formData.description || "No description provided."}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> 0</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning" /> 0.0</span>
                    </div>
                    <div className="font-bold text-lg text-primary">
                        ₹{formData.price || 0}
                    </div>
                </div>
                {device === 'desktop' && (
                    <div className="mt-4 pt-4 border-t border-border/10 flex gap-2">
                        <div className="h-2 w-16 bg-muted rounded-full" />
                        <div className="h-2 w-10 bg-muted rounded-full" />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function EditNote() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        tableOfContents: '',
        isActive: true,
        coverImage: '',
        previewPages: [] as string[]
    });

    // Asset Health Calculation
    const healthScore = useMemo(() => {
        let score = 0;
        if (formData.title.length > 10) score += 20;
        if (formData.description.length > 50) score += 20;
        if (formData.coverImage) score += 20;
        if (formData.previewPages.length >= 3) score += 20;
        if (formData.price && Number(formData.price) > 0) score += 20;
        return score;
    }, [formData]);

    const healthColor = healthScore >= 80 ? "bg-accent" : healthScore >= 50 ? "bg-warning" : "bg-destructive";

    // Fetch Note Details
    const { data: note, isLoading } = useQuery({
        queryKey: ['note', id],
        queryFn: async () => {
            const { data } = await api.get(`/notes/${id}`);
            return data.data;
        },
        enabled: !!id
    });

    // Populate Form
    useEffect(() => {
        if (note) {
            setFormData({
                title: note.title,
                description: note.description,
                price: note.price?.toString() || '',
                tableOfContents: note.tableOfContents?.join('\n') || '',
                isActive: note.isActive,
                coverImage: note.coverImage || '',
                previewPages: note.previewPages || []
            });
        }
    }, [note]);

    const handleValuesChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Cover image must be less than 5MB');
            return;
        }

        const uploadForm = new FormData();
        uploadForm.append('file', file);
        const toastId = toast.loading('Uploading new cover...');

        try {
            const { data } = await api.post('/upload/preview', uploadForm, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (data.success) {
                setFormData(prev => ({ ...prev, coverImage: data.data.url }));
                toast.success('Cover updated!', { id: toastId });
            }
        } catch (error) { toast.error('Failed to upload', { id: toastId }); }
    };

    const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const validFiles = Array.from(files);
        if (validFiles.length + (formData.previewPages?.length || 0) > 6) {
            toast.error('Max 6 preview pages allowed');
            return;
        }

        const toastId = toast.loading('Uploading previews...');
        try {
            const newUrls: string[] = [];
            for (const file of validFiles) {
                const uploadForm = new FormData();
                uploadForm.append('file', file);
                const { data } = await api.post('/upload/preview', uploadForm, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (data.success && data.data.url) newUrls.push(data.data.url);
            }
            setFormData(prev => ({ ...prev, previewPages: [...prev.previewPages, ...newUrls] }));
            toast.success('Previews added!', { id: toastId });
        } catch (err) { toast.error('Upload failed', { id: toastId }); }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                price: formData.price,
                tableOfContents: formData.tableOfContents.split('\n').filter(line => line.trim()),
                isActive: formData.isActive,
                coverImage: formData.coverImage,
                previewPages: formData.previewPages
            };

            await api.put(`/notes/${id}`, payload);
            toast.success('Asset Refined Successfully!');
            navigate(`/notes/${id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update note');
        } finally {
            setIsSaving(false);
        }
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
            <div className="min-h-screen pb-20">
                {/* STUDIO HEADER */}
                <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 mb-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/seller/notes')} className="rounded-full" aria-label="Back to my notes">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="font-display text-lg font-bold flex items-center gap-2">
                                    Design Studio
                                    <Badge variant="outline" className="font-mono text-xs text-muted-foreground font-normal">v1.2</Badge>
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex flex-col items-end mr-4">
                                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                    <Sparkles className="w-3 h-3 text-primary" /> Listing Strength
                                </div>
                                <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className={cn("h-full transition-all duration-1000", healthColor)} style={{ width: `${healthScore}%` }} />
                                </div>
                            </div>

                            <Button disabled={isSaving} onClick={handleSubmit} className={cn("shadow-lg transition-all", healthScore === 100 ? "shadow-accent/20 hover:shadow-accent/30" : "")}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Publish Changes
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-12 gap-8">

                    {/* LEFT PANEL: EDITOR */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* BASIC INFO */}
                        <Card className="border-border/50 shadow-sm">
                            <CardContent className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Asset Title</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => handleValuesChange('title', e.target.value)}
                                        className="font-display text-lg font-bold h-12 border-muted-foreground/20 focus:border-primary transition-all"
                                        placeholder="e.g. Advanced Quantum Mechanics Notes"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price (₹)</Label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                pattern="[0-9]*"
                                                value={formData.price}
                                                onChange={(e) => handleValuesChange('price', e.target.value)}
                                                className="pl-10 font-mono font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visibility</Label>
                                        <div className="flex items-center justify-between p-2.5 border rounded-lg bg-muted/20">
                                            <span className="text-sm font-medium">{formData.isActive ? 'Active' : 'Hidden'}</span>
                                            <Switch checked={formData.isActive} onCheckedChange={(c) => handleValuesChange('isActive', c)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between">
                                        Description
                                        <span className="text-xs normal-case bg-primary/10 text-primary px-1.5 rounded">SEO Optimized</span>
                                    </Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => handleValuesChange('description', e.target.value)}
                                        className="min-h-[150px] resize-none leading-relaxed"
                                        placeholder="Describe your asset in detail..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* VISUAL MANAGER */}
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                            <div className="bg-muted/30 p-4 border-b border-border/50 flex items-center justify-between">
                                <span className="text-sm font-semibold flex items-center gap-2"><Monitor className="w-4 h-4" /> Visual Assets</span>
                                <span className="text-xs text-muted-foreground">{formData.previewPages.length}/6 Previews</span>
                            </div>
                            <CardContent className="p-6 space-y-6">

                                {/* Cover */}
                                <div className="space-y-3">
                                    <Label className="text-xs text-muted-foreground">Main Cover</Label>
                                    <div className="flex gap-4 items-start">
                                        <div className="relative group w-32 aspect-[3/4] rounded-lg overflow-hidden bg-muted border border-border shadow-sm">
                                            {formData.coverImage ? (
                                                <>
                                                    <img src={formData.coverImage} className="w-full h-full object-cover" alt="Note cover preview" />
                                                    <button onClick={() => handleValuesChange('coverImage', '')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                        <Trash2 className="w-6 h-6" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">No Cover</div>
                                            )}
                                        </div>
                                        <div className="flex-1 border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center p-6 hover:bg-muted/50 transition-colors cursor-pointer group relative">
                                            <Upload className="w-8 h-8 text-muted-foreground/50 group-hover:text-primary transition-colors mb-2" />
                                            <p className="text-sm font-medium text-foreground">Click to Replace Cover</p>
                                            <p className="text-xs text-muted-foreground">JPG/PNG, Max 5MB</p>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleCoverImageChange} />
                                        </div>
                                    </div>
                                </div>

                                {/* Previews Grid */}
                                <div className="space-y-3">
                                    <Label className="text-xs text-muted-foreground">Preview Pages</Label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {formData.previewPages.map((url, idx) => (
                                            <div key={idx} className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted">
                                                <img src={url} className="w-full h-full object-cover" alt={`Page ${idx + 1} preview`} />
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, previewPages: prev.previewPages.filter((_, i) => i !== idx) }))}
                                                    className="absolute top-1 right-1 bg-destructive/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100">
                                                    Pg {idx + 1}
                                                </div>
                                            </div>
                                        ))}

                                        {formData.previewPages.length < 6 && (
                                            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors relative aspect-[3/4]">
                                                <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                                                <span className="text-xs font-medium text-muted-foreground">Add</span>
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" multiple onChange={handlePreviewUpload} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </CardContent>
                        </Card>

                    </div>

                    {/* RIGHT PANEL: LIVE PREVIEW */}
                    <div className="hidden lg:block lg:col-span-5 relative">
                        <div className="sticky top-[5.5rem] space-y-4">
                            <div className="flex items-center justify-between bg-muted/50 p-1.5 rounded-lg w-fit mx-auto border border-border/50 backdrop-blur-sm">
                                <button onClick={() => setPreviewDevice('desktop')} className={cn("p-2 rounded-md transition-all", previewDevice === 'desktop' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}>
                                    <Monitor className="w-4 h-4" />
                                </button>
                                <button onClick={() => setPreviewDevice('mobile')} className={cn("p-2 rounded-md transition-all", previewDevice === 'mobile' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}>
                                    <Smartphone className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-3xl -z-10" />
                                <LivePreviewCard formData={formData} device={previewDevice} />
                            </div>

                            <div className="text-center">
                                <p className="text-xs text-muted-foreground italic">
                                    "This is exactly how buyers will see your asset."
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </SellerLayout>
    );
}
