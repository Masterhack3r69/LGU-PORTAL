// routes/jobRoutes.js - Job management routes
const express = require('express');
const authMiddleware = require('../middleware/auth');
const monthlyAccrualJob = require('../jobs/monthlyAccrualJob');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.requireAuth);

// GET /api/jobs/monthly-accrual/status - Get monthly accrual job status
router.get('/monthly-accrual/status', authMiddleware.requireAdmin, (req, res) => {
    const { year, month } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    
    const status = monthlyAccrualJob.getStatus(currentYear, currentMonth);
    res.json(status);
});

// POST /api/jobs/monthly-accrual/run - Run monthly accrual job
router.post('/monthly-accrual/run', authMiddleware.requireAdmin, async (req, res) => {
    const { year, month, employee_ids } = req.body;
    
    if (!year || !month) {
        return res.status(400).json({
            success: false,
            error: 'Year and month are required'
        });
    }
    
    try {
        const result = await monthlyAccrualJob.runAccrual(
            parseInt(year), 
            parseInt(month), 
            employee_ids
        );
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: 'Monthly accrual job completed successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                message: 'Failed to run monthly accrual job'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to run monthly accrual job'
        });
    }
});

// POST /api/jobs/monthly-accrual/dry-run - Dry run monthly accrual job
router.post('/monthly-accrual/dry-run', authMiddleware.requireAdmin, async (req, res) => {
    const { year, month, employee_ids } = req.body;
    
    if (!year || !month) {
        return res.status(400).json({
            success: false,
            error: 'Year and month are required'
        });
    }
    
    try {
        const result = await monthlyAccrualJob.dryRun(
            parseInt(year), 
            parseInt(month), 
            employee_ids
        );
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: 'Monthly accrual dry run completed successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                message: 'Failed to run monthly accrual dry run'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to run monthly accrual dry run'
        });
    }
});

module.exports = router;