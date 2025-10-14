// jobs/dtrFileCleanupJob.js - DTR File Cleanup Job
const cron = require('node-cron');
const dtrFileStorage = require('../utils/dtrFileStorage');
const { executeQuery } = require('../config/database');

/**
 * DTR File Cleanup Job
 * Automatically cleans up old DTR import files based on retention policy (90 days)
 */
class DTRFileCleanupJob {
    constructor() {
        this.isRunning = false;
        this.lastRun = null;
        this.cleanupHistory = [];
    }

    /**
     * Run cleanup for old DTR files
     * @returns {Promise<Object>} Cleanup result
     */
    async runCleanup() {
        if (this.isRunning) {
            return {
                success: false,
                error: 'Cleanup job is already running'
            };
        }

        this.isRunning = true;
        const startTime = new Date();

        try {
            console.log('🧹 Starting DTR file cleanup job...');

            // Run the cleanup
            const cleanupResult = await dtrFileStorage.cleanupOldFiles();

            if (!cleanupResult.success) {
                console.error('❌ DTR file cleanup failed:', cleanupResult.error);
                return cleanupResult;
            }

            // Log the cleanup operation
            await this.logCleanupOperation(cleanupResult);

            // Record cleanup history
            const endTime = new Date();
            const historyEntry = {
                run_date: startTime,
                end_date: endTime,
                duration_ms: endTime - startTime,
                ...cleanupResult
            };

            this.cleanupHistory.push(historyEntry);
            this.lastRun = endTime;

            console.log(`✅ DTR file cleanup completed successfully`);
            console.log(`   Files deleted: ${cleanupResult.deletedCount}`);
            console.log(`   Space freed: ${cleanupResult.deletedSizeFormatted}`);
            console.log(`   Retention period: ${cleanupResult.retentionDays} days`);
            console.log(`   Cutoff date: ${cleanupResult.cutoffDate}`);

            if (cleanupResult.errors && cleanupResult.errors.length > 0) {
                console.warn(`⚠️  Some files could not be deleted: ${cleanupResult.errors.length} errors`);
            }

            return {
                success: true,
                data: cleanupResult
            };
        } catch (error) {
            console.error('💥 DTR file cleanup job crashed:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Log cleanup operation to audit logs
     * @param {Object} cleanupResult - Cleanup result
     */
    async logCleanupOperation(cleanupResult) {
        try {
            const auditQuery = `
                INSERT INTO audit_logs (
                    user_id, 
                    action, 
                    table_name, 
                    record_id, 
                    old_values, 
                    new_values, 
                    ip_address, 
                    user_agent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const auditParams = [
                1, // System user ID (assuming 1 is the admin/system user)
                'DTR_FILE_CLEANUP',
                'dtr_import_batches',
                null,
                null,
                JSON.stringify({
                    deleted_count: cleanupResult.deletedCount,
                    deleted_size: cleanupResult.deletedSize,
                    deleted_size_formatted: cleanupResult.deletedSizeFormatted,
                    retention_days: cleanupResult.retentionDays,
                    cutoff_date: cleanupResult.cutoffDate,
                    errors: cleanupResult.errors
                }),
                '127.0.0.1', // System IP
                'DTR File Cleanup Job'
            ];

            await executeQuery(auditQuery, auditParams);
        } catch (error) {
            console.error('Failed to log cleanup operation:', error);
        }
    }

    /**
     * Get storage statistics
     * @returns {Promise<Object>} Storage statistics
     */
    async getStorageStatistics() {
        try {
            const stats = await dtrFileStorage.getStorageStatistics();
            return stats;
        } catch (error) {
            console.error('Error getting storage statistics:', error);
            return {
                success: false,
                error: 'Failed to get storage statistics',
                details: error.message
            };
        }
    }

    /**
     * Get job status
     * @returns {Object} Job status
     */
    getStatus() {
        return {
            success: true,
            data: {
                is_running: this.isRunning,
                last_run: this.lastRun,
                cleanup_history: this.cleanupHistory.slice(-10), // Last 10 runs
                next_scheduled_run: this.getNextRunDate(),
                retention_days: dtrFileStorage.retentionDays
            }
        };
    }

    /**
     * Calculate next scheduled run date (every Sunday at 3:00 AM)
     * @returns {Date} Next run date
     */
    getNextRunDate() {
        const now = new Date();
        const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
        const nextSunday = new Date(now);
        nextSunday.setDate(now.getDate() + daysUntilSunday);
        nextSunday.setHours(3, 0, 0, 0);

        // If it's already past 3 AM on Sunday, schedule for next Sunday
        if (now.getDay() === 0 && now.getHours() >= 3) {
            nextSunday.setDate(nextSunday.getDate() + 7);
        }

        return nextSunday;
    }

    /**
     * Start the scheduled cleanup job (runs every Sunday at 3:00 AM)
     */
    startScheduledJob() {
        // Schedule job to run every Sunday at 3:00 AM
        cron.schedule('0 3 * * 0', async () => {
            console.log('📅 DTR File Cleanup Job triggered');
            
            try {
                await this.runCleanup();
            } catch (error) {
                console.error('💥 DTR File Cleanup Job crashed:', error.message);
            }
        }, {
            timezone: "Asia/Manila" // Adjust to your timezone
        });

        console.log('⏰ DTR File Cleanup Job scheduled to run every Sunday at 3:00 AM');
    }

    /**
     * Dry run to see what would be deleted without actually deleting
     * @returns {Promise<Object>} Dry run result
     */
    async dryRun() {
        try {
            const moment = require('moment');
            const fs = require('fs').promises;
            const path = require('path');

            const cutoffDate = moment().subtract(dtrFileStorage.retentionDays, 'days');
            let fileCount = 0;
            let totalSize = 0;
            const files = [];

            // Scan all year/month directories
            const baseUploadPath = dtrFileStorage.baseUploadPath;
            const years = await this._getDirectories(baseUploadPath);

            for (const year of years) {
                const yearPath = path.join(baseUploadPath, year);
                const months = await this._getDirectories(yearPath);

                for (const month of months) {
                    const monthPath = path.join(yearPath, month);
                    const monthFiles = await fs.readdir(monthPath);

                    for (const file of monthFiles) {
                        const filePath = path.join(monthPath, file);
                        
                        try {
                            const stats = await fs.stat(filePath);
                            
                            // Skip directories
                            if (stats.isDirectory()) {
                                continue;
                            }

                            // Check if file is older than retention period
                            if (moment(stats.mtime).isBefore(cutoffDate)) {
                                fileCount++;
                                totalSize += stats.size;
                                files.push({
                                    path: filePath,
                                    size: stats.size,
                                    sizeFormatted: dtrFileStorage.formatFileSize(stats.size),
                                    modified: stats.mtime,
                                    age: moment().diff(moment(stats.mtime), 'days')
                                });
                            }
                        } catch (fileError) {
                            // Skip files that can't be accessed
                        }
                    }
                }
            }

            return {
                success: true,
                data: {
                    would_delete_count: fileCount,
                    would_delete_size: totalSize,
                    would_delete_size_formatted: dtrFileStorage.formatFileSize(totalSize),
                    retention_days: dtrFileStorage.retentionDays,
                    cutoff_date: cutoffDate.format('YYYY-MM-DD'),
                    files: files.slice(0, 100) // Limit to first 100 files for display
                }
            };
        } catch (error) {
            console.error('Error in dry run:', error);
            return {
                success: false,
                error: 'Failed to perform dry run',
                details: error.message
            };
        }
    }

    /**
     * Get list of directories in a path
     * @private
     */
    async _getDirectories(dirPath) {
        try {
            const fs = require('fs').promises;
            const items = await fs.readdir(dirPath, { withFileTypes: true });
            return items
                .filter(item => item.isDirectory())
                .map(item => item.name);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new DTRFileCleanupJob();
