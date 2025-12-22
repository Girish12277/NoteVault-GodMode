import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, GraduationCap, Calendar, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatUserProfileProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    hideCloseButton?: boolean;
}

interface ChatProfileData {
    user_id: string;
    display_name: string;
    avatar_url: string;
    role: string;
    email: string | null;
    university: { id: string; name: string } | null;
    joined_at: string;
    trust_flags: {
        email_verified: boolean;
        student_verified: boolean;
    };
}

export function ChatUserProfile({ userId, isOpen, onClose, ...props }: ChatUserProfileProps) {

    // Lazy Load: Only fetch if panel is open and userId is present
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['chat-profile', userId],
        queryFn: async () => {
            const { data } = await api.get(`/users/${userId}/chat-profile`);
            return data.data as ChatProfileData;
        },
        enabled: isOpen && !!userId,
        staleTime: 1000 * 60 * 5, // Cache for 5 mins
        retry: 1
    });

    if (!isOpen) return null;

    return (
        <div className="w-80 border-l border-border h-full flex flex-col bg-background animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-lg">Contact Info</h3>
                {!props.hideCloseButton && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <span className="sr-only">Close</span>
                        ✕
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 flex flex-col items-center text-center">
                    {/* Avatar & Name Section */}
                    {isLoading ? (
                        <>
                            <Skeleton className="h-24 w-24 rounded-full mb-4" />
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-20" />
                        </>
                    ) : error ? (
                        <div className="flex flex-col items-center text-destructive py-8">
                            <AlertCircle className="h-10 w-10 mb-2" />
                            <p className="text-sm font-medium">Failed to load profile</p>
                            <Button variant="link" onClick={() => refetch()} size="sm">Retry</Button>
                        </div>
                    ) : data ? (
                        <>
                            <Avatar className="h-24 w-24 mb-4 border-2 border-border shadow-sm">
                                <AvatarImage src={data.avatar_url} />
                                <AvatarFallback className="text-2xl">{data.display_name?.[0]}</AvatarFallback>
                            </Avatar>

                            <h2 className="text-xl font-bold text-foreground">{data.display_name}</h2>
                            <Badge variant={data.role === 'seller' ? 'default' : 'secondary'} className="mt-2 capitalize">
                                {data.role}
                            </Badge>

                            {/* Trust Signals */}
                            <div className="mt-6 w-full space-y-4 text-left">
                                <Separator />

                                {/* Email / Contact */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                                        <Mail className="h-4 w-4" />
                                        <span>Email Address</span>
                                    </div>
                                    {data.email ? (
                                        <p className="text-sm font-medium pl-6 text-foreground break-all">
                                            {data.email}
                                            {data.trust_flags.email_verified && (
                                                <CheckCircle2 className="inline ml-2 h-3 w-3 text-green-500" />
                                            )}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic pl-6">Not shared</p>
                                    )}
                                </div>

                                {/* University */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                                        <GraduationCap className="h-4 w-4" />
                                        <span>University</span>
                                    </div>
                                    {data.university ? (
                                        <div className="pl-6">
                                            <p className="text-sm font-medium text-foreground">{data.university.name}</p>
                                            {data.trust_flags.student_verified && (
                                                <Badge variant="outline" className="text-xs h-5 mt-1 text-green-600 border-green-200 bg-green-50">
                                                    Verified Student
                                                </Badge>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic pl-6">Not provided</p>
                                    )}
                                </div>

                                {/* Join Date */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                                        <Calendar className="h-4 w-4" />
                                        <span>Member Since</span>
                                    </div>
                                    <p className="text-sm font-medium pl-6 text-foreground">
                                        {new Date(data.joined_at).toLocaleDateString('en-US', {
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>

                                {/* Security Note */}
                                <div className="rounded-lg bg-blue-50/50 p-3 mt-4 border border-blue-100">
                                    <div className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-semibold text-blue-900">End-to-End Encrypted</p>
                                            <p className="text-xs text-blue-700">
                                                Messages are private. Never share your password or payment info.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </ScrollArea>
        </div>
    );
}
