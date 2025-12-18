import { useState } from 'react';
import { Bell, Check, X, Gift, ShoppingBag, MessageSquare, TrendingDown, Info, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Type definition based on backend response
interface Notification {
  id: string;
  type: string; // 'SYSTEM' | 'PURCHASE' | 'REFERRAL' | 'REVIEW' | 'WARNING'
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get auth state
  const { isAuthenticated } = useAuth();

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data.data.notifications;
    },
    // Only fetch if authenticated
    enabled: isAuthenticated,
    // Refresh every minute
    refetchInterval: 60000,
    retry: 1
  });

  // Mark single as read
  const { mutate: markRead } = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mark all as read
  const { mutate: markAllRead } = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    }
  });

  // Clear all notifications
  const clearAllNotifications = useMutation({
    mutationFn: async () => {
      await api.delete('/notifications');
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], []);
      toast.success('Notifications cleared');
    },
    onError: () => {
      toast.error('Failed to clear notifications');
    }
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to details page which will handle marking as read
    navigate(`/notifications/${notification.id}`);
    setOpen(false); // Close popover
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return <ShoppingBag className="h-4 w-4 text-accent" />;
      case 'REFERRAL':
        return <Gift className="h-4 w-4 text-warning" />;
      case 'PRICE_DROP':
        return <TrendingDown className="h-4 w-4 text-primary" />;
      case 'REVIEW':
        return <MessageSquare className="h-4 w-4 text-secondary" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'SYSTEM':
      default:
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => markAllRead()}
                className="h-6 w-6 text-muted-foreground hover:text-primary"
                title="Mark all read"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => clearAllNotifications.mutate()}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                title="Clear all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer relative ${!notification.isRead ? 'bg-primary/5' : ''
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNotificationClick(notification);
                  }}
                >
                  <div className="grid grid-cols-[2rem_1fr_0.5rem] gap-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight truncate">{notification.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 break-all whitespace-pre-wrap">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-primary"
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
