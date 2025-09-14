// models/Document.js - Document management model
const { executeQuery, findOne } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

class Document {
    constructor(data = {}) {
        this.id = data.id || null;
        this.employee_id = data.employee_id || null;
        this.document_type_id = data.document_type_id || null;
        this.file_name = data.file_name || null;
        this.file_path = data.file_path || null;
        this.file_size = data.file_size || null;
        this.mime_type = data.mime_type || null;
        this.upload_date = data.upload_date || null;
        this.uploaded_by = data.uploaded_by || null;
        this.status = data.status || 'Pending';
        this.reviewed_by = data.reviewed_by || null;
        this.reviewed_at = data.reviewed_at || null;
        this.review_notes = data.review_notes || null;
        this.description = data.description || null;
    }

    // Validate document data
    validate() {
        const errors = [];

        if (!this.employee_id) {
            errors.push('Employee ID is required');
        }

        if (!this.document_type_id) {
            errors.push('Document type is required');
        }

        if (!this.file_name) {
            errors.push('File name is required');
        }

        if (!this.file_path) {
            errors.push('File path is required');
        }

        if (!this.uploaded_by) {
            errors.push('Uploader information is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Save document record
    async save() {
        const validation = this.validate();
        if (!validation.isValid) {
            return {
                success: false,
                error: 'Validation failed',
                details: validation.errors
            };
        }

        try {
            if (this.id) {
                return await this.update();
            } else {
                return await this.create();
            }
        } catch (error) {
            return {
                success: false,
                error: 'Failed to save document',
                details: error.message
            };
        }
    }

    // Create new document record
    async create() {
        const query = `
            INSERT INTO employee_documents (
                employee_id, document_type_id, file_name, file_path,
                file_size, mime_type, uploaded_by, status, review_notes, reviewed_by, reviewed_at, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            this.employee_id, this.document_type_id, this.file_name,
            this.file_path, this.file_size, this.mime_type,
            this.uploaded_by, this.status, this.review_notes, this.reviewed_by, this.reviewed_at, this.description
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            this.id = result.data.insertId;
            return {
                success: true,
                data: this,
                message: 'Document uploaded successfully'
            };
        }

        return result;
    }

    // Update document record
    async update() {
        const query = `
            UPDATE employee_documents SET
                employee_id = ?, document_type_id = ?, file_name = ?,
                file_path = ?, file_size = ?, mime_type = ?, status = ?,
                reviewed_by = ?, reviewed_at = ?, review_notes = ?, description = ?
            WHERE id = ?
        `;

        const params = [
            this.employee_id, this.document_type_id, this.file_name,
            this.file_path, this.file_size, this.mime_type, this.status,
            this.reviewed_by, this.reviewed_at, this.review_notes, this.description, this.id
        ];

        const result = await executeQuery(query, params);
        if (result.success) {
            return {
                success: true,
                data: this,
                message: 'Document updated successfully'
            };
        }

        return result;
    }

    // Approve document
    async approve(reviewedBy, reviewNotes = '') {
        const query = `
            UPDATE employee_documents SET 
                status = 'Approved', reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
            WHERE id = ?
        `;

        const result = await executeQuery(query, [reviewedBy, reviewNotes, this.id]);
        
        if (result.success) {
            this.status = 'Approved';
            this.reviewed_by = reviewedBy;
            this.reviewed_at = new Date();
            this.review_notes = reviewNotes;
        }

        return result;
    }

    // Reject document
    async reject(reviewedBy, reviewNotes = '') {
        const query = `
            UPDATE employee_documents SET 
                status = 'Rejected', reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
            WHERE id = ?
        `;

        const result = await executeQuery(query, [reviewedBy, reviewNotes, this.id]);
        
        if (result.success) {
            this.status = 'Rejected';
            this.reviewed_by = reviewedBy;
            this.reviewed_at = new Date();
            this.review_notes = reviewNotes;
        }

        return result;
    }

    // Delete document and file
    async delete() {
        try {
            // Delete physical file
            if (this.file_path) {
                try {
                    await fs.access(this.file_path);
                    await fs.unlink(this.file_path);
                } catch (fileError) {
                    console.warn('File not found or already deleted:', this.file_path);
                }
            }

            // Delete database record
            const result = await executeQuery('DELETE FROM employee_documents WHERE id = ?', [this.id]);
            return result;
        } catch (error) {
            return {
                success: false,
                error: 'Failed to delete document',
                details: error.message
            };
        }
    }

    // Static methods

    // Find document by ID
    static async findById(id) {
        const query = `
            SELECT ed.*, dt.name as document_type_name, dt.description as document_type_description,
                   CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                   CONCAT(u1.username) as uploaded_by_username,
                   CONCAT(u2.username) as reviewed_by_username
            FROM employee_documents ed
            LEFT JOIN document_types dt ON ed.document_type_id = dt.id
            LEFT JOIN employees e ON ed.employee_id = e.id
            LEFT JOIN users u1 ON ed.uploaded_by = u1.id
            LEFT JOIN users u2 ON ed.reviewed_by = u2.id
            WHERE ed.id = ?
        `;
        
        const result = await findOne(query, [id]);
        if (result.success && result.data) {
            return {
                success: true,
                data: new Document(result.data)
            };
        }
        
        return result;
    }

    // Get documents with filters
    static async findAll(filters = {}) {
        let query = `
            SELECT ed.*, dt.name as document_type_name, dt.description as document_type_description,
                   CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                   e.employee_number,
                   CONCAT(u1.username) as uploaded_by_username,
                   CONCAT(u2.username) as reviewed_by_username
            FROM employee_documents ed
            LEFT JOIN document_types dt ON ed.document_type_id = dt.id
            LEFT JOIN employees e ON ed.employee_id = e.id
            LEFT JOIN users u1 ON ed.uploaded_by = u1.id
            LEFT JOIN users u2 ON ed.reviewed_by = u2.id
            WHERE 1=1
        `;
        
        const params = [];

        if (filters.employee_id) {
            query += ' AND ed.employee_id = ?';
            params.push(filters.employee_id);
        }

        if (filters.document_type_id) {
            query += ' AND ed.document_type_id = ?';
            params.push(filters.document_type_id);
        }

        if (filters.status) {
            query += ' AND ed.status = ?';
            params.push(filters.status);
        }

        if (filters.uploaded_by) {
            query += ' AND ed.uploaded_by = ?';
            params.push(filters.uploaded_by);
        }

        query += ' ORDER BY ed.upload_date DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const result = await executeQuery(query, params);
        if (result.success) {
            const documents = result.data.map(row => new Document(row));
            return {
                success: true,
                data: documents
            };
        }

        return result;
    }

    // Get document types
    static async getDocumentTypes() {
        const query = 'SELECT * FROM document_types ORDER BY name';
        return await executeQuery(query);
    }

    // Create upload directory structure
    static async createUploadDirectories(employeeId) {
        try {
            const uploadBase = process.env.UPLOAD_PATH || './uploads';
            const employeeDir = path.join(uploadBase, 'employees', employeeId.toString());
            
            await fs.mkdir(employeeDir, { recursive: true });
            
            return {
                success: true,
                path: employeeDir
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to create upload directory',
                details: error.message
            };
        }
    }

    // Generate unique file name
    static generateUniqueFileName(originalName) {
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext);
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        
        return `${name}_${timestamp}_${random}${ext}`;
    }

    // Validate file type and size
    static async validateFile(file, documentTypeId) {
        try {
            // Get document type constraints
            const docType = await findOne(
                'SELECT max_file_size, allowed_extensions FROM document_types WHERE id = ?',
                [documentTypeId]
            );

            if (!docType.success || !docType.data) {
                return {
                    isValid: false,
                    error: 'Invalid document type'
                };
            }

            const { max_file_size, allowed_extensions } = docType.data;
            const allowedExts = JSON.parse(allowed_extensions || '[]');

            // Check file size
            if (file.size > max_file_size) {
                return {
                    isValid: false,
                    error: `File size exceeds limit of ${Math.round(max_file_size / 1024 / 1024)}MB`
                };
            }

            // Check file extension
            const fileExt = path.extname(file.name).toLowerCase().substring(1);
            if (allowedExts.length > 0 && !allowedExts.includes(fileExt)) {
                return {
                    isValid: false,
                    error: `File type not allowed. Allowed types: ${allowedExts.join(', ')}`
                };
            }

            return {
                isValid: true
            };
        } catch (error) {
            return {
                isValid: false,
                error: 'File validation failed',
                details: error.message
            };
        }
    }

    // Get employee document checklist
    static async getEmployeeDocumentChecklist(employeeId) {
        const query = `
            SELECT dt.id, dt.name, dt.description, dt.is_required,
                   ed.id as document_id, ed.status, ed.upload_date
            FROM document_types dt
            LEFT JOIN employee_documents ed ON dt.id = ed.document_type_id AND ed.employee_id = ?
            ORDER BY dt.is_required DESC, dt.name
        `;

        const result = await executeQuery(query, [employeeId]);
        if (result.success) {
            return {
                success: true,
                data: result.data.map(row => ({
                    document_type_id: row.id,
                    document_type_name: row.name,
                    description: row.description,
                    is_required: row.is_required,
                    is_uploaded: !!row.document_id,
                    status: row.status || null,
                    upload_date: row.upload_date || null
                }))
            };
        }

        return result;
    }

    // Get document statistics
    static async getStatistics(filters = {}) {
        const conditions = [];
        const params = [];

        if (filters.employee_id) {
            conditions.push('ed.employee_id = ?');
            params.push(filters.employee_id);
        }

        if (filters.document_type_id) {
            conditions.push('ed.document_type_id = ?');
            params.push(filters.document_type_id);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const queries = [
            `SELECT COUNT(*) as total FROM employee_documents ed ${whereClause}`,
            `SELECT COUNT(*) as total FROM employee_documents ed ${whereClause} AND ed.status = 'Pending'`,
            `SELECT COUNT(*) as total FROM employee_documents ed ${whereClause} AND ed.status = 'Approved'`,
            `SELECT COUNT(*) as total FROM employee_documents ed ${whereClause} AND ed.status = 'Rejected'`,
            `SELECT dt.name, COUNT(*) as count 
             FROM employee_documents ed 
             LEFT JOIN document_types dt ON ed.document_type_id = dt.id 
             ${whereClause} 
             GROUP BY ed.document_type_id`
        ];

        try {
            const [total, pending, approved, rejected, byType] = await Promise.all(
                queries.map(query => executeQuery(query, params))
            );

            return {
                success: true,
                data: {
                    total: total.success ? total.data[0].total : 0,
                    pending: pending.success ? pending.data[0].total : 0,
                    approved: approved.success ? approved.data[0].total : 0,
                    rejected: rejected.success ? rejected.data[0].total : 0,
                    byType: byType.success ? byType.data : []
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to get document statistics',
                details: error.message
            };
        }
    }
}

module.exports = Document;