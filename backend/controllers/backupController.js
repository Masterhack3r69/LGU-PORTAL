// controllers/backupController.js - Database backup and restore controller
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { executeQuery } = require('../config/database');
const config = require('../config/config');

const backupPath = config.backup?.path || './backups';

// Ensure backup directory exists
const ensureBackupDirectory = async () => {
    try {
        await fs.access(backupPath);
    } catch {
        await fs.mkdir(backupPath, { recursive: true });
    }
};

// Format file size for display
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// List available backups
const listBackups = async (req, res) => {
    try {
        await ensureBackupDirectory();
        const files = await fs.readdir(backupPath);
        
        const backups = [];
        for (const file of files) {
            if (file.endsWith('.sql')) {
                const filePath = path.join(backupPath, file);
                const stats = await fs.stat(filePath);
                
                backups.push({
                    filename: file,
                    size: stats.size,
                    created_at: stats.birthtime,
                    modified_at: stats.mtime,
                    sizeFormatted: formatFileSize(stats.size)
                });
            }
        }

        // Sort by creation date (newest first)
        backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({
            success: true,
            data: backups
        });
    } catch (error) {
        console.error('Failed to list backups:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list backups'
        });
    }
};

// Create new backup
const createBackup = async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.sql`;
        const filePath = path.join(backupPath, filename);

        await ensureBackupDirectory();

            // Create mysqldump command
            const mysqldumpPath = process.env.MYSQLDUMP_PATH || 'mysqldump';
            const dbConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || '3306',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'employee_management_system'
            };

            const args = [
                `--host=${dbConfig.host}`,
                `--port=${dbConfig.port}`,
                `--user=${dbConfig.user}`,
                '--single-transaction',
                '--routines',
                '--triggers',
                '--add-drop-table',
                '--complete-insert',
                '--extended-insert',
                '--comments',
                '--skip-lock-tables',
                '--force',
                dbConfig.database
            ];

            // Set environment variables for MySQL password to avoid command line warning
            const env = {
                ...process.env,
                MYSQL_PWD: dbConfig.password
            };

            // Execute mysqldump
            const mysqldump = spawn(mysqldumpPath, args, { env });
            const writeStream = require('fs').createWriteStream(filePath);

            mysqldump.stdout.pipe(writeStream);

            let errorOutput = '';
            mysqldump.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            mysqldump.on('close', async (code) => {
                if (code === 0) {
                    try {
                        const stats = await fs.stat(filePath);
                        
                        // Log backup creation in audit
                        await executeQuery(
                            `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent) 
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [
                                req.session.user.id,
                                'BACKUP_CREATE',
                                'database',
                                null,
                                JSON.stringify({ filename, size: stats.size }),
                                req.ip || req.connection.remoteAddress,
                                req.get('User-Agent')
                            ]
                        );

                        // Check if there were warnings but backup succeeded
                        let message = 'Backup created successfully';
                        if (errorOutput && errorOutput.includes('Warning')) {
                            message += ' (with warnings - check logs for details)';
                            console.warn('Backup created with warnings:', errorOutput);
                        }

                        res.json({
                            success: true,
                            message,
                            data: {
                                filename,
                                size: stats.size,
                                sizeFormatted: formatFileSize(stats.size),
                                created_at: stats.birthtime
                            }
                        });
                    } catch (statError) {
                        console.error('Failed to get backup file stats:', statError);
                        res.status(500).json({
                            success: false,
                            error: 'Backup created but failed to get file information'
                        });
                    }
                } else {
                    console.error('mysqldump failed with code:', code);
                    console.error('mysqldump error output:', errorOutput);
                    
                    // Clean up failed backup file
                    try {
                        await fs.unlink(filePath);
                    } catch {}

                    // Provide more user-friendly error messages
                    let userError = 'Backup failed';
                    if (errorOutput.includes('Access denied')) {
                        userError = 'Database access denied. Check credentials.';
                    } else if (errorOutput.includes('Unknown database')) {
                        userError = 'Database not found. Check database name.';
                    } else if (errorOutput.includes('Can\'t connect')) {
                        userError = 'Cannot connect to database server.';
                    } else if (errorOutput.includes('invalid table')) {
                        userError = 'Database contains invalid views or tables.';
                    }

                    res.status(500).json({
                        success: false,
                        error: userError,
                        details: errorOutput
                    });
                }
            });

            mysqldump.on('error', async (error) => {
                console.error('mysqldump error:', error);
                
                // Clean up failed backup file
                try {
                    await fs.unlink(filePath);
                } catch {}

                res.status(500).json({
                    success: false,
                    error: `Backup failed: ${error.message}`
                });
            });

        } catch (error) {
            console.error('Failed to create backup:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create backup'
            });
        }
    };

