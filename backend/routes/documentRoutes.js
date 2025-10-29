// routes/documentRoutes.js - Document management routes
const express = require('express');
const Document = require('../models/Document');
const FileHandler = require('../utils/fileHandler');
const authMiddleware = require('../middleware/auth');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();
const fileHandler = new FileHandler();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// GET /api/documents - Get documents
router.get('/', asyncHandler(async (req, res) => {
    const { employee_id, document_type_id, status } = req.query;
    const currentUser = req.session.user;
    
    const filters = {};
    
    // If not admin, only show own documents
    if (currentUser.role !== 'admin') {
        filters.employee_id = currentUser.employee_id;
    } else if (employee_id) {
        filters.employee_id = employee_id;
    }
    
    if (document_type_id) filters.document_type_id = document_type_id;
    if (status) filters.status = status;
    
    const result = await Document.findAll(filters);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    res.json({
        success: true,
        data: result.data
    });
}));

// GET /api/documents/types - Get document types
router.get('/types', asyncHandler(async (req, res) => {
    const result = await Document.getDocumentTypes();
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    res.json({
        success: true,
        data: result.data
    });
}));

// GET /api/documents/checklist/:employeeId - Get document checklist for employee
router.get('/checklist/:employeeId', asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const currentUser = req.session.user;
    
    // Check permissions
    if (currentUser.role !== 'admin' && parseInt(employeeId) !== currentUser.employee_id) {
        throw new ValidationError('Access denied');
    }
    
    const result = await Document.getEmployeeDocumentChecklist(employeeId);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    res.json({
        success: true,
        data: result.data
    });
}));

// POST /api/documents/upload - Upload document
router.post('/upload', asyncHandler(async (req, res) => {
    console.log('=== Document Upload Started ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    const { employee_id, document_type_id, description } = req.body;
    const currentUser = req.session.user;
    
    console.log('Parsed data:', { employee_id, document_type_id, description });
    console.log('Current user:', currentUser);
    
    // Check if file is uploaded
    if (!req.files || !req.files.document) {
        console.log('No file uploaded error');
        throw new ValidationError('No file uploaded');
    }
    
    const file = req.files.document;
    console.log('File info:', { name: file.name, size: file.size, mimetype: file.mimetype });
    
    // Validate permissions
    if (currentUser.role !== 'admin' && parseInt(employee_id) !== currentUser.employee_id) {
        console.log('Access denied error');
        throw new ValidationError('Access denied');
    }
    
    console.log('Getting document types...');
    // Get document type for validation
    const docTypesResult = await Document.getDocumentTypes();
    if (!docTypesResult.success) {
        console.log('Failed to get document types:', docTypesResult.error);
        throw new Error('Failed to get document types');
    }
    
    console.log('Document types result:', docTypesResult);
    const documentType = docTypesResult.data.find(dt => dt.id == document_type_id);
    if (!documentType) {
        console.log('Invalid document type error, available types:', docTypesResult.data.map(dt => ({ id: dt.id, name: dt.name })));
        throw new ValidationError('Invalid document type');
    }
    
    console.log('Document type found:', documentType);
    
    console.log('Validating file...');
    // Validate file
    const validation = await fileHandler.validateUpload(file, documentType, documentType.max_file_size);
    if (!validation.isValid) {
        console.log('File validation failed:', validation.errors);
        throw new ValidationError('File validation failed', validation.errors);
    }
    
    console.log('Saving file...');
    // Save file
    const saveResult = await fileHandler.saveFile(file, employee_id, documentType);
    if (!saveResult.success) {
        console.log('File save failed:', saveResult.error);
        throw new Error(saveResult.error);
    }
    
    console.log('File saved:', saveResult);
    
    console.log('Creating document record...');
    // Create document record
    const document = new Document({
        employee_id: employee_id,
        document_type_id: document_type_id,
        file_name: saveResult.fileName,
        file_path: saveResult.filePath,
        file_size: saveResult.size,
        mime_type: saveResult.mimeType,
        uploaded_by: currentUser.id,
        status: currentUser.role === 'admin' ? 'Approved' : 'Pending',
        description: description || null,
        reviewed_by: currentUser.role === 'admin' ? currentUser.id : null,
        reviewed_at: currentUser.role === 'admin' ? new Date() : null,
        review_notes: currentUser.role === 'admin' ? 'Auto-approved by admin' : null
    });
    
    console.log('Document object created:', document);
    console.log('DEBUG: Current user role:', currentUser.role);
    console.log('DEBUG: Document status will be:', document.status);
    
    console.log('Saving document to database...');
    const result = await document.save();
    
    console.log('Document save result:', result);
    
    if (!result.success) {
        console.log('Database save failed, cleaning up file...');
        // Clean up uploaded file if database save fails
        await fileHandler.deleteFile(saveResult.filePath);
        throw new Error(result.error);
    }
    
    // Send notification to admin users if document is pending approval
    console.log('DEBUG: Document status:', document.status);
    if (document.status === 'Pending') {
        console.log('DEBUG: Document is pending, sending notifications...');
        try {
            const notificationService = require('../services/notificationService');
            const { pool } = require('../config/database');
            
            console.log('DEBUG: Getting admin users...');
            // Get admin users
            const adminUsers = await notificationService.getAdminUsers();
            console.log('DEBUG: Admin users found:', adminUsers);
            const adminUserIds = adminUsers.map(user => user.id);
            console.log('DEBUG: Admin user IDs:', adminUserIds);
            
            if (adminUserIds.length > 0) {
                // Get employee name for notification
                console.log('DEBUG: Getting employee name for ID:', employee_id);
                const [employeeRows] = await pool.execute(
                    'SELECT first_name, last_name FROM employees WHERE id = ?',
                    [employee_id]
                );
                console.log('DEBUG: Employee rows:', employeeRows);
                
                const employeeName = employeeRows.length > 0 
                    ? `${employeeRows[0].first_name} ${employeeRows[0].last_name}`
                    : 'Employee';
                console.log('DEBUG: Employee name:', employeeName);
                
                // Send notification to all admin users
                for (const adminUserId of adminUserIds) {
                    console.log('DEBUG: Sending notification to admin user ID:', adminUserId);
                    const notifResult = await notificationService.createNotification({
                        user_id: adminUserId,
                        type: 'document_approval_request',
                        title: 'Document Approval Request',
                        message: `${employeeName} has uploaded a ${documentType.name} document for approval.`,
                        priority: 'HIGH',
                        reference_type: 'employee_document',
                        reference_id: result.data.id,
                        metadata: {
                            employee_id: employee_id,
                            employee_name: employeeName,
                            document_type: documentType.name,
                            document_id: result.data.id
                        }
                    });
                    console.log('DEBUG: Notification result:', notifResult);
                }
                
                console.log(`Admin notifications sent to ${adminUserIds.length} admin(s) for document approval request`);
            } else {
                console.log('DEBUG: No admin users found to notify');
            }
        } catch (notificationError) {
            console.error('Failed to send document approval notification:', notificationError);
            console.error('Error stack:', notificationError.stack);
            // Don't fail the request if notification fails
        }
    } else {
        console.log('DEBUG: Document is not pending (status:', document.status, '), skipping notification');
    }
    
    console.log('=== Document Upload Completed Successfully ===');
    
    res.status(201).json({
        success: true,
        data: result.data,
        message: 'Document uploaded successfully'
    });
}));

// GET /api/documents/:id/download - Download document file
router.get('/:id/download', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;
    
    const result = await Document.findById(id);
    
    if (!result.success || !result.data) {
        throw new NotFoundError('Document not found');
    }
    
    const document = result.data;
    
    // Check permissions
    if (currentUser.role !== 'admin' && document.employee_id !== currentUser.employee_id) {
        throw new ValidationError('Access denied');
    }
    
    // Check if file exists
    const filePath = document.file_path;
    if (!await fileHandler.fileExists(filePath)) {
        throw new NotFoundError('File not found on server');
    }
    
    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    
    // Stream the file
    const fileStream = await fileHandler.getFileStream(filePath);
    fileStream.pipe(res);
}));

