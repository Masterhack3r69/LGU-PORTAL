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

// Test notification for specific employee (admin only)
router.post('/test-employee', async (req, res) => {
    try {
        const { employee_id, notification_type = 'system_announcement' } = req.body;
        
        if (!employee_id) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }
        
        // Get employee user ID
        const { pool } = require('../config/database');
        const [employeeRows] = await pool.execute(
            'SELECT u.id, e.first_name, e.last_name FROM users u JOIN employees e ON e.user_id = u.id WHERE e.id = ? AND u.is_active = 1',
            [employee_id]
        );
        
        if (employeeRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found or no associated user account'
            });
        }
        
        const employee = employeeRows[0];
        const notificationService = require('../services/notificationService');
        
        // Create different types of test notifications
        const testNotifications = {
            'leave_approved': {
                title: 'Leave Application Approved',
                message: `Your leave application has been approved by the administrator.`,
                priority: 'HIGH'
            },
            'payroll_generated': {
                title: 'Payroll Generated',
                message: `Your payroll has been generated and is ready for review.`,
                priority: 'MEDIUM'
            },
            'benefit_processed': {
                title: 'Benefit Processed',
                message: `Your benefit has been processed successfully. Amount: ₱15,000.00`,
                priority: 'MEDIUM'
            },
            'system_announcement': {
                title: 'System Test Notification',
                message: `This is a test notification sent to ${employee.first_name} ${employee.last_name} to verify the notification system is working properly.`,
                priority: 'MEDIUM'
            }
        };
        
        const testData = testNotifications[notification_type] || testNotifications['system_announcement'];
        
        await notificationService.createNotification({
            user_id: employee.id,
            type: notification_type,
            title: testData.title,
            message: testData.message,
            priority: testData.priority,
            reference_type: 'test',
            reference_id: null,
            metadata: {
                test: true,
                employee_name: `${employee.first_name} ${employee.last_name}`
            }
        });
        
        res.json({
            success: true,
            message: `Test notification sent to ${employee.first_name} ${employee.last_name}`,
            data: {
                employee_name: `${employee.first_name} ${employee.last_name}`,
                notification_type,
                user_id: employee.id
            }
        });
    } catch (error) {
        console.error('Test employee notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create test notification',
            error: error.message
        });
    }
});

module.exports = router;