// Restore from backup
const restoreBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(backupPath, filename);

            // Verify backup file exists
            try {
                await fs.access(filePath);
            } catch {
                return res.status(404).json({
                    success: false,
                    error: 'Backup file not found'
                });
            }

            // Validate filename to prevent path traversal
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid filename'
                });
            }

            const dbConfig = {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || '3306',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'employee_management_system'
            };

            // Create mysql command for restore
            const mysqlPath = process.env.MYSQL_PATH || 'mysql';
            const args = [
                `--host=${dbConfig.host}`,
                `--port=${dbConfig.port}`,
                `--user=${dbConfig.user}`,
                dbConfig.database
            ];

            // Set environment variables for MySQL password to avoid command line warning
            const env = {
                ...process.env,
                MYSQL_PWD: dbConfig.password
            };

            const mysql = spawn(mysqlPath, args, { env });
            const readStream = require('fs').createReadStream(filePath);

            readStream.pipe(mysql.stdin);

            let errorOutput = '';
            mysql.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            mysql.on('close', async (code) => {
                if (code === 0) {
                    try {
                        // Log restore operation in audit
                        await executeQuery(
                            `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent) 
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [
                                req.session.user.id,
                                'BACKUP_RESTORE',
                                'database',
                                null,
                                JSON.stringify({ filename }),
                                req.ip || req.connection.remoteAddress,
                                req.get('User-Agent')
                            ]
                        );

                        res.json({
                            success: true,
                            message: 'Database restored successfully'
                        });
                    } catch (auditError) {
                        console.error('Failed to log restore operation:', auditError);
                        res.json({
                            success: true,
                            message: 'Database restored successfully (audit logging failed)'
                        });
                    }
                } else {
                    console.error('mysql restore failed:', errorOutput);
                    res.status(500).json({
                        success: false,
                        error: `Restore failed: ${errorOutput || 'Unknown error'}`
                    });
                }
            });

            mysql.on('error', (error) => {
                console.error('mysql restore error:', error);
                res.status(500).json({
                    success: false,
                    error: `Restore failed: ${error.message}`
                });
            });

        } catch (error) {
            console.error('Failed to restore backup:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to restore backup'
            });
        }
    };

// Delete backup file
const deleteBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(backupPath, filename);

            // Validate filename to prevent path traversal
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid filename'
                });
            }

            // Verify backup file exists
            try {
                await fs.access(filePath);
            } catch {
                return res.status(404).json({
                    success: false,
                    error: 'Backup file not found'
                });
            }

            await fs.unlink(filePath);

            // Log backup deletion in audit
            await executeQuery(
                `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.session.user.id,
                    'BACKUP_DELETE',
                    'database',
                    null,
                    JSON.stringify({ filename }),
                    req.ip || req.connection.remoteAddress,
                    req.get('User-Agent')
                ]
            );

            res.json({
                success: true,
                message: 'Backup deleted successfully'
            });
        } catch (error) {
            console.error('Failed to delete backup:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete backup'
            });
        }
    };

// Download backup file
const downloadBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(backupPath, filename);

            // Validate filename to prevent path traversal
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid filename'
                });
            }

            // Verify backup file exists
            try {
                await fs.access(filePath);
            } catch {
                return res.status(404).json({
                    success: false,
                    error: 'Backup file not found'
                });
            }

            // Log backup download in audit
            await executeQuery(
                `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.session.user.id,
                    'BACKUP_DOWNLOAD',
                    'database',
                    null,
                    JSON.stringify({ filename }),
                    req.ip || req.connection.remoteAddress,
                    req.get('User-Agent')
                ]
            );

            res.download(filePath, filename);
        } catch (error) {
            console.error('Failed to download backup:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to download backup'
            });
        }
    };

// Get backup/restore status
const getBackupStatus = async (req, res) => {
    try {
        await ensureBackupDirectory();
        
        const files = await fs.readdir(backupPath);
        const backupFiles = files.filter(file => file.endsWith('.sql'));
        
        let totalSize = 0;
        for (const file of backupFiles) {
            const filePath = path.join(backupPath, file);
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
        }

        res.json({
            success: true,
            data: {
                backupCount: backupFiles.length,
                totalSize,
                totalSizeFormatted: formatFileSize(totalSize),
                backupPath: backupPath,
                lastBackup: backupFiles.length > 0 ? backupFiles[0] : null
            }
        });
    } catch (error) {
        console.error('Failed to get backup status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get backup status'
        });
    }
};

module.exports = {
    listBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
    getBackupStatus
};