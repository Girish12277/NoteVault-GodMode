import { Post } from '@/types';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface PostCardProps {
    post: Post;
    onDelete?: (id: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(false); // Optimistic UI
    const [likes, setLikes] = useState(post.likes);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
        // TODO: Connect to backend like API
    };

    const handleDelete = async () => {
        try {
            if (!confirm('Are you sure you want to delete this post?')) return;
            await api.delete(`/posts/${post.id}`);
            toast.success('Post deleted');
            onDelete?.(post.id);
        } catch (error) {
            toast.error('Failed to delete post');
        }
    };

    return (
        <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0 pb-0">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={post.seller?.avatar || `https://ui-avatars.com/api/?name=${post.seller?.name || 'User'}`} />
                        <AvatarFallback>{post.seller?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-semibold leading-none">{post.seller?.name || 'Seller'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Date(post.createdAt).toLocaleDateString(undefined, {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
                {user?.id === post.sellerId && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Post
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                {post.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                )}
                {post.imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-border bg-muted/50">
                        <img src={post.imageUrl} alt="Post content" className="w-full h-auto max-h-[400px] object-cover" />
                    </div>
                )}
                {post.linkUrl && (
                    <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary truncate hover:underline bg-primary/5 p-2 rounded border border-primary/20">
                        {post.linkUrl}
                    </a>
                )}
            </CardContent>
            <CardFooter className="p-3 bg-muted/20 border-t border-border flex justify-between">
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={handleLike} className={`h-8 px-2 ${isLiked ? 'text-pink-500' : 'text-muted-foreground'}`}>
                        <Heart className={`mr-1.5 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="text-xs">{likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                        <MessageCircle className="mr-1.5 h-4 w-4" />
                        <span className="text-xs">Comment</span>
                    </Button>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