// GET /api/documents/:id/preview - Preview document file (admin only)
router.get('/:id/preview', authMiddleware.requireAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await Document.findById(id);
    
    if (!result.success || !result.data) {
        throw new NotFoundError('Document not found');
    }
    
    const document = result.data;
    
    // Check if file exists
    const filePath = document.file_path;
    if (!await fileHandler.fileExists(filePath)) {
        throw new NotFoundError('File not found on server');
    }
    
    // Set appropriate headers for inline preview
    res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`);
    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Stream the file
    const fileStream = await fileHandler.getFileStream(filePath);
    fileStream.pipe(res);
}));

// GET /api/documents/statistics - Get document statistics
router.get('/statistics', asyncHandler(async (req, res) => {
    const { employee_id, document_type_id } = req.query;
    const currentUser = req.session.user;
    
    const filters = {};
    
    // If not admin, only show own documents
    if (currentUser.role !== 'admin') {
        filters.employee_id = currentUser.employee_id;
    } else if (employee_id) {
        filters.employee_id = employee_id;
    }
    
    if (document_type_id) filters.document_type_id = document_type_id;
    
    const result = await Document.getStatistics(filters);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    res.json({
        success: true,
        data: result.data
    });
}));

// GET /api/documents/:id - Get document by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;
    
    const result = await Document.findById(id);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    if (!result.data) {
        throw new NotFoundError('Document not found');
    }
    
    const document = result.data;
    
    // Check permissions
    if (currentUser.role !== 'admin' && document.employee_id !== currentUser.employee_id) {
        throw new ValidationError('Access denied');
    }
    
    res.json({
        success: true,
        data: document
    });
}));

// PUT /api/documents/:id/approve - Approve document (admin only)
router.put('/:id/approve', authMiddleware.requireAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { review_notes } = req.body;
    const currentUser = req.session.user;
    
    const result = await Document.findById(id);
    
    if (!result.success || !result.data) {
        throw new NotFoundError('Document not found');
    }
    
    const document = result.data;
    
    if (document.status !== 'Pending') {
        throw new ValidationError('Document has already been reviewed');
    }
    
    const approveResult = await document.approve(currentUser.id, review_notes);
    
    if (!approveResult.success) {
        throw new Error(approveResult.error);
    }
    
    // Send notification to employee
    console.log('DEBUG: Sending document approval notification to employee ID:', document.employee_id);
    try {
        const notificationService = require('../services/notificationService');
        const { pool } = require('../config/database');
        
        const [employeeRows] = await pool.execute(
            'SELECT u.id, e.first_name, e.last_name FROM users u JOIN employees e ON e.user_id = u.id WHERE e.id = ? AND u.is_active = 1',
            [document.employee_id]
        );
        
        console.log('DEBUG: Employee rows found:', employeeRows);
        
        if (employeeRows.length > 0) {
            const employee = employeeRows[0];
            console.log('DEBUG: Sending approval notification to user ID:', employee.id);
            const notifResult = await notificationService.createNotification({
                user_id: employee.id,
                type: 'document_approved',
                title: 'Document Approved',
                message: `Your ${document.document_type_name} document has been approved.`,
                priority: 'MEDIUM',
                reference_type: 'employee_document',
                reference_id: document.id,
                metadata: {
                    document_type: document.document_type_name,
                    document_id: document.id,
                    review_notes: review_notes
                }
            });
            console.log('DEBUG: Approval notification sent successfully:', notifResult);
        } else {
            console.log('DEBUG: No active employee user found for employee ID:', document.employee_id);
        }
    } catch (notificationError) {
        console.error('Failed to send document approval notification:', notificationError);
        console.error('Error stack:', notificationError.stack);
        // Don't fail the request if notification fails
    }
    
    res.json({
        success: true,
        message: 'Document approved successfully'
    });
}));

// PUT /api/documents/:id/reject - Reject and delete document (admin only)
router.put('/:id/reject', authMiddleware.requireAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { review_notes } = req.body;
    const currentUser = req.session.user;
    
    if (!review_notes || review_notes.trim().length === 0) {
        throw new ValidationError('Review notes are required when rejecting a document');
    }
    
    const result = await Document.findById(id);
    
    if (!result.success || !result.data) {
        throw new NotFoundError('Document not found');
    }
    
    const document = result.data;
    
    if (document.status !== 'Pending') {
        throw new ValidationError('Document has already been reviewed');
    }
    
    // Send notification to employee BEFORE deleting
    console.log('DEBUG: Sending document rejection notification to employee ID:', document.employee_id);
    try {
        const notificationService = require('../services/notificationService');
        const { pool } = require('../config/database');
        
        const [employeeRows] = await pool.execute(
            'SELECT u.id, e.first_name, e.last_name FROM users u JOIN employees e ON e.user_id = u.id WHERE e.id = ? AND u.is_active = 1',
            [document.employee_id]
        );
        
        console.log('DEBUG: Employee rows found:', employeeRows);
        
        if (employeeRows.length > 0) {
            const employee = employeeRows[0];
            console.log('DEBUG: Sending rejection notification to user ID:', employee.id);
            const notifResult = await notificationService.createNotification({
                user_id: employee.id,
                type: 'document_rejected',
                title: 'Document Rejected and Deleted',
                message: `Your ${document.document_type_name} document has been rejected and removed from the system. Reason: ${review_notes}. Please upload a corrected version.`,
                priority: 'HIGH',
                reference_type: 'employee_document',
                reference_id: null, // Document will be deleted
                metadata: {
                    document_type: document.document_type_name,
                    document_type_id: document.document_type_id,
                    review_notes: review_notes,
                    rejected_by: currentUser.username
                }
            });
            console.log('DEBUG: Rejection notification sent successfully:', notifResult);
        }
    } catch (notificationError) {
        console.error('Failed to send document rejection notification:', notificationError);
        // Don't fail the request if notification fails
    }
    
    // Delete the document and its file
    console.log('DEBUG: Deleting rejected document and file...');
    const deleteResult = await document.delete();
    
    if (!deleteResult.success) {
        console.error('Failed to delete document:', deleteResult.error);
        throw new Error('Failed to delete rejected document');
    }
    
    console.log('DEBUG: Document and file deleted successfully');
    
    res.json({
        success: true,
        message: 'Document rejected and deleted successfully'
    });
}));

// DELETE /api/documents/:id - Delete document
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;
    
    const result = await Document.findById(id);
    
    if (!result.success || !result.data) {
        throw new NotFoundError('Document not found');
    }
    
    const document = result.data;
    
    // Check permissions
    if (currentUser.role !== 'admin' && document.employee_id !== currentUser.employee_id) {
        throw new ValidationError('Access denied');
    }
    
    // Only allow deletion of pending documents or by admin
    if (document.status !== 'Pending' && currentUser.role !== 'admin') {
        throw new ValidationError('Cannot delete approved documents');
    }
    
    const deleteResult = await document.delete();
    
    if (!deleteResult.success) {
        throw new Error(deleteResult.error);
    }
    
    res.json({
        success: true,
        message: 'Document deleted successfully'
    });
}));

module.exports = router;