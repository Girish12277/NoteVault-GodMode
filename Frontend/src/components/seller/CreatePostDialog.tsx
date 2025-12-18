import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePlus, Link as LinkIcon, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface CreatePostDialogProps {
    onPostCreated: () => void;
    trigger?: React.ReactNode;
}

export function CreatePostDialog({ onPostCreated, trigger }: CreatePostDialogProps) {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image max size is 5MB');
                return;
            }
            setImage(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content && !image) {
            toast.error('Please add some text or an image');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('content', content);
            if (linkUrl) formData.append('linkUrl', linkUrl);
            if (image) formData.append('image', image); // Backend expects 'image' field

            await api.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // Axios handles this usually but good to be explicit or let strict mode handle
            });

            toast.success('Post created successfully!');
            setOpen(false);
            setContent('');
            setLinkUrl('');
            setImage(null);
            setPreviewUrl('');
            onPostCreated();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Create Post</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Textarea
                            placeholder="What's on your mind? Share updates, tips, or news..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[120px] resize-none text-base"
                        />
                    </div>

                    {previewUrl && (
                        <div className="relative rounded-lg overflow-hidden border border-border">
                            <img src={previewUrl} alt="Preview" className="w-full max-h-[200px] object-cover" />
                            <button
                                type="button"
                                onClick={() => { setImage(null); setPreviewUrl(''); }}
                                className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 shadow-sm hover:bg-destructive/90"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Add a link (optional)"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="pl-9 h-10"
                                />
                            </div>
                        </div>
                        <div>
                            <input
                                type="file"
                                id="post-image"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => document.getElementById('post-image')?.click()}>
                                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Posting...
                                </>
                            ) : (
                                'Post Update'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
