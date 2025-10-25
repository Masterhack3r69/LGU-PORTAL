// controllers/examCertificateController.js - Exam Certificate controller
const ExamCertificate = require('../models/ExamCertificate');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { body, validationResult } = require('express-validator');

// Validation rules for exam certificate creation
const examCertificateCreationRules = [
    body('employee_id')
        .isInt({ min: 1 })
        .withMessage('Valid employee ID is required'),
    body('exam_name')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Exam name is required and must be less than 255 characters'),
    body('exam_type')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('Exam type must be less than 100 characters'),
    body('rating')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0, max: 100 })
        .withMessage('Rating must be a number between 0 and 100'),
    body('date_taken')
        .optional({ checkFalsy: true })
        .custom((value) => {
            if (!value) return true;
            if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return true;
            }
            throw new Error('Valid date is required (YYYY-MM-DD format)');
        }),
    body('place_of_examination')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 255 })
        .withMessage('Place of examination must be less than 255 characters'),
    body('license_number')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('License number must be less than 100 characters'),
    body('validity_date')
        .optional({ checkFalsy: true })
        .custom((value) => {
            if (!value) return true;
            if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return true;
            }
            throw new Error('Valid date is required (YYYY-MM-DD format)');
        })
];

// Validation rules for exam certificate updates
const examCertificateUpdateRules = [
    body('exam_name')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Exam name must be less than 255 characters'),
    body('exam_type')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('Exam type must be less than 100 characters'),
    body('rating')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0, max: 100 })
        .withMessage('Rating must be a number between 0 and 100'),
    body('date_taken')
        .optional({ checkFalsy: true })
        .custom((value) => {
            if (!value) return true;
            if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return true;
            }
            throw new Error('Valid date is required (YYYY-MM-DD format)');
        }),
    body('place_of_examination')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 255 })
        .withMessage('Place of examination must be less than 255 characters'),
    body('license_number')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('License number must be less than 100 characters'),
    body('validity_date')
        .optional({ checkFalsy: true })
        .custom((value) => {
            if (!value) return true;
            if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return true;
            }
            throw new Error('Valid date is required (YYYY-MM-DD format)');
        })
];

// GET /api/exam-certificates/employee/:employeeId - Get all exam certificates for an employee
const getExamCertificatesByEmployee = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    
    const result = await ExamCertificate.findByEmployeeId(employeeId);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    res.json({
        success: true,
        data: result.data,
        message: 'Exam certificates retrieved successfully'
    });
});

// GET /api/exam-certificates/:id - Get exam certificate by ID
const getExamCertificateById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await ExamCertificate.findById(id);
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    if (!result.data) {
        throw new NotFoundError('Exam certificate not found');
    }
    
    res.json({
        success: true,
        data: result.data,
        message: 'Exam certificate retrieved successfully'
    });
});

// POST /api/exam-certificates - Create new exam certificate
const createExamCertificate = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }
    
    const certificate = new ExamCertificate(req.body);
    const result = await certificate.save();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to create exam certificate');
    }
    
    res.status(201).json({
        success: true,
        data: result.data,
        message: 'Exam certificate created successfully'
    });
});

// PUT /api/exam-certificates/:id - Update exam certificate
const updateExamCertificate = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }
    
    const { id } = req.params;
    
    const existingResult = await ExamCertificate.findById(id);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Exam certificate not found');
    }
    
    const certificate = existingResult.data;
    Object.assign(certificate, req.body);
    certificate.id = id;
    
    const result = await certificate.save();
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to update exam certificate');
    }
    
    res.json({
        success: true,
        data: result.data,
        message: 'Exam certificate updated successfully'
    });
});

// DELETE /api/exam-certificates/:id - Delete exam certificate
const deleteExamCertificate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const existingResult = await ExamCertificate.findById(id);
    
    if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError('Exam certificate not found');
    }
    
    const result = await ExamCertificate.delete(id);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to delete exam certificate');
    }
    
    res.json({
        success: true,
        message: 'Exam certificate deleted successfully'
    });
});

module.exports = {
    getExamCertificatesByEmployee,
    getExamCertificateById,
    createExamCertificate,
    updateExamCertificate,
    deleteExamCertificate,
    examCertificateCreationRules,
    examCertificateUpdateRules
};
