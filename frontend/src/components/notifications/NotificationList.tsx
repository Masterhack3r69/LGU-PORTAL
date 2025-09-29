import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  CheckCheck,
  Trash2,
  X,
  Clock,
  AlertCircle,
  Info,
  CheckCircle2,
  Zap,
} from "lucide-react";
import notificationService, {
  type Notification,
} from "@/services/notificationService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { JSX } from "react/jsx-runtime";

interface NotificationListProps {
  onNotificationRead?: () => void;
  onMarkAllAsRead?: () => void;
  onClose?: () => void;
}

export function NotificationList({
  onNotificationRead,
  onMarkAllAsRead,
  onClose,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (pageNum = 1, reset = true) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({
        page: pageNum,
        limit: 10,
      });

      if (reset) {
        setNotifications(response?.notifications || []);
      } else {
        setNotifications((prev) => [
          ...prev,
          ...(response?.notifications || []),
        ]);
      }

      setHasMore(pageNum < (response?.pagination?.totalPages || 0));
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return;

    try {
      await notificationService.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      onNotificationRead?.();
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      onMarkAllAsRead?.();
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {unreadCount} unread message{unreadCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 transition-colors"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-red-100 dark:hover:bg-red-900 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-96">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-muted-foreground">
                Loading notifications...
              </p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <AlertCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You're all caught up!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                index={index}
              />
            ))}

            {hasMore && (
              <div className="p-4 text-center border-t bg-gray-50 dark:bg-gray-800/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    "Load more notifications"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notification: Notification) => void;
  onDelete: (id: number) => void;
  index: number;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  index,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification);
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconMap: Record<string, JSX.Element> = {
      leave_submitted: <Clock className="h-4 w-4 text-orange-500" />,
      leave_approved: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      leave_rejected: <X className="h-4 w-4 text-red-500" />,
      payroll_generated: <Zap className="h-4 w-4 text-blue-500" />,
      benefit_processed: <CheckCircle2 className="h-4 w-4 text-purple-500" />,
      training_assigned: <Info className="h-4 w-4 text-indigo-500" />,
      document_uploaded: <Info className="h-4 w-4 text-gray-500" />,
      system_announcement: <AlertCircle className="h-4 w-4 text-yellow-500" />,
      reminder: <Clock className="h-4 w-4 text-blue-500" />,
    };

    return iconMap[type] || <Info className="h-4 w-4 text-gray-500" />;
  };

  const getPriorityStyles = (priority: string) => {
    const styles = {
      LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      URGENT: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    return styles[priority as keyof typeof styles] || styles.MEDIUM;
  };

  return (
    <div
      className={cn(
        "group relative p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-200 ease-in-out",
        !notification.is_read &&
          "bg-blue-50/30 dark:bg-blue-900/10 border-l-4 border-l-blue-500",
        "animate-in slide-in-from-top-2 duration-300"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "p-2 rounded-full transition-transform group-hover:scale-110",
            !notification.is_read
              ? "bg-white dark:bg-gray-800 shadow-sm"
              : "bg-gray-100 dark:bg-gray-700"
          )}
        >
          {getNotificationIcon(notification.type, notification.priority)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p
                  className={cn(
                    "text-sm font-medium text-gray-900 dark:text-white",
                    !notification.is_read && "font-semibold"
                  )}
                >
                  {notification.title}
                </p>
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {notification.message}
              </p>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full border-0",
                  getPriorityStyles(notification.priority)
                )}
              >
                {notification.priority}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0"
              >
                {notificationService.getTypeDisplayName(notification.type)}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {notificationService.formatRelativeTime(
                  notification.created_at
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
