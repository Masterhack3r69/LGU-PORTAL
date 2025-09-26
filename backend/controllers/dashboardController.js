const { executeQuery } = require('../config/database');

class DashboardController {
  // Get admin dashboard statistics
  async getAdminDashboardStats(req, res) {
    try {
      // Get total and active employees
      const employeeStatsResult = await executeQuery(`
        SELECT 
          COUNT(*) as total_employees,
          SUM(CASE WHEN employment_status = 'Active' THEN 1 ELSE 0 END) as active_employees,
          SUM(CASE WHEN employment_status = 'Retired' THEN 1 ELSE 0 END) as retired_employees,
          SUM(CASE WHEN employment_status = 'Resigned' THEN 1 ELSE 0 END) as resigned_employees,
          SUM(CASE WHEN employment_status = 'Terminated' THEN 1 ELSE 0 END) as terminated_employees,
          SUM(CASE WHEN employment_status = 'AWOL' THEN 1 ELSE 0 END) as awol_employees
        FROM employees 
        WHERE deleted_at IS NULL
      `);
      
      if (!employeeStatsResult.success) {
        throw new Error('Failed to fetch employee statistics');
      }
      
      const employeeStats = employeeStatsResult.data[0];

      // Get pending leave applications
      const leaveStatsResult = await executeQuery(`
        SELECT COUNT(*) as pending_applications
        FROM leave_applications 
        WHERE status = 'Pending'
      `);
      
      if (!leaveStatsResult.success) {
        throw new Error('Failed to fetch leave statistics');
      }
      
      const leaveStats = leaveStatsResult.data[0];

      // Get pending documents
      const documentStatsResult = await executeQuery(`
        SELECT COUNT(*) as pending_documents
        FROM employee_documents 
        WHERE status = 'Pending'
      `);
      
      if (!documentStatsResult.success) {
        throw new Error('Failed to fetch document statistics');
      }
      
      const documentStats = documentStatsResult.data[0];

      // Get recent activities from audit logs
      const recentActivitiesResult = await executeQuery(`
        SELECT 
          id,
          action,
          table_name,
          COALESCE(JSON_UNQUOTE(JSON_EXTRACT(new_values, '$.description')), action) as description,
          (SELECT username FROM users WHERE id = audit_logs.user_id) as user,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as timestamp,
          created_at
        FROM audit_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY created_at DESC 
        LIMIT 15
      `);
      
      const recentActivities = recentActivitiesResult.success ? recentActivitiesResult.data : [];

      // Get monthly statistics
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const monthlyStatsResult = await executeQuery(`
        SELECT 
          (SELECT COUNT(*) FROM employees 
           WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND deleted_at IS NULL) as new_employees,
          (SELECT COUNT(*) FROM leave_applications 
           WHERE MONTH(applied_at) = ? AND YEAR(applied_at) = ?) as leave_applications,
          (SELECT COUNT(*) FROM employee_trainings 
           WHERE MONTH(end_date) = ? AND YEAR(end_date) = ?) as completed_trainings
      `, [currentMonth, currentYear, currentMonth, currentYear, currentMonth, currentYear]);
      
      if (!monthlyStatsResult.success) {
        throw new Error('Failed to fetch monthly statistics');
      }
      
      const monthlyStats = monthlyStatsResult.data[0];

      // Check if payroll has been processed this month
      const payrollStatusResult = await executeQuery(`
        SELECT COUNT(*) as processed_count
        FROM payroll_periods 
        WHERE MONTH(start_date) = ? AND YEAR(start_date) = ? AND status = 'Completed'
      `, [currentMonth, currentYear]);
      
      if (!payrollStatusResult.success) {
        throw new Error('Failed to fetch payroll status');
      }
      
      const payrollStatus = payrollStatusResult.data[0];

      // Format recent activities
      const formattedActivities = recentActivities.map(activity => ({
        id: activity.id.toString(),
        type: DashboardController.mapActionToType(activity.action, activity.table_name),
        title: DashboardController.formatActivityTitle(activity.action, activity.table_name),
        description: DashboardController.formatActivityDescription(activity.action, activity.table_name),
        timestamp: DashboardController.formatTimestamp(activity.created_at),
        user: activity.user
      }));

      const dashboardStats = {
        totalEmployees: employeeStats.total_employees,
        activeEmployees: employeeStats.active_employees,
        pendingLeaveApplications: leaveStats.pending_applications,
        pendingDocuments: documentStats.pending_documents,
        monthlyPayrollStatus: payrollStatus.processed_count > 0 ? 'completed' : 'pending',
        systemHealth: 'good', // This could be enhanced with actual system checks
        recentActivities: formattedActivities,
        employmentStatusBreakdown: {
          active: employeeStats.active_employees,
          retired: employeeStats.retired_employees,
          resigned: employeeStats.resigned_employees,
          terminated: employeeStats.terminated_employees,
          awol: employeeStats.awol_employees
        },
        monthlyStats: {
          newEmployees: monthlyStats.new_employees,
          leaveApplications: monthlyStats.leave_applications,
          completedTrainings: monthlyStats.completed_trainings,
          payrollProcessed: payrollStatus.processed_count > 0
        }
      };


      res.json({
        success: true,
        data: dashboardStats,
        message: 'Admin dashboard stats retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch admin dashboard statistics',
        message: error.message
      });
    }
  }

