import api from "./api";

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  reference_type?: string;
  reference_id?: number;
  metadata?: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
  priority?: string;
}

class NotificationService {
  // Get user notifications
  async getNotifications(
    filters: NotificationFilters = {}
  ): Promise<NotificationResponse> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get<{
        success: boolean;
        data: NotificationResponse;
      }>(`/notifications?${params.toString()}`);

      // Backend returns: { success: true, data: { notifications: [], pagination: {} } }
      // We need to extract the data property
      return (
        response.data || {
          notifications: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        }
      );
    } catch (error) {
      console.error("Error in getNotifications:", error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    const response = await api.get<{
      success: boolean;
      data: { count: number };
    }>("/notifications/unread-count");
    return response.data?.count || 0;
  }

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<Notification> {
    const response = await api.patch<{
      success: boolean;
      data: Notification;
    }>(`/notifications/${notificationId}/read`);
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<number> {
    const response = await api.patch<{
      success: boolean;
      data: { affectedRows: number };
    }>("/notifications/mark-all-read");
    return response.data?.affectedRows || 0;
  }

  // Delete notification
  async deleteNotification(notificationId: number): Promise<boolean> {
    const response = await api.delete<{
      success: boolean;
    }>(`/notifications/${notificationId}`);
    return response.success || false;
  }

  // Create system announcement (admin only)
  async createAnnouncement(data: {
    title: string;
    message: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    recipientIds?: number[];
  }): Promise<{ recipientCount: number }> {
    const response = await api.post<{
      success: boolean;
      data: { recipientCount: number };
    }>("/notifications/announcements", data);
    return response.data;
  }

  // Get notification statistics (admin only)
  async getNotificationStats(): Promise<{
    typeStats: Array<{ type: string; type_count: number }>;
    recentActivity: Array<{ date: string; count: number }>;
  }> {
    const response = await api.get<{
      success: boolean;
      data: {
        typeStats: Array<{ type: string; type_count: number }>;
        recentActivity: Array<{ date: string; count: number }>;
      };
    }>("/notifications/stats");
    return response.data;
  }

  // Clean old notifications (admin only)
  async cleanOldNotifications(daysOld: number = 90): Promise<number> {
    const response = await api.post<{
      success: boolean;
      data: { deletedCount: number };
    }>("/notifications/clean", { daysOld });
    return response.data?.deletedCount || 0;
  }

  // Create test notification (admin only)
  async createTestNotification(): Promise<boolean> {
    const response = await api.post<{
      success: boolean;
    }>("/notifications/test");
    return response.success || false;
  }

  // Test notification for specific employee (admin only)
  async testEmployeeNotification(
    employeeId: number,
    notificationType: string = "system_announcement"
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    const response = await api.post<{
      success: boolean;
      message: string;
      data?: any;
    }>("/notifications/test-employee", {
      employee_id: employeeId,
      notification_type: notificationType,
    });
    return response;
  }

  // Get notification type display name
  getTypeDisplayName(type: string): string {
    const typeMap: Record<string, string> = {
      leave_submitted: "Leave Application",
      leave_approved: "Leave Approved",
      leave_rejected: "Leave Rejected",
      payroll_generated: "Payroll Generated",
      payroll_finalized: "Payroll Finalized",
      payroll_paid: "Payroll Paid",
      benefit_processed: "Benefit Processed",
      training_assigned: "Training Assigned",
      document_uploaded: "Document Uploaded",
      document_approval_request: "Document Approval",
      document_approved: "Document Approved",
      document_rejected: "Document Rejected",
      system_announcement: "System Announcement",
      reminder: "Reminder",
    };

    return (
      typeMap[type] ||
      type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  }

  // Get priority color class
  getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
      LOW: "text-blue-600 bg-blue-50",
      MEDIUM: "text-yellow-600 bg-yellow-50",
      HIGH: "text-orange-600 bg-orange-50",
      URGENT: "text-red-600 bg-red-50",
    };

    return colorMap[priority] || "text-gray-600 bg-gray-50";
  }

  // Get notification icon
  getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      leave_submitted: "📝",
      leave_approved: "✅",
      leave_rejected: "❌",
      payroll_generated: "💰",
      payroll_finalized: "🔒",
      payroll_paid: "💳",
      benefit_processed: "🎁",
      training_assigned: "📚",
      document_uploaded: "📄",
      document_approval_request: "📤",
      document_approved: "✅",
      document_rejected: "❌",
      system_announcement: "📢",
      reminder: "⏰",
    };

    return iconMap[type] || "📋";
  }

  // Get notification color theme
  getNotificationTheme(type: string): {
    bg: string;
    text: string;
    border: string;
  } {
    const themeMap: Record<
      string,
      { bg: string; text: string; border: string }
    > = {
      leave_submitted: {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        text: "text-orange-700 dark:text-orange-300",
        border: "border-orange-200 dark:border-orange-800",
      },
      leave_approved: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-200 dark:border-green-800",
      },
      leave_rejected: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
      },
      payroll_generated: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
      },
      payroll_finalized: {
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200 dark:border-emerald-800",
      },
      payroll_paid: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-200 dark:border-green-800",
      },
      benefit_processed: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        text: "text-purple-700 dark:text-purple-300",
        border: "border-purple-200 dark:border-purple-800",
      },
      training_assigned: {
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        text: "text-indigo-700 dark:text-indigo-300",
        border: "border-indigo-200 dark:border-indigo-800",
      },
      document_uploaded: {
        bg: "bg-gray-50 dark:bg-gray-900/20",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-800",
      },
      document_approval_request: {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        text: "text-orange-700 dark:text-orange-300",
        border: "border-orange-200 dark:border-orange-800",
      },
      document_approved: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-200 dark:border-green-800",
      },
      document_rejected: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
      },
      system_announcement: {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        text: "text-yellow-700 dark:text-yellow-300",
        border: "border-yellow-200 dark:border-yellow-800",
      },
      reminder: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
      },
    };

    return (
      themeMap[type] || {
        bg: "bg-gray-50 dark:bg-gray-900/20",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-800",
      }
    );
  }

  // Format relative time
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export default new NotificationService();
