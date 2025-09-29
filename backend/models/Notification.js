 const { pool } = require('../config/database');

class Notification {
    constructor(data = {}) {
        this.id = data.id || null;
        this.user_id = data.user_id || null;
        this.type = data.type || null;
        this.title = data.title || null;
        this.message = data.message || null;
        this.priority = data.priority || 'MEDIUM';
        this.reference_type = data.reference_type || null;
        this.reference_id = data.reference_id || null;
        this.metadata = data.metadata || null;
        this.is_read = data.is_read || false;
        this.read_at = data.read_at || null;
        this.created_at = data.created_at || null;
    }

    // Create new notification
    async create() {
        const { executeQuery } = require('../config/database');
        
        try {
            const query = `
                INSERT INTO notifications (
                    user_id, type, title, message, priority, 
                    reference_type, reference_id, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await executeQuery(query, [
                this.user_id,
                this.type,
                this.title,
                this.message,
                this.priority,
                this.reference_type,
                this.reference_id,
                this.metadata ? JSON.stringify(this.metadata) : null
            ]);

            if (!result.success) {
                throw new Error(result.error);
            }

            this.id = result.data.insertId;
            return this;
        } catch (error) {
            throw new Error(`Failed to create notification: ${error.message}`);
        }
    }

    // Mark notification as read
    async markAsRead() {
        const { executeQuery } = require('../config/database');
        
        try {
            const query = `
                UPDATE notifications 
                SET is_read = 1, read_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            
            const result = await executeQuery(query, [this.id]);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            this.is_read = true;
            this.read_at = new Date();
            return this;
        } catch (error) {
            throw new Error(`Failed to mark notification as read: ${error.message}`);
        }
    }

    // Static methods

    // Find notification by ID
    static async findById(id) {
        const { findOne } = require('../config/database');
        
        try {
            const query = `
                SELECT n.*, e.first_name, e.last_name, u.email
                FROM notifications n
                LEFT JOIN users u ON n.user_id = u.id
                LEFT JOIN employees e ON e.user_id = u.id
                WHERE n.id = ?
            `;
            
            const result = await findOne(query, [id]);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            if (!result.data) {
                return null;
            }

            return new Notification(result.data);
        } catch (error) {
            throw new Error(`Failed to find notification: ${error.message}`);
        }
    }

    // Get notifications for user with pagination
    static async findByUserId(userId, options = {}) {
        const { executeQuery } = require('../config/database');
        
        try {
            const {
                page = 1,
                limit = 20,
                unreadOnly = false,
                type = null,
                priority = null
            } = options;

            const offset = (page - 1) * limit;
            let whereConditions = ['n.user_id = ?'];
            let params = [userId];

            if (unreadOnly) {
                whereConditions.push('n.is_read = 0');
            }

            if (type) {
                whereConditions.push('n.type = ?');
                params.push(type);
            }

            if (priority) {
                whereConditions.push('n.priority = ?');
                params.push(priority);
            }

            const whereClause = whereConditions.join(' AND ');

            const query = `
                SELECT n.*, e.first_name, e.last_name, u.email
                FROM notifications n
                LEFT JOIN users u ON n.user_id = u.id
                LEFT JOIN employees e ON e.user_id = u.id
                WHERE ${whereClause}
                ORDER BY n.created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
            
            const result = await executeQuery(query, params);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM notifications n
                WHERE ${whereClause}
            `;
            
            const countResult = await executeQuery(countQuery, params);
            
            if (!countResult.success) {
                throw new Error(countResult.error);
            }
            
            const total = countResult.data[0].total;

            return {
                notifications: result.data.map(row => new Notification(row)),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new Error(`Failed to get user notifications: ${error.message}`);
        }
    }

    // Get unread count for user
    static async getUnreadCount(userId) {
        const { findOne } = require('../config/database');
        
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM notifications
                WHERE user_id = ? AND is_read = 0
            `;
            
            const result = await findOne(query, [userId]);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            return result.data ? result.data.count || 0 : 0;
        } catch (error) {
            throw new Error(`Failed to get unread count: ${error.message}`);
        }
    }

    // Mark all notifications as read for user
    static async markAllAsRead(userId) {
        const { executeQuery } = require('../config/database');
        
        try {
            const query = `
                UPDATE notifications 
                SET is_read = 1, read_at = CURRENT_TIMESTAMP 
                WHERE user_id = ? AND is_read = 0
            `;
            
            const result = await executeQuery(query, [userId]);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            return result.data.affectedRows;
        } catch (error) {
            throw new Error(`Failed to mark all notifications as read: ${error.message}`);
        }
    }

    // Delete notification
    static async delete(id) {
        const { executeQuery } = require('../config/database');
        
        try {
            const query = 'DELETE FROM notifications WHERE id = ?';
            const result = await executeQuery(query, [id]);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            return result.data.affectedRows > 0;
        } catch (error) {
            throw new Error(`Failed to delete notification: ${error.message}`);
        }
    }

    // Bulk create notifications
    static async bulkCreate(notifications) {
        const { executeQuery } = require('../config/database');
        
        try {
            if (!notifications || notifications.length === 0) {
                return [];
            }

            // Create individual insert queries instead of bulk insert
            const results = [];
            for (const notif of notifications) {
                const query = `
                    INSERT INTO notifications (
                        user_id, type, title, message, priority, 
                        reference_type, reference_id, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const values = [
                    notif.user_id,
                    notif.type,
                    notif.title,
                    notif.message,
                    notif.priority || 'MEDIUM',
                    notif.reference_type || null,
                    notif.reference_id || null,
                    notif.metadata ? JSON.stringify(notif.metadata) : null
                ];

                const result = await executeQuery(query, values);
                
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                results.push(result.data.insertId);
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to bulk create notifications: ${error.message}`);
        }
    }

    // Clean old notifications (older than specified days)
    static async cleanOldNotifications(daysOld = 90) {
        const { executeQuery } = require('../config/database');
        
        try {
            const query = `
                DELETE FROM notifications 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            `;
            
            const result = await executeQuery(query, [daysOld]);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            return result.data.affectedRows;
        } catch (error) {
            throw new Error(`Failed to clean old notifications: ${error.message}`);
        }
    }
}

module.exports = Notification;