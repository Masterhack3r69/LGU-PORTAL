const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware.requireAuth);

// Get user notifications
router.get('/', notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Admin routes
router.use(authMiddleware.authorizeRoles(['admin']));

// Create system announcement
router.post('/announcements', [
    body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 255 })
        .withMessage('Title must not exceed 255 characters'),
    body('message')
        .notEmpty()
        .withMessage('Message is required'),
    body('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
        .withMessage('Invalid priority level'),
    body('recipientIds')
        .optional()
        .isArray()
        .withMessage('Recipient IDs must be an array')
], notificationController.createAnnouncement);

// Get notification statistics
router.get('/stats', notificationController.getNotificationStats);

// Clean old notifications
router.post('/clean', [
    body('daysOld')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Days old must be a positive integer')
], notificationController.cleanOldNotifications);

// Test notification creation (admin only)
router.post('/test', async (req, res) => {
    try {
        const currentUser = req.user;
        
        // Create a test notification for the current user
        const notificationService = require('../services/notificationService');
        await notificationService.createNotification({
            user_id: currentUser.id,
            type: 'system_announcement',
            title: 'Test Notification',
            message: 'This is a test notification to verify the system is working.',
            priority: 'MEDIUM',
            reference_type: 'system',
            reference_id: null,
            metadata: null
        });
        
        res.json({
            success: true,
            message: 'Test notification created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create test notification',
            error: error.message
        });
    }
});

module.exports = router;