const { Training, TrainingProgram } = require('../models/Training');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { body, validationResult, query } = require('express-validator');
const helpers = require('../utils/helpers');

// Validation rules for training records
const trainingValidationRules = [
    body('employee_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid employee ID is required'),
    body('training_title')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Training title is required and must be less than 255 characters'),
    body('start_date')
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage('Valid start date is required'),
    body('end_date')
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage('Valid end date is required')
        .custom((value, { req }) => {
            if (!value || !req.body.start_date) return true;
            const endDate = new Date(value);
            const startDate = new Date(req.body.start_date);
            if (endDate < startDate) {
                throw new Error('End date must be after or equal to start date');
            }
            return true;
        }),
    body('training_program_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Training program ID must be a valid integer'),
    body('duration_hours')
        .optional()
        .isFloat({ min: 0, max: 999.99 })
        .withMessage('Duration hours must be between 0 and 999.99'),
    body('venue')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Venue must be less than 255 characters'),
    body('organizer')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Organizer must be less than 255 characters'),
    body('training_type')
        .optional()
        .isIn(['Internal', 'External', 'Online', 'Seminar', 'Workshop'])
        .withMessage('Valid training type is required (Internal, External, Online, Seminar, Workshop)'),
    body('certificate_issued')
        .optional()
        .isBoolean()
        .withMessage('Certificate issued must be a boolean'),
    body('certificate_number')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Certificate number must be less than 100 characters')
];

// Validation rules for training programs
const trainingProgramValidationRules = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Training program title is required and must be less than 255 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    body('duration_hours')
        .optional()
        .isInt({ min: 0, max: 999 })
        .withMessage('Duration hours must be between 0 and 999'),
    body('training_type')
        .isIn(['Internal', 'External', 'Online', 'Seminar', 'Workshop'])
        .withMessage('Valid training type is required (Internal, External, Online, Seminar, Workshop)')
];

// GET /api/trainings - Get all training records with filtering
const getAllTrainings = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        employee_id,
        training_program_id,
        training_type,
        start_date,
        end_date,
        year,
        search,
        certificate_issued,
        sort_by,
        sort_order
    } = req.query;

    const currentUser = req.session.user;

    const filters = {};

    // Role-based access control - employees can only access their own training records
    if (currentUser.role !== 'admin') {
        filters.employee_id = currentUser.employee_id;
    } else if (employee_id) {
        filters.employee_id = employee_id;
    }

    // Apply filters
    if (training_program_id) filters.training_program_id = training_program_id;
    if (training_type) filters.training_type = training_type;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (year) filters.year = year;
    if (search) filters.search = search;
    if (certificate_issued !== undefined) filters.certificate_issued = certificate_issued === 'true';
    if (sort_by) filters.sort_by = sort_by;
    if (sort_order) filters.sort_order = sort_order;

    // Add pagination
    const pagination = helpers.generatePagination(page, limit, 0);
    
    // Get total count for pagination (without pagination filters)
    const totalCount = await Training.getCount(filters);
    const updatedPagination = helpers.generatePagination(page, limit, totalCount);

    // Add pagination to filters for findAll
    const findAllFilters = { ...filters };
    findAllFilters.limit = pagination.pageSize;
    findAllFilters.offset = pagination.offset;

    const result = await Training.findAll(findAllFilters);

    if (!result.success) {
        throw new Error(result.error);
    }

    res.json({
        success: true,
        data: result.data,
        pagination: updatedPagination
    });
});

// GET /api/trainings/:id - Get training record by ID
const getTrainingById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.session.user;

    const result = await Training.findById(id);

    if (!result.success) {
        throw new Error(result.error);
    }

    if (!result.data) {
        throw new NotFoundError('Training record not found');
    }

    const training = result.data;

    // Check if user can access this training record
    if (currentUser.role !== 'admin' && training.employee_id !== currentUser.employee_id) {
        throw new ValidationError('Access denied - employees can only access their own training records');
    }

    res.json({
        success: true,
        data: training
    });
});

// GET /api/trainings/employee/:employeeId - Get employee training history
const getEmployeeTrainings = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { year } = req.query;
    const currentUser = req.session.user;

    // Check if user can access this employee's training records
    if (currentUser.role !== 'admin' && parseInt(employeeId) !== currentUser.employee_id) {
        throw new ValidationError('Access denied - employees can only access their own training records');
    }

    const result = await Training.getEmployeeTrainings(employeeId, year);

    if (!result.success) {
        throw new Error(result.error);
    }

    res.json({
        success: true,
        data: result.data
    });
});

// GET /api/trainings/statistics - Get training statistics
const getTrainingStatistics = asyncHandler(async (req, res) => {
    const { year, employee_id } = req.query;
    const currentUser = req.session.user;

    const filters = {};

    // Role-based access control for statistics
    if (currentUser.role !== 'admin') {
        filters.employee_id = currentUser.employee_id;
    } else if (employee_id) {
        filters.employee_id = employee_id;
    }

    if (year) filters.year = year;

    const result = await Training.getStatistics(filters);

    if (!result.success) {
        throw new Error(result.error);
    }

    res.json({
        success: true,
        data: result.data
    });
});

