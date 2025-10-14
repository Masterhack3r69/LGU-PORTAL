// utils/dtrFileStorage.js - DTR File Storage Management Utility
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const moment = require('moment');

/**
 * DTR File Storage Manager
 * Handles file storage, naming conventions, cleanup, and retrieval for DTR imports
 */
class DTRFileStorage {
    constructor() {
        this.baseUploadPath = path.join(__dirname, '../uploads/dtr');
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.retentionDays = 90; // 90 days retention policy
        this.allowedExtensions = ['.xlsx', '.xls'];
        this.allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
        ];
    }

    /**
     * Create directory structure for DTR uploads: uploads/dtr/[year]/[month]/
     * @param {Date} date - Date to determine year/month (defaults to current date)
     * @returns {Promise<Object>} Result with directory path
     */
    async ensureDirectoryStructure(date = new Date()) {
        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const dirPath = path.join(this.baseUploadPath, String(year), month);

            // Create directory recursively if it doesn't exist
            await fs.mkdir(dirPath, { recursive: true });

            return {
                success: true,
                path: dirPath,
                year,
                month
            };
        } catch (error) {
            console.error('Error creating directory structure:', error);
            return {
                success: false,
                error: 'Failed to create directory structure',
                details: error.message
            };
        }
    }

    /**
     * Generate filename using convention: DTR_[periodId]_[timestamp]_[originalName]
     * @param {number} periodId - Payroll period ID
     * @param {string} originalName - Original filename
     * @returns {string} Generated filename
     */
    generateFilename(periodId, originalName) {
        const timestamp = Date.now();
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        
        // Sanitize original name (remove special characters)
        const sanitizedName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
        
        return `DTR_${periodId}_${timestamp}_${sanitizedName}${ext}`;
    }

    /**
     * Get the full file path for a DTR file
     * @param {number} periodId - Payroll period ID
     * @param {string} originalName - Original filename
     * @param {Date} date - Date for directory structure
     * @returns {Promise<Object>} Result with file path
     */
    async getFilePath(periodId, originalName, date = new Date()) {
        try {
            const dirResult = await this.ensureDirectoryStructure(date);
            if (!dirResult.success) {
                return dirResult;
            }

            const filename = this.generateFilename(periodId, originalName);
            const filePath = path.join(dirResult.path, filename);

            return {
                success: true,
                filePath,
                filename,
                directory: dirResult.path
            };
        } catch (error) {
            console.error('Error getting file path:', error);
            return {
                success: false,
                error: 'Failed to get file path',
                details: error.message
            };
        }
    }

    /**
     * Validate file size
     * @param {number} fileSize - File size in bytes
     * @returns {Object} Validation result
     */
    validateFileSize(fileSize) {
        const isValid = fileSize <= this.maxFileSize;
        return {
            isValid,
            fileSize,
            maxFileSize: this.maxFileSize,
            error: isValid ? null : `File size (${this.formatFileSize(fileSize)}) exceeds maximum limit of ${this.formatFileSize(this.maxFileSize)}`
        };
    }

    /**
     * Validate file type
     * @param {string} filename - Filename
     * @param {string} mimetype - File MIME type
     * @returns {Object} Validation result
     */
    validateFileType(filename, mimetype) {
        const ext = path.extname(filename).toLowerCase();
        const isValidExtension = this.allowedExtensions.includes(ext);
        const isValidMimeType = this.allowedMimeTypes.includes(mimetype);

        return {
            isValid: isValidExtension && isValidMimeType,
            extension: ext,
            mimetype,
            error: (!isValidExtension || !isValidMimeType) 
                ? `Invalid file type. Only Excel files (${this.allowedExtensions.join(', ')}) are allowed.`
                : null
        };
    }

    /**
     * Validate uploaded file
     * @param {Object} file - File object (from multer or similar)
     * @returns {Object} Validation result
     */
    validateFile(file) {
        if (!file) {
            return {
                isValid: false,
                errors: ['No file provided']
            };
        }

        const errors = [];

        // Validate file size
        const sizeValidation = this.validateFileSize(file.size);
        if (!sizeValidation.isValid) {
            errors.push(sizeValidation.error);
        }

        // Validate file type
        const typeValidation = this.validateFileType(file.originalname || file.name, file.mimetype);
        if (!typeValidation.isValid) {
            errors.push(typeValidation.error);
        }

        // Check for potentially malicious files
        const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js'];
        const fileExt = path.extname(file.originalname || file.name).toLowerCase();
        if (suspiciousExtensions.includes(fileExt)) {
            errors.push('File type not allowed for security reasons');
        }

        return {
            isValid: errors.length === 0,
            errors,
            fileInfo: {
                name: file.originalname || file.name,
                size: file.size,
                mimetype: file.mimetype,
                sizeFormatted: this.formatFileSize(file.size)
            }
        };
    }

    /**
     * Save uploaded file to storage
     * @param {Object} file - File object (from multer)
     * @param {number} periodId - Payroll period ID
     * @returns {Promise<Object>} Save result
     */
    async saveFile(file, periodId) {
        try {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: 'File validation failed',
                    details: validation.errors
                };
            }

            // Get file path
            const pathResult = await this.getFilePath(periodId, file.originalname);
            if (!pathResult.success) {
                return pathResult;
            }

            // If file is already saved by multer, just return the info
            if (file.path && fsSync.existsSync(file.path)) {
                return {
                    success: true,
                    filePath: file.path,
                    filename: file.filename,
                    originalName: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    sizeFormatted: this.formatFileSize(file.size)
                };
            }

            // Otherwise, save the file buffer
            if (file.buffer) {
                await fs.writeFile(pathResult.filePath, file.buffer);
                
                return {
                    success: true,
                    filePath: pathResult.filePath,
                    filename: pathResult.filename,
                    originalName: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype,
                    sizeFormatted: this.formatFileSize(file.size)
                };
            }

            return {
                success: false,
                error: 'No file data available to save'
            };
        } catch (error) {
            console.error('Error saving file:', error);
            return {
                success: false,
                error: 'Failed to save file',
                details: error.message
            };
        }
    }

    /**
     * Retrieve file for viewing/downloading
     * @param {string} filePath - Path to file
     * @returns {Promise<Object>} File retrieval result
     */
    async retrieveFile(filePath) {
        try {
            // Check if file exists
            const exists = await this.fileExists(filePath);
            if (!exists) {
                return {
                    success: false,
                    error: 'File not found'
                };
            }

            // Get file stats
            const stats = await fs.stat(filePath);

            return {
                success: true,
                filePath,
                filename: path.basename(filePath),
                size: stats.size,
                sizeFormatted: this.formatFileSize(stats.size),
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            console.error('Error retrieving file:', error);
            return {
                success: false,
                error: 'Failed to retrieve file',
                details: error.message
            };
        }
    }

    /**
     * Delete a file
     * @param {string} filePath - Path to file
     * @returns {Promise<Object>} Delete result
     */
    async deleteFile(filePath) {
        try {
            const exists = await this.fileExists(filePath);
            if (!exists) {
                return {
                    success: true,
                    message: 'File not found (already deleted)'
                };
            }

            await fs.unlink(filePath);

            return {
                success: true,
                message: 'File deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting file:', error);
            return {
                success: false,
                error: 'Failed to delete file',
                details: error.message
            };
        }
    }

    /**
     * Clean up old DTR import files based on retention policy (90 days)
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanupOldFiles() {
        try {
            const cutoffDate = moment().subtract(this.retentionDays, 'days');
            let deletedCount = 0;
            let deletedSize = 0;
            const errors = [];

            // Scan all year/month directories
            const years = await this._getDirectories(this.baseUploadPath);

            for (const year of years) {
                const yearPath = path.join(this.baseUploadPath, year);
                const months = await this._getDirectories(yearPath);

                for (const month of months) {
                    const monthPath = path.join(yearPath, month);
                    const files = await fs.readdir(monthPath);

                    for (const file of files) {
                        const filePath = path.join(monthPath, file);
                        
                        try {
                            const stats = await fs.stat(filePath);
                            
                            // Skip directories
                            if (stats.isDirectory()) {
                                continue;
                            }

                            // Check if file is older than retention period
                            if (moment(stats.mtime).isBefore(cutoffDate)) {
                                await fs.unlink(filePath);
                                deletedCount++;
                                deletedSize += stats.size;
                            }
                        } catch (fileError) {
                            errors.push({
                                file: filePath,
                                error: fileError.message
                            });
                        }
                    }

                    // Remove empty month directories
                    try {
                        const remainingFiles = await fs.readdir(monthPath);
                        if (remainingFiles.length === 0) {
                            await fs.rmdir(monthPath);
                        }
                    } catch (dirError) {
                        // Ignore errors when removing directories
                    }
                }

                // Remove empty year directories
                try {
                    const remainingMonths = await fs.readdir(yearPath);
                    if (remainingMonths.length === 0) {
                        await fs.rmdir(yearPath);
                    }
                } catch (dirError) {
                    // Ignore errors when removing directories
                }
            }

            return {
                success: true,
                deletedCount,
                deletedSize,
                deletedSizeFormatted: this.formatFileSize(deletedSize),
                retentionDays: this.retentionDays,
                cutoffDate: cutoffDate.format('YYYY-MM-DD'),
                errors: errors.length > 0 ? errors : null
            };
        } catch (error) {
            console.error('Error cleaning up old files:', error);
            return {
                success: false,
                error: 'Failed to cleanup old files',
                details: error.message
            };
        }
    }

    /**
     * Get storage statistics
     * @returns {Promise<Object>} Storage statistics
     */
    async getStorageStatistics() {
        try {
            const stats = await this._getDirectoryStats(this.baseUploadPath);

            return {
                success: true,
                statistics: {
                    totalFiles: stats.fileCount,
                    totalSize: stats.totalSize,
                    totalSizeFormatted: this.formatFileSize(stats.totalSize),
                    oldestFile: stats.oldestFile,
                    newestFile: stats.newestFile,
                    retentionDays: this.retentionDays,
                    maxFileSize: this.maxFileSize,
                    maxFileSizeFormatted: this.formatFileSize(this.maxFileSize)
                }
            };
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
     * Check if file exists
     * @param {string} filePath - Path to file
     * @returns {Promise<boolean>} True if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Scan file for viruses (placeholder for virus scanning integration)
     * @param {string} filePath - Path to file
     * @returns {Promise<Object>} Scan result
     */
    async scanFileForViruses(filePath) {
        // Placeholder for virus scanning integration
        // In production, integrate with ClamAV, Windows Defender API, or cloud-based scanning service
        
        try {
            // Check if file exists
            const exists = await this.fileExists(filePath);
            if (!exists) {
                return {
                    success: false,
                    error: 'File not found'
                };
            }

            // TODO: Integrate with actual virus scanning service
            // Example integrations:
            // - ClamAV (open-source antivirus)
            // - Windows Defender API
            // - VirusTotal API
            // - Cloud-based scanning services

            return {
                success: true,
                scanned: false,
                message: 'Virus scanning not configured. Please integrate with an antivirus service.',
                recommendation: 'Consider integrating ClamAV or similar antivirus solution'
            };
        } catch (error) {
            console.error('Error scanning file:', error);
            return {
                success: false,
                error: 'Failed to scan file',
                details: error.message
            };
        }
    }

    // ===== PRIVATE HELPER METHODS =====

    /**
     * Get list of directories in a path
     * @private
     */
    async _getDirectories(dirPath) {
        try {
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

    /**
     * Get directory statistics recursively
     * @private
     */
    async _getDirectoryStats(dirPath) {
        let fileCount = 0;
        let totalSize = 0;
        let oldestFile = null;
        let newestFile = null;

        try {
            const items = await fs.readdir(dirPath, { withFileTypes: true });

            for (const item of items) {
                const itemPath = path.join(dirPath, item.name);

                if (item.isDirectory()) {
                    const subStats = await this._getDirectoryStats(itemPath);
                    fileCount += subStats.fileCount;
                    totalSize += subStats.totalSize;

                    if (subStats.oldestFile) {
                        if (!oldestFile || subStats.oldestFile.mtime < oldestFile.mtime) {
                            oldestFile = subStats.oldestFile;
                        }
                    }

                    if (subStats.newestFile) {
                        if (!newestFile || subStats.newestFile.mtime > newestFile.mtime) {
                            newestFile = subStats.newestFile;
                        }
                    }
                } else {
                    const stats = await fs.stat(itemPath);
                    fileCount++;
                    totalSize += stats.size;

                    if (!oldestFile || stats.mtime < oldestFile.mtime) {
                        oldestFile = {
                            path: itemPath,
                            mtime: stats.mtime
                        };
                    }

                    if (!newestFile || stats.mtime > newestFile.mtime) {
                        newestFile = {
                            path: itemPath,
                            mtime: stats.mtime
                        };
                    }
                }
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        return {
            fileCount,
            totalSize,
            oldestFile,
            newestFile
        };
    }
}

// Export singleton instance
module.exports = new DTRFileStorage();
