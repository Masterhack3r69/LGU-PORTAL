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
    
    console.log('Saving document to database...');
    const result = await document.save();
    
    console.log('Document save result:', result);
    
    if (!result.success) {
        console.log('Database save failed, cleaning up file...');
        // Clean up uploaded file if database save fails
        await fileHandler.deleteFile(saveResult.filePath);
        throw new Error(result.error);
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
    
    res.json({
        success: true,
        message: 'Document approved successfully'
    });
}));

// PUT /api/documents/:id/reject - Reject document (admin only)
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
    
    const rejectResult = await document.reject(currentUser.id, review_notes);
    
    if (!rejectResult.success) {
        throw new Error(rejectResult.error);
    }
    
    res.json({
        success: true,
        message: 'Document rejected successfully'
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

module.exports = router;