// POST /api/trainings - Create new training record (admin only)
const createTraining = asyncHandler(async (req, res) => {
    // Additional validation for employee_id
    if (!req.body.employee_id || req.body.employee_id < 1) {
        throw new ValidationError('Valid employee ID is required');
    }

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const trainingData = {
        employee_id: req.body.employee_id,
        training_program_id: req.body.training_program_id,
        training_title: req.body.training_title,
        training_type: req.body.training_type,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        duration_hours: req.body.duration_hours,
        venue: req.body.venue,
        organizer: req.body.organizer,
        certificate_issued: req.body.certificate_issued,
        certificate_number: req.body.certificate_number
    };

    const training = new Training(trainingData);
    const result = await training.save();

    if (!result.success) {
        throw new Error(result.error);
    }

    res.status(201).json({
        success: true,
        data: result.data,
        message: 'Training record created successfully'
    });
});

// PUT /api/trainings/:id - Update training record (admin only)
const updateTraining = asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;

    // First, get the existing training record
    const existingResult = await Training.findById(id);
    if (!existingResult.success) {
        throw new Error(existingResult.error);
    }

    if (!existingResult.data) {
        throw new NotFoundError('Training record not found');
    }

    const existingTraining = existingResult.data;

    const trainingData = {
        id: parseInt(id),
        employee_id: req.body.employee_id || existingTraining.employee_id,
        training_program_id: req.body.training_program_id,
        training_title: req.body.training_title,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        duration_hours: req.body.duration_hours,
        venue: req.body.venue,
        organizer: req.body.organizer,
        certificate_issued: req.body.certificate_issued,
        certificate_number: req.body.certificate_number
    };

    const training = new Training(trainingData);
    const result = await training.save();

    if (!result.success) {
        throw new Error(result.error);
    }

    res.json({
        success: true,
        data: result.data,
        message: 'Training record updated successfully'
    });
});

// DELETE /api/trainings/:id - Delete training record (admin only)
const deleteTraining = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // First, get the existing training record
    const existingResult = await Training.findById(id);
    if (!existingResult.success) {
        throw new Error(existingResult.error);
    }

    if (!existingResult.data) {
        throw new NotFoundError('Training record not found');
    }

    const result = await Training.delete(id);

    if (!result.success) {
        throw new Error(result.error);
    }

    res.json({
        success: true,
        message: 'Training record deleted successfully'
    });
});

// TRAINING PROGRAM ROUTES

// GET /api/training-programs - Get all training programs
const getAllTrainingPrograms = asyncHandler(async (req, res) => {
    const result = await TrainingProgram.findAll();

    if (!result.success) {
        throw new Error(result.error);
    }

    res.json({
        success: true,
        data: result.data
    });
});

// GET /api/training-programs/:id - Get training program by ID
const getTrainingProgramById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await TrainingProgram.findById(id);

    if (!result.success) {
        throw new Error(result.error);
    }

    if (!result.data) {
        throw new NotFoundError('Training program not found');
    }

    res.json({
        success: true,
        data: result.data
    });
});

// POST /api/training-programs - Create new training program (admin only)
const createTrainingProgram = asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const programData = {
        title: req.body.title,
        description: req.body.description,
        duration_hours: req.body.duration_hours,
        training_type: req.body.training_type
    };

    const program = new TrainingProgram(programData);
    const result = await program.save();

    if (!result.success) {
        throw new Error(result.error);
    }

    res.status(201).json({
        success: true,
        data: result.data,
        message: 'Training program created successfully'
    });
});

// PUT /api/training-programs/:id - Update training program (admin only)
const updateTrainingProgram = asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;

    const programData = {
        id: parseInt(id),
        title: req.body.title,
        description: req.body.description,
        duration_hours: req.body.duration_hours,
        training_type: req.body.training_type
    };

    const program = new TrainingProgram(programData);
    const result = await program.save();

    if (!result.success) {
        throw new Error(result.error);
    }

    res.json({
        success: true,
        data: result.data,
        message: 'Training program updated successfully'
    });
});

// DELETE /api/training-programs/:id - Delete training program (admin only)
const deleteTrainingProgram = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await TrainingProgram.delete(id);

    if (!result.success) {
        if (result.constraint === 'FOREIGN_KEY_CONSTRAINT') {
            throw new ValidationError(result.error);
        }
        throw new Error(result.error);
    }

    res.json({
        success: true,
        message: 'Training program deleted successfully'
    });
});

module.exports = {
    // Training record routes
    getAllTrainings,
    getTrainingById,
    getEmployeeTrainings,
    getTrainingStatistics,
    createTraining,
    updateTraining,
    deleteTraining,
    trainingValidationRules,
    
    // Training program routes
    getAllTrainingPrograms,
    getTrainingProgramById,
    createTrainingProgram,
    updateTrainingProgram,
    deleteTrainingProgram,
    trainingProgramValidationRules
};