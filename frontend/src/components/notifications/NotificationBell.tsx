import { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { NotificationList } from './NotificationList';
import notificationService from '@/services/notificationService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      
      // Check if there are new notifications
      if (count > previousCount && previousCount > 0) {
        setHasNewNotification(true);
        // Reset animation after 3 seconds
        setTimeout(() => setHasNewNotification(false), 3000);
      }
      
      setPreviousCount(unreadCount);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationRead = () => {
    if (unreadCount > 0) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "relative transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20",
            hasNewNotification && "animate-bounce"
          )}
        >
          {unreadCount > 0 ? (
            <BellRing className={cn(
              "h-5 w-5 text-blue-600 dark:text-blue-400 transition-colors",
              hasNewNotification && "animate-pulse"
            )} />
          ) : (
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
          )}
          
          {unreadCount > 0 && (
            <Badge 
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-semibold",
                "bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-white dark:border-gray-900",
                "animate-in zoom-in-50 duration-200",
                hasNewNotification && "animate-pulse scale-110"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          
          {hasNewNotification && (
            <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-96 p-0 shadow-xl border-0 animate-in slide-in-from-top-2 duration-200"
        sideOffset={8}
      >
        <NotificationList 
          onNotificationRead={handleNotificationRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClose={() => setIsOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}