  // Get employee dashboard statistics
  async getEmployeeDashboardStats(req, res) {
    try {
      const employeeId = req.query.employee_id || req.user.employee_id;
      
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID is required'
        });
      }
      // Get leave balance
      const leaveBalanceResult = await executeQuery(`
        SELECT COALESCE(SUM(current_balance), 0) as total_balance
        FROM employee_leave_balances 
        WHERE employee_id = ? AND year = YEAR(CURDATE())
      `, [employeeId]);
      
      const leaveBalance = leaveBalanceResult.success ? leaveBalanceResult.data[0] : { total_balance: 0 };

      // Get pending leave applications
      const pendingApplicationsResult = await executeQuery(`
        SELECT COUNT(*) as pending_count
        FROM leave_applications 
        WHERE employee_id = ? AND status = 'Pending'
      `, [employeeId]);
      
      const pendingApplications = pendingApplicationsResult.success ? pendingApplicationsResult.data[0] : { pending_count: 0 };

      // Get training statistics
      const trainingStatsResult = await executeQuery(`
        SELECT 
          COUNT(*) as total_trainings,
          SUM(CASE WHEN end_date <= CURDATE() THEN 1 ELSE 0 END) as completed_trainings
        FROM employee_trainings 
        WHERE employee_id = ?
      `, [employeeId]);
      
      const trainingStats = trainingStatsResult.success ? trainingStatsResult.data[0] : { total_trainings: 0, completed_trainings: 0 };

      // Get recent activities for the employee
      const recentActivitiesResult = await executeQuery(`
        SELECT 
          'leave' as type,
          CONCAT('Leave Application ', 
            CASE 
              WHEN status = 'Approved' THEN 'Approved'
              WHEN status = 'Rejected' THEN 'Rejected'
              ELSE 'Submitted'
            END
          ) as title,
          CONCAT('Your ', leave_type, ' leave application has been ', LOWER(status)) as description,
          status,
          DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as timestamp,
          updated_at
        FROM leave_applications 
        WHERE employee_id = ?
        
        UNION ALL
        
        SELECT 
          'training' as type,
          CONCAT('Training ', 
            CASE 
              WHEN end_date <= CURDATE() THEN 'Completed'
              WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 'In Progress'
              ELSE 'Enrolled'
            END
          ) as title,
          CONCAT(training_title, ' training has been ', 
            CASE 
              WHEN end_date <= CURDATE() THEN 'completed'
              WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 'started'
              ELSE 'scheduled'
            END
          ) as description,
          CASE 
            WHEN end_date <= CURDATE() THEN 'completed'
            WHEN start_date <= CURDATE() AND end_date >= CURDATE() THEN 'in_progress'
            ELSE 'enrolled'
          END as status,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as timestamp,
          created_at as updated_at
        FROM employee_trainings
        WHERE employee_id = ?
        
        ORDER BY updated_at DESC 
        LIMIT 10
      `, [employeeId, employeeId]);
      
      const recentActivities = recentActivitiesResult.success ? recentActivitiesResult.data : [];

      // Calculate profile completion (basic calculation)
      const profileDataResult = await executeQuery(`
        SELECT 
          first_name, last_name, email_address, contact_number, 
          current_address, birth_date, civil_status, tin, 
          gsis_number, pagibig_number, philhealth_number, sss_number
        FROM employees 
        WHERE id = ?
      `, [employeeId]);

      let profileCompletion = 0;
      if (profileDataResult.success && profileDataResult.data.length > 0) {
        const profile = profileDataResult.data[0];
        const fields = Object.values(profile);
        const filledFields = fields.filter(field => field !== null && field !== '').length;
        profileCompletion = Math.round((filledFields / fields.length) * 100);
      }

      // Format recent activities
      const formattedActivities = recentActivities.map((activity, index) => ({
        id: (index + 1).toString(),
        type: activity.type,
        title: activity.title,
        description: activity.description,
        timestamp: DashboardController.formatTimestamp(activity.updated_at),
        status: activity.status ? activity.status.toLowerCase() : undefined
      }));

      const employeeStats = {
        totalLeaveBalance: leaveBalance.total_balance,
        pendingApplications: pendingApplications.pending_count,
        completedTrainings: trainingStats.completed_trainings || 0,
        totalTrainings: trainingStats.total_trainings || 0,
        profileCompletion: profileCompletion,
        recentActivities: formattedActivities
      };

      res.json({
        success: true,
        data: employeeStats,
        message: 'Employee dashboard stats retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching employee dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch employee dashboard statistics',
        message: error.message
      });
    }
  }

  // Get system health status
  async getSystemHealth(req, res) {
    try {
      // Check database connection
      const dbTestResult = await executeQuery('SELECT 1');
      
      if (!dbTestResult.success) {
        throw new Error('Database connection failed');
      }
      
      // Get database stats
      const dbStatsResult = await executeQuery(`
        SELECT 
          COUNT(*) as total_tables
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `);

      const health = {
        status: 'good',
        services: [
          {
            name: 'Database',
            status: 'online',
            lastCheck: new Date().toISOString()
          },
          {
            name: 'File System',
            status: 'online',
            lastCheck: new Date().toISOString()
          },
          {
            name: 'Session Store',
            status: 'online',
            lastCheck: new Date().toISOString()
          }
        ]
      };

      res.json({
        success: true,
        data: health,
        message: 'System health retrieved successfully'
      });

    } catch (error) {
      console.error('Error checking system health:', error);
      
      const health = {
        status: 'critical',
        services: [
          {
            name: 'Database',
            status: 'offline',
            lastCheck: new Date().toISOString()
          }
        ]
      };

      res.status(503).json({
        success: false,
        error: 'System health check failed',
        data: health
      });
    }
  }

  // Get quick statistics
  async getQuickStats(req, res) {
    try {
      const statsResult = await executeQuery(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE is_active = 1) as total_users,
          (SELECT COUNT(*) FROM employees WHERE employment_status = 'Active' AND deleted_at IS NULL) as active_users,
          (SELECT COUNT(*) FROM audit_logs WHERE DATE(created_at) = CURDATE()) as today_logins
      `);

      if (!statsResult.success) {
        throw new Error('Failed to fetch quick statistics');
      }

      const stats = statsResult.data[0];
      const quickStats = {
        totalUsers: stats.total_users,
        activeUsers: stats.active_users,
        todayLogins: stats.today_logins,
        systemUptime: process.uptime()
      };

      res.json({
        success: true,
        data: quickStats,
        message: 'Quick stats retrieved successfully'
      });

    } catch (error) {
      console.error('Error fetching quick stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quick statistics',
        message: error.message
      });
    }
  }

  // Helper methods
  static mapActionToType(action, tableName) {
    if (tableName && tableName.includes('employee')) return 'employee';
    if (tableName && tableName.includes('leave')) return 'leave';
    if (tableName && tableName.includes('payroll')) return 'payroll';
    if (tableName && tableName.includes('training')) return 'training';
    if (action.includes('employee') || action.includes('Employee')) return 'employee';
    if (action.includes('leave') || action.includes('Leave')) return 'leave';
    if (action.includes('payroll') || action.includes('Payroll')) return 'payroll';
    if (action.includes('training') || action.includes('Training')) return 'training';
    return 'system';
  }

  static formatActivityTitle(action, tableName) {
    // Create user-friendly titles based on action and table
    const actionMap = {
      'CREATE': 'Created',
      'UPDATE': 'Updated', 
      'DELETE': 'Deleted',
      'CREATE_PAYROLL_ITEM': 'Processed',
      'UPDATE_PAYROLL_ITEM': 'Updated',
      'CREATE_PAYROLL_PERIOD': 'Created'
    };

    const tableMap = {
      'employees': 'Employee Record',
      'leave_applications': 'Leave Application',
      'payroll_items': 'Payroll Item',
      'payroll_periods': 'Payroll Period',
      'training_records': 'Training Record',
      'users': 'User Account'
    };

    const actionText = actionMap[action] || action.replace(/_/g, ' ').toLowerCase();
    const tableText = tableMap[tableName] || tableName?.replace(/_/g, ' ') || 'Record';

    return `${actionText} ${tableText}`;
  }

  static formatActivityDescription(action, tableName) {
    // Create descriptive text for activities
    const descriptions = {
      'CREATE_employees': 'A new employee was added to the system',
      'UPDATE_employees': 'Employee information was updated',
      'CREATE_leave_applications': 'A new leave application was submitted',
      'UPDATE_leave_applications': 'Leave application status was changed',
      'CREATE_PAYROLL_ITEM': 'Payroll was processed for an employee',
      'UPDATE_PAYROLL_ITEM': 'Payroll information was updated',
      'CREATE_PAYROLL_PERIOD': 'A new payroll period was created',
      'CREATE_training_records': 'Training record was created',
      'UPDATE_training_records': 'Training record was updated'
    };

    const key = `${action}_${tableName}`;
    return descriptions[key] || descriptions[action] || `System performed ${action.toLowerCase().replace(/_/g, ' ')} operation`;
  }

  static formatTimestamp(timestamp) {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return activityTime.toLocaleDateString();
  }
}

module.exports = new DashboardController();