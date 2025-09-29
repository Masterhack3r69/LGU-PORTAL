const Notification = require("../models/Notification");
const { pool } = require("../config/database");

class NotificationService {
  constructor() {
    this.notificationTypes = {
      LEAVE_SUBMITTED: "leave_submitted",
      LEAVE_APPROVED: "leave_approved",
      LEAVE_REJECTED: "leave_rejected",
      PAYROLL_GENERATED: "payroll_generated",
      BENEFIT_PROCESSED: "benefit_processed",
      TRAINING_ASSIGNED: "training_assigned",
      DOCUMENT_UPLOADED: "document_uploaded",
      SYSTEM_ANNOUNCEMENT: "system_announcement",
      REMINDER: "reminder",
    };

    this.priorities = {
      LOW: "LOW",
      MEDIUM: "MEDIUM",
      HIGH: "HIGH",
      URGENT: "URGENT",
    };
  }

  // Create a single notification
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      return await notification.create();
    } catch (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Send leave-related notifications
  async sendLeaveNotification(leaveData, type, recipientIds = []) {
    try {
      const notifications = [];

      for (const userId of recipientIds) {
        let title,
          message,
          priority = this.priorities.MEDIUM;

        switch (type) {
          case this.notificationTypes.LEAVE_SUBMITTED:
            title = "New Leave Application Submitted";
            message = `${leaveData.employee_name} has submitted a leave application for ${leaveData.leave_type} from ${leaveData.start_date} to ${leaveData.end_date}`;
            priority = this.priorities.HIGH;
            break;

          case this.notificationTypes.LEAVE_APPROVED:
            title = "Leave Application Approved";
            message = `Your leave application for ${leaveData.leave_type} from ${leaveData.start_date} to ${leaveData.end_date} has been approved`;
            priority = this.priorities.HIGH;
            break;

          case this.notificationTypes.LEAVE_REJECTED:
            title = "Leave Application Rejected";
            message = `Your leave application for ${leaveData.leave_type} from ${leaveData.start_date} to ${leaveData.end_date} has been rejected`;
            priority = this.priorities.HIGH;
            break;
        }

        notifications.push({
          user_id: userId,
          type,
          title,
          message,
          priority,
          reference_type: "leave_application",
          reference_id: leaveData.id,
          metadata: {
            employee_id: leaveData.employee_id,
            leave_type: leaveData.leave_type,
            start_date: leaveData.start_date,
            end_date: leaveData.end_date,
          },
        });
      }

      if (notifications.length > 0) {
        return await Notification.bulkCreate(notifications);
      }
    } catch (error) {
      throw new Error(`Failed to send leave notification: ${error.message}`);
    }
  }

  // Send payroll notifications
  async sendPayrollNotification(payrollData, recipientIds = []) {
    try {
      const notifications = recipientIds.map((userId) => ({
        user_id: userId,
        type: this.notificationTypes.PAYROLL_GENERATED,
        title: "Payroll Generated",
        message: `Your payroll for ${payrollData.period_name} has been generated and is ready for review`,
        priority: this.priorities.MEDIUM,
        reference_type: "payroll_period",
        reference_id: payrollData.period_id,
        metadata: {
          period_name: payrollData.period_name,
          employee_id: payrollData.employee_id,
        },
      }));

      if (notifications.length > 0) {
        return await Notification.bulkCreate(notifications);
      }
    } catch (error) {
      throw new Error(`Failed to send payroll notification: ${error.message}`);
    }
  }

  // Send benefit processing notifications
  async sendBenefitNotification(benefitData, recipientIds = []) {
    try {
      const notifications = recipientIds.map((userId) => ({
        user_id: userId,
        type: this.notificationTypes.BENEFIT_PROCESSED,
        title: "Benefit Processed",
        message: `Your ${
          benefitData.benefit_type
        } benefit has been processed. Amount: ₱${benefitData.amount.toLocaleString()}`,
        priority: this.priorities.MEDIUM,
        reference_type: "compensation_benefit",
        reference_id: benefitData.id,
        metadata: {
          benefit_type: benefitData.benefit_type,
          amount: benefitData.amount,
          employee_id: benefitData.employee_id,
        },
      }));

      if (notifications.length > 0) {
        return await Notification.bulkCreate(notifications);
      }
    } catch (error) {
      throw new Error(`Failed to send benefit notification: ${error.message}`);
    }
  }

  // Send system announcements
  async sendSystemAnnouncement(
    title,
    message,
    recipientIds = [],
    priority = this.priorities.MEDIUM
  ) {
    try {
      const notifications = recipientIds.map((userId) => ({
        user_id: userId,
        type: this.notificationTypes.SYSTEM_ANNOUNCEMENT,
        title,
        message,
        priority,
        reference_type: "system",
        reference_id: null,
        metadata: null,
      }));

      if (notifications.length > 0) {
        return await Notification.bulkCreate(notifications);
      }
    } catch (error) {
      throw new Error(`Failed to send system announcement: ${error.message}`);
    }
  }

  // Send training notifications
  async sendTrainingNotification(trainingData, recipientIds = []) {
    try {
      const notifications = recipientIds.map((userId) => ({
        user_id: userId,
        type: this.notificationTypes.TRAINING_ASSIGNED,
        title: "Training Program Assigned",
        message: `You have been assigned to the training program: ${trainingData.program_name}. Start date: ${trainingData.start_date}`,
        priority: this.priorities.MEDIUM,
        reference_type: "training",
        reference_id: trainingData.id,
        metadata: {
          program_name: trainingData.program_name,
          start_date: trainingData.start_date,
          employee_id: trainingData.employee_id,
        },
      }));

      if (notifications.length > 0) {
        return await Notification.bulkCreate(notifications);
      }
    } catch (error) {
      throw new Error(`Failed to send training notification: ${error.message}`);
    }
  }

  // Get notifications for user
  async getUserNotifications(userId, options = {}) {
    try {
      return await Notification.findByUserId(userId, options);
    } catch (error) {
      throw new Error(`Failed to get user notifications: ${error.message}`);
    }
  }

  // Get unread count for user
  async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error("Notification not found");
      }
      return await notification.markAsRead();
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    try {
      return await Notification.markAllAsRead(userId);
    } catch (error) {
      throw new Error(
        `Failed to mark all notifications as read: ${error.message}`
      );
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      return await Notification.delete(notificationId);
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  // Get admin users for notifications
  async getAdminUsers() {
    const { executeQuery } = require('../config/database');
    
    try {
      const query = `
                SELECT u.id, e.first_name, e.last_name, u.email
                FROM users u
                LEFT JOIN employees e ON e.user_id = u.id
                WHERE u.role = 'admin' AND u.is_active = 1
            `;

      const result = await executeQuery(query);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    } catch (error) {
      throw new Error(`Failed to get admin users: ${error.message}`);
    }
  }

  // Get HR users for notifications
  async getHRUsers() {
    const { executeQuery } = require('../config/database');
    
    try {
      const query = `
                SELECT u.id, e.first_name, e.last_name, u.email
                FROM users u
                LEFT JOIN employees e ON e.user_id = u.id
                WHERE u.role IN ('admin', 'hr') AND u.is_active = 1
            `;

      const result = await executeQuery(query);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    } catch (error) {
      throw new Error(`Failed to get HR users: ${error.message}`);
    }
  }

  // Clean old notifications
  async cleanOldNotifications(daysOld = 90) {
    try {
      return await Notification.cleanOldNotifications(daysOld);
    } catch (error) {
      throw new Error(`Failed to clean old notifications: ${error.message}`);
    }
  }
}

module.exports = new NotificationService();
