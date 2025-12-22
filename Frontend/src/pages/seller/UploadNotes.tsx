import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Info,
  IndianRupee,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  FileUp,
  Sparkles,
  Rocket,
  Eye,
  Zap,
  Tag,
  Image as ImageIcon,
  Images
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider'; // Assuming shadcn slider exists or we use input range
import SellerLayout from '@/components/seller/SellerLayout';
import { degrees, specializations, semesters } from '@/data/educationConstants';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// --- VISUAL COMPONENTS ---

const Confetti = () => {
  // Ultra-lightweight CSS confetti implementation
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex justify-center">
      <div className="absolute top-0 w-full h-full animate-in fade-in duration-1000">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 w-2 h-2 rounded-full animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'][Math.floor(Math.random() * 4)]
            }}
          />
        ))}
      </div>
    </div>
  );
};

const NoteCardPreview = ({ data, categoryName }: { data: any, categoryName: string }) => {
  return (
    <Card className="overflow-hidden h-fit sticky top-6 shadow-xl border-primary/10 transition-all duration-500">
      <div className="aspect-[4/3] relative bg-muted/50 overflow-hidden group">
        {data.coverImage ? (
          <img src={data.coverImage} alt="Cover" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center bg-gradient-to-br from-muted/50 to-muted">
            <FileText className="w-12 h-12 mb-2 opacity-20" />
            <span className="text-xs uppercase tracking-widest opacity-40 font-semibold">Preview</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className="bg-white/90 text-foreground backdrop-blur-sm shadow-sm hover:bg-white">
            <IndianRupee className="w-3 h-3 mr-0.5" /> {data.price || 'Free'}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-primary/20 text-primary bg-primary/5">
              {categoryName || 'Category'}
            </Badge>
            <span className="text-xs text-muted-foreground">{data.totalPages || 0} Pages</span>
          </div>
          <h3 className="font-bold text-xs leading-tight line-clamp-2">
            {data.title || 'Your Note Title Goes Here'}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {data.description || 'Add a description to see it previewed here...'}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-xs text-white font-bold">
            ME
          </div>
          <span className="text-xs text-muted-foreground font-medium">By You</span>
        </div>
      </CardContent>
    </Card>
  );
};

// --- STEPS CONFIG (REORDERED) ---
const steps = [
  { id: 1, title: 'Upload File', icon: FileUp },      // Was Step 2
  { id: 2, title: 'Basic Details', icon: Info },      // Was Step 1
  { id: 3, title: 'Description & Media', icon: FileText }, // Added Media
  { id: 4, title: 'Smart Pricing', icon: IndianRupee },
  { id: 5, title: 'Launch Pad', icon: Rocket },       // Was Review
];

export default function UploadNotes() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Standard Fields
    title: '',
    subject: '',
    categoryId: '',
    degree: '',
    specialization: '',
    universityId: '',
    college: '',
    semester: '',
    language: 'en',
    file: null as File | null,
    description: '',
    tableOfContents: '',
    price: '',
    // Metadata
    fileUrl: '',
    fileType: '',
    fileSizeBytes: 0,
    totalPages: 0,
    publicId: '',
    coverImage: '',
    previewPages: [] as string[]
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data
  });

  const { data: universities = [] } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => (await api.get('/universities')).data.data
  });

  // Derived Logic
  const commission = 15;
  const priceValue = parseFloat(formData.price) || 0;
  const earnings = priceValue - (priceValue * commission) / 100;
  const selectedCategoryName = categories.find((c: any) => c.id === formData.categoryId)?.name || '';

  // --- HANDLERS ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) return toast.error('File size > 50MB');
      if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        return toast.error('Only PDF/DOCX allowed');
      }
      // Smart Auto-Fill Attempt (Simulation)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

      setFormData({
        ...formData,
        file,
        title: formData.title || nameWithoutExt.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), // Auto-Title
        fileUrl: '', publicId: '', fileType: '', fileSizeBytes: 0, totalPages: 0
      });
      toast.success("File analyzed! We've auto-filled the title.", { icon: '🤖' });
    }
  };

  const uploadFile = async () => {
    if (!formData.file) return;
    setIsUploading(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', formData.file);
      const { data } = await api.post('/upload/note', uploadForm, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          fileUrl: data.data.url,
          publicId: data.data.publicId,
          fileType: formData.file?.type || 'application/pdf',
          fileSizeBytes: data.data.bytes,
          totalPages: data.data.pages,
          previewPages: (formData.previewPages?.length > 0) ? formData.previewPages : (data.data.previewPages || [])
        }));
        toast.success('File uploaded to vault.');
        setCurrentStep(2); // Auto-advance after upload
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed. Check file size (max 10MB) and format (PDF only).');
    } finally {
      setIsUploading(false);
    }
  };

  // RESTORED: Cover Image Upload Handler
  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Cover must be < 5MB');
    if (!file.type.startsWith('image/')) return toast.error('Images only');

    const uploadForm = new FormData();
    uploadForm.append('file', file);
    const toastId = toast.loading('Uploading cover...');

    try {
      const { data } = await api.post('/upload/preview', uploadForm, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) {
        setFormData(prev => ({ ...prev, coverImage: data.data.url }));
        toast.success('Cover updated', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to upload cover', { id: toastId });
    }
  };

  // RESTORED: Preview Pages Handler
  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length + formData.previewPages.length > 6) return toast.error('Max 6 preview pages');

    const toastId = toast.loading('Uploading previews...');
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const uploadForm = new FormData();
        uploadForm.append('file', file);
        const { data } = await api.post('/upload/preview', uploadForm, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (data.success) newUrls.push(data.data.url);
      }
      setFormData(prev => ({ ...prev, previewPages: [...prev.previewPages, ...newUrls] }));
      toast.success('Previews added', { id: toastId });
    } catch (err) {
      toast.error('Failed to upload previews', { id: toastId });
    }
  };

  const handleNext = async () => {
    // Logic Mapping based on REORDERED steps

    // Step 1 (File) -> Upload -> Step 2
    if (currentStep === 1) {
      if (!formData.file) return toast.error("Please upload a file");
      if (formData.fileUrl) { setCurrentStep(2); return; } // Already uploaded
      await uploadFile();
      return;
    }

    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        degree: formData.degree || null,
        specialization: formData.specialization || null,
        universityId: formData.universityId || null,
        collegeName: formData.college || null,
        semester: parseInt(formData.semester) || 1,
        language: formData.language,
        fileUrl: formData.fileUrl,
        fileType: formData.fileType,
        fileSizeBytes: Number(formData.fileSizeBytes),
        totalPages: Number(formData.totalPages) || 1,
        priceInr: parseFloat(formData.price),
        tableOfContents: formData.tableOfContents.split('\n').filter(line => line.trim()),
        previewPages: formData.previewPages || [],
        coverImage: formData.coverImage || null,
        categoryId: formData.categoryId,
      };

      console.log('📤 Uploading note with payload:', payload);

      await api.post('/notes', payload);

      // LAUNCH PAD CELEBRATION
      setShowConfetti(true);
      toast.success('🚀 Notes Deployed to Marketplace!');
      setTimeout(() => navigate('/seller/notes'), 3000); // Wait for confetti

    } catch (error: any) {
      console.error('Upload Error:', error.response?.data);
      const msg = error.response?.data?.message || 'Publish failed';
      const errors = error.response?.data?.errors;
      if (errors && errors.length > 0) {
        toast.error(`${msg}: ${errors.map((e: any) => e.message || e).join(', ')}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // Validation Logic
  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!formData.file; // File
      case 2: return formData.title.length >= 3 && formData.subject.length >= 2 && !!formData.categoryId; // Details
      case 3: return formData.description.length >= 10; // Desc
      case 4: return priceValue >= 0; // Price
      default: return true;
    }
  };

  // --- RENDER ---
  return (
    <SellerLayout>
      {showConfetti && <Confetti />}
      <div className="max-w-6xl mx-auto min-h-[calc(100vh-100px)] flex flex-col">

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Rocket className="w-6 h-6 text-primary" /> Publish Knowledge
            </h1>
            <p className="text-muted-foreground text-xs">Mint your notes into a digital asset.</p>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-full">
            {steps.map(step => (
              <div key={step.id} className={cn("h-2.5 w-2.5 rounded-full transition-all", step.id === currentStep ? "bg-primary w-6" : step.id < currentStep ? "bg-primary/50" : "bg-muted-foreground/20")} />
            ))}
            <span className="text-xs text-muted-foreground ml-2 font-mono">Step {currentStep}/5</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 flex-1">

          {/* LEFT PANEL: The Forge (Form) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-muted/50 shadow-sm relative overflow-hidden">
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                  <h3 className="font-bold text-lg">Analyzing Document...</h3>
                  <p className="text-muted-foreground text-xs">Extracting metadata and generating preview.</p>
                </div>
              )}

              <CardContent className="p-6 sm:p-8 min-h-[400px]">

                {/* STEP 1: MAGIC UPLOAD */}
                {currentStep === 1 && (
                  <div className="h-full flex flex-col justify-center text-center space-y-8 animate-in slide-in-from-right-4">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">First, let's get your file.</h2>
                      <p className="text-muted-foreground">We'll analyze it to auto-fill details.</p>
                    </div>

                    <div className={cn(
                      "border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer group hover:bg-muted/50",
                      formData.file ? "border-accent/50 bg-accent/5" : "border-border"
                    )}>
                      <input type="file" id="file-first" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                      <label htmlFor="file-first" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        {formData.file ? (
                          <>
                            <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4 shadow-sm">
                              <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-lg text-accent text-center px-4 line-clamp-2 break-all max-w-full">{formData.file.name}</h3>
                            <p className="text-xs text-accent/80 mb-6">{(formData.file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze</p>
                            <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); setFormData({ ...formData, file: null }) }} className="border-accent/20 hover:bg-accent/10 text-accent">Change File</Button>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <Upload className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-lg mb-1">Drop your brilliance here</h3>
                            <p className="text-xs text-muted-foreground mb-6">PDF or DOCX (Max 50MB)</p>
                            <div className={cn(buttonVariants({ size: 'sm' }), "pointer-events-none")}>Select Document</div>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 2: BASIC DETAILS */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Info className="w-5 h-5 text-primary" /></div>
                      <div><h2 className="text-lg font-bold">The Basics</h2><p className="text-xs text-muted-foreground">Categorize your knowledge.</p></div>
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Advanced Calculus Notes" className="h-10 border-primary/20 focus:border-primary bg-primary/5 font-medium" />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Category</Label>
                          <Select value={formData.categoryId} onValueChange={v => setFormData({ ...formData, categoryId: v })}>
                            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Subject</Label>
                          <Input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g. Mathematics" />
                        </div>
                      </div>

                      {/* Quick Optional Fields Accordion style */}
                      <div className="pt-4 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-3">Optional Details (Increases visibility)</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5"><Label className="text-xs">University</Label><Select value={formData.universityId} onValueChange={v => setFormData({ ...formData, universityId: v })}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{universities.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select></div>
                          <div className="space-y-1.5"><Label className="text-xs">Degree</Label><Select value={formData.degree} onValueChange={v => setFormData({ ...formData, degree: v })}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{degrees.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: DESCRIPTION & MEDIA */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4">
                    {/* Description Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-primary" /></div>
                        <div><h2 className="text-lg font-bold">Describe It</h2></div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label>Core Description</Label>
                          <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} placeholder="What topics are covered? Why is this useful?" className="resize-none" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Table of Contents</Label>
                          <Textarea value={formData.tableOfContents} onChange={e => setFormData({ ...formData, tableOfContents: e.target.value })} rows={3} placeholder="Chapter 1...&#10;Chapter 2..." className="resize-none font-mono text-xs" />
                        </div>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="h-px bg-border/50" />

                    {/* Media Section (RESTORED) */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center"><ImageIcon className="w-4 h-4 text-secondary" /></div>
                        <div>
                          <h2 className="text-lg font-bold">Visuals</h2>
                          <p className="text-xs text-muted-foreground">Add a cover or preview pages to boost sales.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Cover Image Upload */}
                        <div className="space-y-2">
                          <Label className="text-xs">Cover Image</Label>
                          <div className="border border-dashed rounded-lg p-2 hover:bg-muted/50 transition-colors text-center cursor-pointer relative overflow-hidden group">
                            <input type="file" id="cover-upload" className="hidden" accept="image/*" onChange={handleCoverImageChange} />
                            <label htmlFor="cover-upload" className="cursor-pointer block">
                              {formData.coverImage ? (
                                <img src={formData.coverImage} className="w-full h-24 object-cover rounded" />
                              ) : (
                                <div className="h-24 flex flex-col items-center justify-center text-muted-foreground">
                                  <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                                  <span className="text-xs">Upload Cover</span>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>

                        {/* Preview Pages Upload */}
                        <div className="space-y-2">
                          <Label className="text-xs">Preview Pages ({formData.previewPages.length}/6)</Label>
                          <div className="border border-dashed rounded-lg p-2 hover:bg-muted/50 transition-colors text-center cursor-pointer relative">
                            <input type="file" id="preview-upload" className="hidden" multiple accept="image/*" onChange={handlePreviewUpload} />
                            <label htmlFor="preview-upload" className="cursor-pointer h-24 flex flex-col items-center justify-center text-muted-foreground">
                              <Images className="w-6 h-6 mb-1 opacity-50" />
                              <span className="text-xs">Add Pages</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: SMART PRICING */}
                {currentStep === 4 && (
                  <div className="space-y-8 animate-in slide-in-from-right-4">
                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-bold">Value Your Work</h2>
                      <p className="text-muted-foreground text-xs">Notes in <span className="font-semibold text-foreground">{selectedCategoryName || 'this category'}</span> usually sell for <span className="text-accent font-bold">₹250 - ₹500</span>.</p>
                    </div>

                    <div className="max-w-md mx-auto space-y-8">
                      <div className="relative flex items-center justify-center">
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            if (val < 0) return;
                            if (val > 9999) return;
                            setFormData({ ...formData, price: e.target.value })
                          }}
                          className="!text-3xl sm:!text-4xl text-center font-bold h-20 border-border/50 bg-background shadow-lg rounded-xl px-12 focus:ring-4 ring-primary/10 transition-all placeholder:text-muted/20 tracking-tight"
                          placeholder="0"
                        />
                        <IndianRupee className="absolute left-4 w-6 h-6 text-muted-foreground" />
                      </div>

                      {/* Revenue Simulator Badge */}
                      {priceValue > 0 && (
                        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center animate-in zoom-in">
                          <p className="text-xs text-accent font-medium uppercase tracking-wide mb-1">Projected Earnings</p>
                          <div className="text-2xl font-bold text-accent">₹{(earnings * 10).toFixed(0)}</div>
                          <p className="text-xs text-accent/80">if 10 students buy this</p>
                        </div>
                      )}

                      <div className="space-y-1 pt-4">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Free</span>
                          <span>Premium (₹5k)</span>
                        </div>
                        <input
                          type="range"
                          min="0" max="1000" step="10"
                          value={priceValue}
                          onChange={e => setFormData({ ...formData, price: e.target.value })}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: LAUNCH PAD */}
                {currentStep === 5 && (
                  <div className="text-center space-y-8 animate-in zoom-in duration-500 py-8">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-glow animate-pulse">
                      <Rocket className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Ready for Liftoff?</h2>
                      <p className="text-muted-foreground max-w-sm mx-auto">You're about to publish <strong>{formData.title}</strong> to the marketplace.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-xs text-left bg-muted/30 p-4 rounded-xl border border-border/50">
                      <div>
                        <span className="text-muted-foreground text-xs block">Price</span>
                        <span className="font-semibold">{priceValue > 0 ? `₹${priceValue}` : 'Free'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Earnings/Sale</span>
                        <span className="font-semibold text-accent">{priceValue > 0 ? `₹${earnings.toFixed(0)}` : '₹0'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Category</span>
                        <span className="font-semibold truncate">{selectedCategoryName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">File</span>
                        <span className="font-semibold truncate">{formData.file?.name.substring(0, 15)}...</span>
                      </div>
                    </div>
                  </div>
                )}

              </CardContent>

              {/* Footer Controls */}
              <CardFooter className="flex justify-between p-6 bg-muted/20 border-t border-border/50">
                <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1 || isUploading} className="text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                {currentStep === 5 ? (
                  <Button onClick={handlePublish} disabled={isPublishing} className="bg-primary hover:bg-primary/90 min-w-[140px] shadow-lg shadow-primary/25">
                    {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Rocket className="w-4 h-4 mr-2" /> Launch</>}
                  </Button>
                ) : (
                  <Button onClick={handleNext} disabled={!canProceed() || isUploading} className="min-w-[120px]">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Next <ChevronRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* RIGHT PANEL: Live Preview (The Mirror) */}
          <div className="hidden lg:block lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between text-muted-foreground">
              <h3 className="text-xs font-medium flex items-center gap-2"><Eye className="w-4 h-4" /> Live Preview</h3>
              <span className="text-xs">What buyers see</span>
            </div>
            <NoteCardPreview data={formData} categoryName={selectedCategoryName} />

            {/* Pro Tips based on context */}
            <Card className="bg-warning/5 border-warning/10">
              <CardContent className="p-4 flex gap-3">
                <Zap className="w-5 h-5 text-warning shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-warning">Pro Tip</p>
                  <p className="text-xs text-warning/80 leading-relaxed">
                    {currentStep === 1 ? "High-quality PDFs with OCR get 2x more search hits." :
                      currentStep === 3 ? "Detailed descriptions reduce refund requests by 40%." :
                        currentStep === 4 ? "Notes priced under ₹300 sell 5x volume." :
                          "Great titles are specific. Mention the Professor or Exam."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </SellerLayout>
  );
}
