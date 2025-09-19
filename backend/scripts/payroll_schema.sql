-- Payroll Module Database Schema
-- This script creates all tables required for the payroll management system
-- Execute this script after the main EMS database schema

-- =====================================================================
-- PAYROLL PERIODS TABLE
-- Manages distinct payroll processing periods with status tracking
-- =====================================================================
CREATE TABLE IF NOT EXISTS `payroll_periods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` year NOT NULL,
  `month` tinyint NOT NULL COMMENT 'Month (1-12)',
  `period_number` tinyint NOT NULL COMMENT 'Period within month (1 or 2)',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `pay_date` date NOT NULL,
  `status` enum('Draft','Processing','Completed','Paid') NOT NULL DEFAULT 'Draft',
  `created_by` int NOT NULL,
  `finalized_by` int DEFAULT NULL,
  `finalized_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_period` (`year`,`month`,`period_number`),
  KEY `idx_payroll_periods_status` (`status`),
  KEY `idx_payroll_periods_dates` (`year`,`month`),
  KEY `idx_payroll_periods_created_by` (`created_by`),
  KEY `idx_payroll_periods_finalized_by` (`finalized_by`),
  CONSTRAINT `payroll_periods_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `payroll_periods_finalized_by_fk` FOREIGN KEY (`finalized_by`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_payroll_period_month` CHECK ((`month` >= 1 AND `month` <= 12)),
  CONSTRAINT `chk_payroll_period_number` CHECK ((`period_number` >= 1 AND `period_number` <= 2)),
  CONSTRAINT `chk_payroll_period_dates` CHECK ((`start_date` <= `end_date` AND `end_date` < `pay_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Payroll processing periods with status management';

-- =====================================================================
-- ALLOWANCE TYPES TABLE
-- Defines configurable allowance categories with calculation rules
-- =====================================================================
CREATE TABLE IF NOT EXISTS `allowance_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` text,
  `default_amount` decimal(12,2) DEFAULT NULL,
  `calculation_type` enum('Fixed','Percentage','Formula') NOT NULL DEFAULT 'Fixed',
  `percentage_base` enum('BasicPay','MonthlySalary','GrossPay') DEFAULT NULL COMMENT 'Base for percentage calculations',
  `is_taxable` boolean NOT NULL DEFAULT FALSE,
  `frequency` enum('Monthly','Annual','Conditional') NOT NULL DEFAULT 'Monthly',
  `is_active` boolean NOT NULL DEFAULT TRUE,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `allowance_types_name_unique` (`name`),
  UNIQUE KEY `allowance_types_code_unique` (`code`),
  KEY `idx_allowance_types_active` (`is_active`),
  KEY `idx_allowance_types_frequency` (`frequency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurable allowance types with calculation rules';

-- =====================================================================
-- DEDUCTION TYPES TABLE
-- Defines configurable deduction categories with compliance rules
-- =====================================================================
CREATE TABLE IF NOT EXISTS `deduction_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` text,
  `default_amount` decimal(12,2) DEFAULT NULL,
  `calculation_type` enum('Fixed','Percentage','Formula') NOT NULL DEFAULT 'Fixed',
  `percentage_base` enum('BasicPay','MonthlySalary','GrossPay') DEFAULT NULL COMMENT 'Base for percentage calculations',
  `is_mandatory` boolean NOT NULL DEFAULT FALSE,
  `frequency` enum('Monthly','Annual','Conditional') NOT NULL DEFAULT 'Monthly',
  `is_active` boolean NOT NULL DEFAULT TRUE,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deduction_types_name_unique` (`name`),
  UNIQUE KEY `deduction_types_code_unique` (`code`),
  KEY `idx_deduction_types_active` (`is_active`),
  KEY `idx_deduction_types_mandatory` (`is_mandatory`),
  KEY `idx_deduction_types_frequency` (`frequency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurable deduction types with compliance rules';

-- =====================================================================
-- EMPLOYEE ALLOWANCE OVERRIDES TABLE
-- Employee-specific allowance customization capabilities
-- =====================================================================
CREATE TABLE IF NOT EXISTS `employee_allowance_overrides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `allowance_type_id` int NOT NULL,
  `override_amount` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` boolean NOT NULL DEFAULT TRUE,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_allowance_effective` (`employee_id`,`allowance_type_id`,`effective_date`),
  KEY `idx_allowance_overrides_employee` (`employee_id`),
  KEY `idx_allowance_overrides_type` (`allowance_type_id`),
  KEY `idx_allowance_overrides_dates` (`effective_date`,`end_date`),
  KEY `idx_allowance_overrides_active` (`is_active`),
  KEY `idx_allowance_overrides_created_by` (`created_by`),
  CONSTRAINT `employee_allowance_overrides_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_allowance_overrides_type_fk` FOREIGN KEY (`allowance_type_id`) REFERENCES `allowance_types` (`id`),
  CONSTRAINT `employee_allowance_overrides_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_allowance_override_dates` CHECK ((`end_date` IS NULL OR `end_date` >= `effective_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Employee-specific allowance customizations';

-- =====================================================================
-- EMPLOYEE DEDUCTION OVERRIDES TABLE
-- Employee-specific deduction customization capabilities
-- =====================================================================
CREATE TABLE IF NOT EXISTS `employee_deduction_overrides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `deduction_type_id` int NOT NULL,
  `override_amount` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` boolean NOT NULL DEFAULT TRUE,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_deduction_effective` (`employee_id`,`deduction_type_id`,`effective_date`),
  KEY `idx_deduction_overrides_employee` (`employee_id`),
  KEY `idx_deduction_overrides_type` (`deduction_type_id`),
  KEY `idx_deduction_overrides_dates` (`effective_date`,`end_date`),
  KEY `idx_deduction_overrides_active` (`is_active`),
  KEY `idx_deduction_overrides_created_by` (`created_by`),
  CONSTRAINT `employee_deduction_overrides_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_deduction_overrides_type_fk` FOREIGN KEY (`deduction_type_id`) REFERENCES `deduction_types` (`id`),
  CONSTRAINT `employee_deduction_overrides_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_deduction_override_dates` CHECK ((`end_date` IS NULL OR `end_date` >= `effective_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Employee-specific deduction customizations';

-- =====================================================================
-- PAYROLL ITEMS TABLE
-- Central payroll records with computed compensation details
-- =====================================================================
CREATE TABLE IF NOT EXISTS `payroll_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_period_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `working_days` decimal(4,2) NOT NULL DEFAULT 22.00,
  `daily_rate` decimal(10,2) NOT NULL,
  `basic_pay` decimal(12,2) NOT NULL,
  `total_allowances` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_deductions` decimal(12,2) NOT NULL DEFAULT 0.00,
  `gross_pay` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Basic pay + allowances',
  `net_pay` decimal(12,2) NOT NULL,
  `status` enum('Draft','Processed','Finalized','Paid') NOT NULL DEFAULT 'Draft',
  `processed_by` int DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `paid_by` int DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_payroll_period_employee` (`payroll_period_id`,`employee_id`),
  KEY `idx_payroll_items_employee` (`employee_id`),
  KEY `idx_payroll_items_status` (`status`),
  KEY `idx_payroll_items_processed_by` (`processed_by`),
  KEY `idx_payroll_items_paid_by` (`paid_by`),
  KEY `idx_payroll_items_dates` (`processed_at`,`paid_at`),
  CONSTRAINT `payroll_items_period_fk` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payroll_items_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payroll_items_processed_by_fk` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `payroll_items_paid_by_fk` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_payroll_working_days` CHECK ((`working_days` >= 0 AND `working_days` <= 31)),
  CONSTRAINT `chk_payroll_amounts_positive` CHECK ((`daily_rate` >= 0 AND `basic_pay` >= 0 AND `total_allowances` >= 0 AND `total_deductions` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Central payroll records with computed compensation';

-- =====================================================================
-- PAYROLL ITEM LINES TABLE
-- Detailed breakdown of allowances, deductions, and adjustments
-- =====================================================================
CREATE TABLE IF NOT EXISTS `payroll_item_lines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_item_id` int NOT NULL,
  `line_type` enum('Allowance','Deduction','Adjustment') NOT NULL,
  `type_id` int DEFAULT NULL COMMENT 'References allowance_types or deduction_types',
  `description` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `is_override` boolean NOT NULL DEFAULT FALSE,
  `calculation_basis` varchar(100) DEFAULT NULL COMMENT 'How amount was calculated',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payroll_lines_item` (`payroll_item_id`),
  KEY `idx_payroll_lines_type` (`line_type`),
  KEY `idx_payroll_lines_type_id` (`type_id`),
  KEY `idx_payroll_lines_override` (`is_override`),
  CONSTRAINT `payroll_item_lines_item_fk` FOREIGN KEY (`payroll_item_id`) REFERENCES `payroll_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detailed breakdown of payroll line items';

-- =====================================================================
-- INSERT DEFAULT ALLOWANCE TYPES
-- Common allowance types used in government payroll
-- =====================================================================
INSERT INTO `allowance_types` (`name`, `code`, `description`, `default_amount`, `calculation_type`, `is_taxable`, `frequency`) VALUES
('Transportation Allowance', 'TRANS', 'Monthly transportation allowance for employees', 2000.00, 'Fixed', FALSE, 'Monthly'),
('Rice Allowance', 'RICE', 'Monthly rice subsidy allowance', 1500.00, 'Fixed', FALSE, 'Monthly'),
('Communication Allowance', 'COMM', 'Monthly communication allowance', 1000.00, 'Fixed', FALSE, 'Monthly'),
('Hazard Pay', 'HAZARD', 'Additional compensation for hazardous work', 0.00, 'Percentage', TRUE, 'Monthly'),
('Overtime Pay', 'OT', 'Overtime compensation', 0.00, 'Formula', TRUE, 'Monthly'),
('Night Differential', 'NIGHT', 'Night shift differential pay', 0.00, 'Percentage', TRUE, 'Monthly'),
('Holiday Pay', 'HOLIDAY', 'Holiday work compensation', 0.00, 'Formula', TRUE, 'Conditional'),
('Performance Bonus', 'PERF', 'Performance-based bonus', 0.00, 'Fixed', TRUE, 'Conditional');

-- =====================================================================
-- INSERT DEFAULT DEDUCTION TYPES
-- Common deduction types used in government payroll
-- =====================================================================
INSERT INTO `deduction_types` (`name`, `code`, `description`, `default_amount`, `calculation_type`, `is_mandatory`, `frequency`) VALUES
('Income Tax', 'ITAX', 'Monthly income tax withholding', 0.00, 'Formula', TRUE, 'Monthly'),
('GSIS Premium', 'GSIS', 'Government Service Insurance System premium', 0.00, 'Percentage', TRUE, 'Monthly'),
('Pag-IBIG', 'PAGIBIG', 'Pag-IBIG Fund contribution', 100.00, 'Fixed', TRUE, 'Monthly'),
('PhilHealth', 'PHILHEALTH', 'Philippine Health Insurance Corporation premium', 0.00, 'Percentage', TRUE, 'Monthly'),
('Union Dues', 'UNION', 'Labor union membership dues', 50.00, 'Fixed', FALSE, 'Monthly'),
('Loan Payment', 'LOAN', 'Various loan payments', 0.00, 'Fixed', FALSE, 'Monthly'),
('Salary Loan', 'SALARY_LOAN', 'Salary loan deduction', 0.00, 'Fixed', FALSE, 'Monthly'),
('Emergency Loan', 'EMERGENCY_LOAN', 'Emergency loan deduction', 0.00, 'Fixed', FALSE, 'Monthly'),
('Multipurpose Loan', 'MPL', 'Multipurpose loan deduction', 0.00, 'Fixed', FALSE, 'Monthly'),
('Policy Loan', 'POLICY_LOAN', 'Policy loan deduction', 0.00, 'Fixed', FALSE, 'Monthly');

-- =====================================================================
-- CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================================

-- Additional composite indexes for common queries
CREATE INDEX `idx_payroll_periods_year_month_status` ON `payroll_periods` (`year`, `month`, `status`);
CREATE INDEX `idx_payroll_items_period_status` ON `payroll_items` (`payroll_period_id`, `status`);
CREATE INDEX `idx_payroll_items_employee_status` ON `payroll_items` (`employee_id`, `status`);
CREATE INDEX `idx_allowance_overrides_employee_active` ON `employee_allowance_overrides` (`employee_id`, `is_active`);
CREATE INDEX `idx_deduction_overrides_employee_active` ON `employee_deduction_overrides` (`employee_id`, `is_active`);

-- =====================================================================
-- CREATE TRIGGERS FOR AUDIT LOGGING INTEGRATION
-- =====================================================================

DELIMITER $$

-- Trigger for payroll_periods audit logging
CREATE TRIGGER `tr_payroll_periods_insert` AFTER INSERT ON `payroll_periods`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`user_id`, `action`, `table_name`, `record_id`, `new_values`)
    VALUES (NEW.created_by, 'CREATE_PAYROLL_PERIOD', 'payroll_periods', NEW.id, 
            JSON_OBJECT('year', NEW.year, 'month', NEW.month, 'period_number', NEW.period_number, 
                       'start_date', NEW.start_date, 'end_date', NEW.end_date, 'pay_date', NEW.pay_date, 'status', NEW.status));
END$$

CREATE TRIGGER `tr_payroll_periods_update` AFTER UPDATE ON `payroll_periods`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`user_id`, `action`, `table_name`, `record_id`, `old_values`, `new_values`)
    VALUES (IFNULL(NEW.finalized_by, NEW.created_by), 'UPDATE_PAYROLL_PERIOD', 'payroll_periods', NEW.id,
            JSON_OBJECT('status', OLD.status, 'finalized_by', OLD.finalized_by, 'finalized_at', OLD.finalized_at),
            JSON_OBJECT('status', NEW.status, 'finalized_by', NEW.finalized_by, 'finalized_at', NEW.finalized_at));
END$$

-- Trigger for payroll_items audit logging
CREATE TRIGGER `tr_payroll_items_insert` AFTER INSERT ON `payroll_items`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`user_id`, `action`, `table_name`, `record_id`, `new_values`)
    VALUES (IFNULL(NEW.processed_by, 1), 'CREATE_PAYROLL_ITEM', 'payroll_items', NEW.id,
            JSON_OBJECT('payroll_period_id', NEW.payroll_period_id, 'employee_id', NEW.employee_id, 
                       'working_days', NEW.working_days, 'basic_pay', NEW.basic_pay, 'net_pay', NEW.net_pay, 'status', NEW.status));
END$$

CREATE TRIGGER `tr_payroll_items_update` AFTER UPDATE ON `payroll_items`
FOR EACH ROW
BEGIN
    INSERT INTO `audit_logs` (`user_id`, `action`, `table_name`, `record_id`, `old_values`, `new_values`)
    VALUES (IFNULL(NEW.processed_by, IFNULL(NEW.paid_by, 1)), 'UPDATE_PAYROLL_ITEM', 'payroll_items', NEW.id,
            JSON_OBJECT('working_days', OLD.working_days, 'basic_pay', OLD.basic_pay, 'net_pay', OLD.net_pay, 'status', OLD.status),
            JSON_OBJECT('working_days', NEW.working_days, 'basic_pay', NEW.basic_pay, 'net_pay', NEW.net_pay, 'status', NEW.status));
END$$

DELIMITER ;

-- =====================================================================
-- CREATE VIEWS FOR REPORTING AND ANALYTICS
-- =====================================================================

-- View for payroll summary by period
CREATE OR REPLACE VIEW `v_payroll_period_summary` AS
SELECT 
    pp.id,
    pp.year,
    pp.month,
    pp.period_number,
    pp.start_date,
    pp.end_date,
    pp.pay_date,
    pp.status,
    COUNT(pi.id) as employee_count,
    COALESCE(SUM(pi.basic_pay), 0) as total_basic_pay,
    COALESCE(SUM(pi.total_allowances), 0) as total_allowances,
    COALESCE(SUM(pi.total_deductions), 0) as total_deductions,
    COALESCE(SUM(pi.gross_pay), 0) as total_gross_pay,
    COALESCE(SUM(pi.net_pay), 0) as total_net_pay,
    pp.created_at,
    CONCAT(u1.username) as created_by_username,
    CONCAT(u2.username) as finalized_by_username
FROM payroll_periods pp
LEFT JOIN payroll_items pi ON pp.id = pi.payroll_period_id
LEFT JOIN users u1 ON pp.created_by = u1.id
LEFT JOIN users u2 ON pp.finalized_by = u2.id
GROUP BY pp.id, pp.year, pp.month, pp.period_number, pp.start_date, pp.end_date, 
         pp.pay_date, pp.status, pp.created_at, u1.username, u2.username;

-- View for employee payroll details with names
CREATE OR REPLACE VIEW `v_employee_payroll_details` AS
SELECT 
    pi.id,
    pi.payroll_period_id,
    pp.year,
    pp.month,
    pp.period_number,
    pp.start_date,
    pp.end_date,
    pp.pay_date,
    pi.employee_id,
    e.employee_number,
    CONCAT(e.first_name, ' ', IFNULL(e.middle_name, ''), ' ', e.last_name) as employee_name,
    e.plantilla_position,
    pi.working_days,
    pi.daily_rate,
    pi.basic_pay,
    pi.total_allowances,
    pi.total_deductions,
    pi.gross_pay,
    pi.net_pay,
    pi.status,
    pi.processed_at,
    pi.paid_at,
    CONCAT(u1.username) as processed_by_username,
    CONCAT(u2.username) as paid_by_username
FROM payroll_items pi
JOIN payroll_periods pp ON pi.payroll_period_id = pp.id
JOIN employees e ON pi.employee_id = e.id
LEFT JOIN users u1 ON pi.processed_by = u1.id
LEFT JOIN users u2 ON pi.paid_by = u2.id
WHERE e.deleted_at IS NULL;

-- =====================================================================
-- COMPLETION MESSAGE
-- =====================================================================
SELECT 'Payroll module database schema created successfully!' as Status,
       'Tables created: payroll_periods, allowance_types, deduction_types, employee_allowance_overrides, employee_deduction_overrides, payroll_items, payroll_item_lines' as TablesCreated,
       'Default data inserted for allowance and deduction types' as DefaultData,
       'Audit triggers and reporting views created' as AdditionalFeatures;