// jobs/monthlyAccrualJob.js - Monthly leave accrual job system
const cron = require('node-cron');
const { executeQuery } = require('../config/database');
const { LeaveBalance } = require('../models/Leave');

class MonthlyAccrualJob {
    constructor() {
        this.isRunning = false;
        this.lastRun = null;
        this.processingHistory = [];
    }

    // Get all active employees who should receive accrual
    async getEligibleEmployees(year, month) {
        // Get employees who have existing leave balances (idempotent check)
        const query = `
            SELECT DISTINCT e.id as employee_id, e.employee_number, 
                   CONCAT(e.first_name, ' ', IFNULL(e.middle_name, ''), ' ', e.last_name) as employee_name
            FROM employees e
            JOIN employee_leave_balances elb ON e.id = elb.employee_id
            WHERE e.employment_status = 'Active'
              AND elb.year = ?
        `;
        
        const result = await executeQuery(query, [year]);
        return result.success ? result.data : [];
    }

    // Process accrual for a single employee
    async processEmployeeAccrual(employeeId, year, month) {
        try {
            const result = await LeaveBalance.processMonthlyAccrual(employeeId, year, month);
            
            // Log the accrual operation
            if (result.success) {
                await this.logAccrualOperation(employeeId, year, month, 'SUCCESS', result);
            } else {
                await this.logAccrualOperation(employeeId, year, month, 'FAILED', result);
            }
            
            return {
                success: result.success,
                employee_id: employeeId,
                message: result.message,
                error: result.error
            };
        } catch (error) {
            await this.logAccrualOperation(employeeId, year, month, 'ERROR', { error: error.message });
            return {
                success: false,
                employee_id: employeeId,
                error: error.message
            };
        }
    }

    // Log accrual operation to audit logs
    async logAccrualOperation(employeeId, year, month, status, details) {
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
                `MONTHLY_ACCRUAL_${status}`,
                'employee_leave_balances',
                employeeId,
                null,
                JSON.stringify({ employee_id: employeeId, year, month, status, details }),
                '127.0.0.1', // System IP
                'Monthly Accrual Job'
            ];

            await executeQuery(auditQuery, auditParams);
        } catch (error) {
            console.error('Failed to log accrual operation:', error);
        }
    }

    // Run accrual for all eligible employees
    async runAccrual(year, month, employeeIds = null) {
        if (this.isRunning) {
            throw new Error('Monthly accrual job is already running');
        }

        this.isRunning = true;
        const startTime = new Date();
        
        try {
            // Get eligible employees
            let employees = await this.getEligibleEmployees(year, month);
            
            // If specific employee IDs are provided, filter the list
            if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
                employees = employees.filter(emp => employeeIds.includes(emp.employee_id));
            }
            
            const results = {
                total_employees: employees.length,
                successful: 0,
                failed: 0,
                details: [],
                summary: {
                    total_projected_vl: 0,
                    total_projected_sl: 0,
                    year: year,
                    month: month
                }
            };
            
            // Process accrual for each employee
            for (const employee of employees) {
                try {
                    const accrualResult = await this.processEmployeeAccrual(employee.employee_id, year, month);
                    results.details.push({
                        ...accrualResult,
                        employee_number: employee.employee_number,
                        employee_name: employee.employee_name
                    });
                    
                    if (accrualResult.success) {
                        results.successful++;
                        
                        // Calculate actual accrual amounts from detailed results
                        if (accrualResult.results && Array.isArray(accrualResult.results)) {
                            accrualResult.results.forEach(r => {
                                if (r.leave_type === 'VL') {
                                    results.summary.total_projected_vl += r.accrual_amount || 0;
                                } else if (r.leave_type === 'SL') {
                                    results.summary.total_projected_sl += r.accrual_amount || 0;
                                }
                            });
                        } else {
                            // Fallback to default amounts if detailed results not available
                            results.summary.total_projected_vl += 1.25;
                            results.summary.total_projected_sl += 1.25;
                        }
                    } else {
                        results.failed++;
                    }
                } catch (error) {
                    results.details.push({
                        success: false,
                        employee_id: employee.employee_id,
                        employee_number: employee.employee_number,
                        employee_name: employee.employee_name,
                        error: error.message
                    });
                    results.failed++;
                }
            }
            
            // Record processing history
            const endTime = new Date();
            this.processingHistory.push({
                run_date: startTime,
                end_date: endTime,
                year: year,
                month: month,
                ...results
            });
            
            this.lastRun = endTime;
            return { success: true, data: results };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            this.isRunning = false;
        }
    }

    // Dry run to see what would be processed without actually processing
    async dryRun(year, month, employeeIds = null) {
        const employees = await this.getEligibleEmployees(year, month);
        
        // If specific employee IDs are provided, filter the list
        let filteredEmployees = employees;
        if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
            filteredEmployees = employees.filter(emp => employeeIds.includes(emp.employee_id));
        }
        
        return {
            success: true,
            data: {
                eligible_employees: filteredEmployees,
                summary: {
                    total_eligible: filteredEmployees.length,
                    total_projected_vl: filteredEmployees.length * 1.25,
                    total_projected_sl: filteredEmployees.length * 1.25,
                    year: year,
                    month: month
                }
            }
        };
    }

    // Get job status
    getStatus(year, month) {
        const currentMonthProcessed = this.processingHistory.some(
            record => record.year === year && record.month === month
        );
        
        return {
            success: true,
            data: {
                is_running: this.isRunning,
                last_run: this.lastRun,
                current_month_processed: currentMonthProcessed,
                processing_history: this.processingHistory.slice(-10), // Last 10 runs
                next_scheduled_run: this.getNextRunDate()
            }
        };
    }

    // Calculate next scheduled run date (first day of next month at 2 AM)
    getNextRunDate() {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 2, 0, 0);
        return nextMonth;
    }

    // Start the scheduled job (runs on the 1st of each month at 2:00 AM)
    startScheduledJob() {
        // Schedule job to run on the 1st of each month at 2:00 AM
        cron.schedule('0 2 1 * *', async () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1; // JavaScript months are 0-indexed
            
            console.log(`📅 Monthly Accrual Job triggered for ${year}-${month}`);
            
            try {
                const result = await this.runAccrual(year, month);
                if (result.success) {
                    console.log(`✅ Monthly Accrual Job completed successfully for ${year}-${month}`);
                    console.log(`   Processed: ${result.data.total_employees} employees`);
                    console.log(`   Successful: ${result.data.successful}`);
                    console.log(`   Failed: ${result.data.failed}`);
                } else {
                    console.error(`❌ Monthly Accrual Job failed for ${year}-${month}: ${result.error}`);
                }
            } catch (error) {
                console.error(`💥 Monthly Accrual Job crashed for ${year}-${month}: ${error.message}`);
            }
        }, {
            timezone: "Asia/Manila" // Adjust to your timezone
        });
        
        console.log('⏰ Monthly Accrual Job scheduled to run on the 1st of each month at 2:00 AM');
    }
}

// Export singleton instance
module.exports = new MonthlyAccrualJob();