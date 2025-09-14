// utils/fileHandler.js - File handling utilities
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class FileHandler {
    constructor(uploadPath = './uploads') {
        this.uploadPath = uploadPath;
        this.tempPath = path.join(uploadPath, 'temp');
        this.employeePath = path.join(uploadPath, 'employees');
    }

    // Ensure directories exist
    async ensureDirectories() {
        try {
            await fs.mkdir(this.uploadPath, { recursive: true });
            await fs.mkdir(this.tempPath, { recursive: true });
            await fs.mkdir(this.employeePath, { recursive: true });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to create directories',
                details: error.message
            };
        }
    }

    // Create employee directory
    async createEmployeeDirectory(employeeId) {
        try {
            const employeeDir = path.join(this.employeePath, employeeId.toString());
            await fs.mkdir(employeeDir, { recursive: true });
            return {
                success: true,
                path: employeeDir
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to create employee directory',
                details: error.message
            };
        }
    }

    // Generate unique filename
    generateUniqueFilename(originalName) {
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext);
        const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = Date.now();
        const uuid = uuidv4().substring(0, 8);
        
        return `${sanitizedName}_${timestamp}_${uuid}${ext}`;
    }

    // Validate file type
    isValidFileType(filename, allowedExtensions) {
        if (!allowedExtensions || allowedExtensions.length === 0) {
            return true;
        }

        const ext = path.extname(filename).toLowerCase().substring(1);
        return allowedExtensions.includes(ext);
    }

    // Validate file size
    isValidFileSize(fileSize, maxSize) {
        return fileSize <= maxSize;
    }

    // Save uploaded file
    async saveFile(file, employeeId, documentType) {
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            await this.createEmployeeDirectory(employeeId);

            // Generate unique filename
            const uniqueFilename = this.generateUniqueFilename(file.name);
            const employeeDir = path.join(this.employeePath, employeeId.toString());
            const filePath = path.join(employeeDir, uniqueFilename);

            // Move file from temp to permanent location
            await file.mv(filePath);

            return {
                success: true,
                filePath: filePath,
                fileName: uniqueFilename,
                originalName: file.name,
                size: file.size,
                mimeType: file.mimetype
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to save file',
                details: error.message
            };
        }
    }

    // Delete file
    async deleteFile(filePath) {
        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
            return {
                success: true,
                message: 'File deleted successfully'
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                return {
                    success: true,
                    message: 'File not found (already deleted)'
                };
            }
            
            return {
                success: false,
                error: 'Failed to delete file',
                details: error.message
            };
        }
    }

    // Get file stats
    async getFileStats(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return {
                success: true,
                stats: {
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    isFile: stats.isFile(),
                    isDirectory: stats.isDirectory()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get file stats',
                details: error.message
            };
        }
    }

    // Clean up temporary files
    async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        try {
            const files = await fs.readdir(this.tempPath);
            let cleanedCount = 0;

            for (const file of files) {
                const filePath = path.join(this.tempPath, file);
                const stats = await fs.stat(filePath);
                
                if (Date.now() - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    cleanedCount++;
                }
            }

            return {
                success: true,
                message: `Cleaned up ${cleanedCount} temporary files`
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to cleanup temporary files',
                details: error.message
            };
        }
    }

    // Get directory size
    async getDirectorySize(dirPath) {
        try {
            let totalSize = 0;
            const files = await fs.readdir(dirPath, { withFileTypes: true });

            for (const file of files) {
                const filePath = path.join(dirPath, file.name);
                
                if (file.isDirectory()) {
                    const subDirSize = await this.getDirectorySize(filePath);
                    if (subDirSize.success) {
                        totalSize += subDirSize.size;
                    }
                } else {
                    const stats = await fs.stat(filePath);
                    totalSize += stats.size;
                }
            }

            return {
                success: true,
                size: totalSize,
                sizeFormatted: this.formatFileSize(totalSize)
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to calculate directory size',
                details: error.message
            };
        }
    }

    // Format file size for display
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Validate file upload request
    async validateUpload(file, documentType, maxFileSize) {
        const errors = [];

        // Check if file exists
        if (!file) {
            errors.push('No file provided');
            return { isValid: false, errors };
        }

        // Check file size
        if (!this.isValidFileSize(file.size, maxFileSize)) {
            errors.push(`File size exceeds limit of ${this.formatFileSize(maxFileSize)}`);
        }

        // Check file type if document type has restrictions
        if (documentType.allowed_extensions) {
            let allowedExts;
            
            // Handle both JSON string and array formats
            if (typeof documentType.allowed_extensions === 'string') {
                try {
                    allowedExts = JSON.parse(documentType.allowed_extensions);
                } catch (error) {
                    console.error('Failed to parse allowed_extensions JSON:', error);
                    allowedExts = [];
                }
            } else if (Array.isArray(documentType.allowed_extensions)) {
                allowedExts = documentType.allowed_extensions;
            } else {
                allowedExts = [];
            }
            
            if (allowedExts.length > 0 && !this.isValidFileType(file.name, allowedExts)) {
                errors.push(`File type not allowed. Allowed types: ${allowedExts.join(', ')}`);
            }
        }

        // Check for malicious files (basic check)
        const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
        const fileExt = path.extname(file.name).toLowerCase();
        if (suspiciousExtensions.includes(fileExt)) {
            errors.push('File type not allowed for security reasons');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Get upload statistics
    async getUploadStatistics() {
        try {
            const [totalSize, tempSize] = await Promise.all([
                this.getDirectorySize(this.uploadPath),
                this.getDirectorySize(this.tempPath)
            ]);

            // Count files in employee directories
            let totalFiles = 0;
            try {
                const employeeDirs = await fs.readdir(this.employeePath);
                for (const dir of employeeDirs) {
                    const dirPath = path.join(this.employeePath, dir);
                    const files = await fs.readdir(dirPath);
                    totalFiles += files.length;
                }
            } catch (error) {
                // Employee directory might not exist yet
            }

            return {
                success: true,
                statistics: {
                    totalSize: totalSize.success ? totalSize.size : 0,
                    totalSizeFormatted: totalSize.success ? totalSize.sizeFormatted : '0 Bytes',
                    tempSize: tempSize.success ? tempSize.size : 0,
                    tempSizeFormatted: tempSize.success ? tempSize.sizeFormatted : '0 Bytes',
                    totalFiles: totalFiles
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get upload statistics',
                details: error.message
            };
        }
    }

    // Check if file exists
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Get file stream for downloading
    async getFileStream(filePath) {
        const fs = require('fs');
        return fs.createReadStream(filePath);
    }
}

module.exports = FileHandler;