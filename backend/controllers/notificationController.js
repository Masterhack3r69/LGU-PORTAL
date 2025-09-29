const notificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');

class NotificationController {
    // Get user notifications with pagination
    async getUserNotifications(req, res) {
        try {
            const userId = req.user.id;
            const {
                page = 1,
                limit = 20,
                unreadOnly = false,
                type = null,
                priority = null
            } = req.query;

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                unreadOnly: unreadOnly === 'true',
                type,
                priority
            };

            const result = await notificationService.getUserNotifications(userId, options);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error getting user notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notifications',
                error: error.message
            });
        }
    }

    // Get unread notification count
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const count = await notificationService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { count }
            });
        } catch (error) {
            console.error('Error getting unread count:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread count',
                error: error.message
            });
        }
    }

    // Mark notification as read
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const notification = await notificationService.markAsRead(id);

            res.json({
                success: true,
                data: notification,
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read',
                error: error.message
            });
        }
    }

    // Mark all notifications as read
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            const affectedRows = await notificationService.markAllAsRead(userId);

            res.json({
                success: true,
                data: { affectedRows },
                message: 'All notifications marked as read'
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all notifications as read',
                error: error.message
            });
        }
    }

    // Delete notification
    async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            const deleted = await notificationService.deleteNotification(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            res.json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete notification',
                error: error.message
            });
        }
    }

    // Create system announcement (admin only)
    async createAnnouncement(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { title, message, priority = 'MEDIUM', recipientIds } = req.body;

            // If no specific recipients, send to all active users
            let targetUserIds = recipientIds;
            if (!targetUserIds || targetUserIds.length === 0) {
                const { pool } = require('../config/database');
                const [users] = await pool.execute(
                    'SELECT id FROM users WHERE is_active = 1'
                );
                targetUserIds = users.map(user => user.id);
            }

            await notificationService.sendSystemAnnouncement(
                title,
                message,
                targetUserIds,
                priority
            );

            res.json({
                success: true,
                message: 'Announcement sent successfully',
                data: { recipientCount: targetUserIds.length }
            });
        } catch (error) {
            console.error('Error creating announcement:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create announcement',
                error: error.message
            });
        }
    }

    // Get notification statistics (admin only)
    async getNotificationStats(req, res) {
        try {
            const { pool } = require('../config/database');
            
            // Get notification statistics
            const [stats] = await pool.execute(`
                SELECT 
                    COUNT(*) as total_notifications,
                    SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_notifications,
                    COUNT(DISTINCT user_id) as users_with_notifications,
                    type,
                    COUNT(*) as type_count
                FROM notifications 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY type
                ORDER BY type_count DESC
            `);

            // Get recent activity
            const [recentActivity] = await pool.execute(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM notifications 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `);

            res.json({
                success: true,
                data: {
                    typeStats: stats,
                    recentActivity
                }
            });
        } catch (error) {
            console.error('Error getting notification stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notification statistics',
                error: error.message
            });
        }
    }

    // Clean old notifications (admin only)
    async cleanOldNotifications(req, res) {
        try {
            const { daysOld = 90 } = req.body;
            const deletedCount = await notificationService.cleanOldNotifications(daysOld);

            res.json({
                success: true,
                message: `Cleaned ${deletedCount} old notifications`,
                data: { deletedCount }
            });
        } catch (error) {
            console.error('Error cleaning old notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to clean old notifications',
                error: error.message
            });
        }
    }
}

module.exports = new NotificationController();