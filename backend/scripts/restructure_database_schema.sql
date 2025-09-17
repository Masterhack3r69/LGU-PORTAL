-- Payroll and Compensation & Benefits Restructuring Database Schema
-- This script creates the new tables required for the separated payroll and C&B systems

-- ===================================================================
-- PAYROLL SYSTEM TABLES (Automated)
-- ===================================================================

-- Payroll allowance types configuration
CREATE TABLE IF NOT EXISTS `payroll_allowance_types` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `code` varchar(20) UNIQUE NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `is_monthly` boolean DEFAULT true,
  `is_prorated` boolean DEFAULT true,
  `is_active` boolean DEFAULT true,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employee-specific payroll allowance rates
CREATE TABLE IF NOT EXISTS `employee_payroll_allowances` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `allowance_type_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `end_date` date NULL,
  `is_active` boolean DEFAULT true,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`allowance_type_id`) REFERENCES `payroll_allowance_types`(`id`),
  INDEX `idx_employee_allowances` (`employee_id`, `is_active`)
);

-- Payroll allowance items per payroll period
CREATE TABLE IF NOT EXISTS `payroll_allowance_items` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `payroll_item_id` int NOT NULL,
  `allowance_type_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `prorated_amount` decimal(12,2) NOT NULL,
  `days_applicable` decimal(4,2) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`payroll_item_id`) REFERENCES `payroll_items`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`allowance_type_id`) REFERENCES `payroll_allowance_types`(`id`),
  INDEX `idx_payroll_allowance_items` (`payroll_item_id`)
);

-- ===================================================================
-- COMPENSATION & BENEFITS SYSTEM TABLES (Manual Selection)
-- ===================================================================

-- Compensation & Benefits types
CREATE TABLE IF NOT EXISTS `cb_benefit_types` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `code` varchar(20) UNIQUE NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `category` enum('BONUS', 'ALLOWANCE', 'AWARD', 'MONETIZATION', 'INSURANCE', 'CLAIM') NOT NULL,
  `frequency` enum('YEARLY', 'CONDITIONAL', 'ONE_TIME') NOT NULL,
  `calculation_method` enum('FIXED', 'PERCENTAGE', 'FORMULA') DEFAULT 'FIXED',
  `base_amount` decimal(12,2) DEFAULT 0.00,
  `percentage_rate` decimal(5,4) DEFAULT 0.0000,
  `max_amount` decimal(12,2) DEFAULT NULL,
  `is_taxable` boolean DEFAULT true,
  `is_active` boolean DEFAULT true,
  `eligibility_rules` json NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employee benefit selections (manual checkbox system)
CREATE TABLE IF NOT EXISTS `employee_benefit_selections` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `benefit_type_id` int NOT NULL,
  `year` year NOT NULL,
  `is_selected` boolean DEFAULT false,
  `calculated_amount` decimal(12,2) DEFAULT 0.00,
  `actual_amount` decimal(12,2) DEFAULT 0.00,
  `status` enum('PENDING', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED') DEFAULT 'PENDING',
  `selection_date` timestamp DEFAULT CURRENT_TIMESTAMP,
  `processed_by` int NULL,
  `processed_date` timestamp NULL,
  `payment_date` date NULL,
  `reference_number` varchar(50) NULL,
  `notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`benefit_type_id`) REFERENCES `cb_benefit_types`(`id`),
  FOREIGN KEY (`processed_by`) REFERENCES `users`(`id`),
  UNIQUE KEY `unique_employee_benefit_year` (`employee_id`, `benefit_type_id`, `year`),
  INDEX `idx_benefit_selections_employee_year` (`employee_id`, `year`),
  INDEX `idx_benefit_selections_status` (`status`)
);

-- ===================================================================
-- UPDATE EXISTING PAYROLL_ITEMS TABLE
-- ===================================================================

-- Add new columns to payroll_items table for enhanced leave tracking
ALTER TABLE `payroll_items` 
ADD COLUMN IF NOT EXISTS `leave_days_deducted` decimal(4,2) DEFAULT 0.00 AFTER `days_worked`,
ADD COLUMN IF NOT EXISTS `working_days_in_month` decimal(4,2) DEFAULT 22.00 AFTER `leave_days_deducted`,
ADD COLUMN IF NOT EXISTS `salary_adjustment` decimal(10,2) DEFAULT 0.00 AFTER `working_days_in_month`,
ADD COLUMN IF NOT EXISTS `total_allowances` decimal(12,2) DEFAULT 0.00 AFTER `salary_adjustment`;

-- ===================================================================
-- INITIAL DATA SEEDING
-- ===================================================================

-- Insert payroll allowance types
INSERT IGNORE INTO `payroll_allowance_types` (`code`, `name`, `description`, `is_monthly`, `is_prorated`) VALUES
('SALARY', 'Basic Salary', 'Monthly basic salary', true, true),
('RATA', 'Representation & Transportation Allowance', 'Fixed monthly RATA allowance', true, false),
('CA', 'Clothing Allowance', 'Annual clothing allowance', false, false),
('MA', 'Medical Allowance', 'Monthly medical allowance', true, false),
('SLA', 'Subsistence & Laundry Allowance', 'Monthly subsistence and laundry allowance', true, false),
('HA', 'Hazard Allowance', 'Monthly hazard pay allowance', true, false);

-- Insert compensation & benefits types
INSERT IGNORE INTO `cb_benefit_types` (`code`, `name`, `category`, `frequency`, `description`, `calculation_method`, `base_amount`) VALUES
('VLM', 'Vacation Leave Monetization', 'MONETIZATION', 'CONDITIONAL', 'Monetization of unused vacation leave credits', 'FORMULA', 0.00),
('SLM', 'Sick Leave Monetization', 'MONETIZATION', 'CONDITIONAL', 'Monetization of unused sick leave credits', 'FORMULA', 0.00),
('PBB', 'Performance-Based Bonus', 'BONUS', 'YEARLY', 'Annual performance-based bonus', 'FORMULA', 0.00),
('MYB', 'Mid-Year Bonus (13th Month)', 'BONUS', 'YEARLY', '13th month pay bonus', 'FORMULA', 0.00),
('YEB', 'Year-End Bonus (14th Month)', 'BONUS', 'YEARLY', '14th month pay bonus', 'FORMULA', 0.00),
('EC', 'Employee Compensation', 'INSURANCE', 'CONDITIONAL', 'Insurance and work-related claims', 'FIXED', 0.00),
('GSIS', 'GSIS Benefits', 'INSURANCE', 'CONDITIONAL', 'Government Service Insurance System benefits', 'PERCENTAGE', 0.00),
('LAB', 'Loyalty Award Benefit', 'AWARD', 'CONDITIONAL', 'Long service loyalty award', 'FORMULA', 10000.00);

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

CREATE INDEX IF NOT EXISTS `idx_payroll_allowance_types_active` ON `payroll_allowance_types`(`is_active`);
CREATE INDEX IF NOT EXISTS `idx_cb_benefit_types_active` ON `cb_benefit_types`(`is_active`, `category`);
CREATE INDEX IF NOT EXISTS `idx_cb_benefit_types_frequency` ON `cb_benefit_types`(`frequency`);

-- ===================================================================
-- MIGRATION FROM OLD SYSTEM (Optional)
-- ===================================================================

-- Migrate existing compensation data to new benefit selections
-- This is a one-time migration script
INSERT IGNORE INTO `employee_benefit_selections` 
(`employee_id`, `benefit_type_id`, `year`, `is_selected`, `calculated_amount`, `actual_amount`, `status`)
SELECT 
    ec.employee_id,
    cbt.id as benefit_type_id,
    ec.year,
    true as is_selected,
    ec.amount as calculated_amount,
    ec.amount as actual_amount,
    'PAID' as status
FROM `employee_compensation` ec
JOIN `compensation_types` ct ON ec.compensation_type_id = ct.id
JOIN `cb_benefit_types` cbt ON ct.code = cbt.code
WHERE ct.code IN ('PBB', 'MYB', 'YEB', 'VLM', 'SLM', 'EC', 'GSIS', 'LAB')
    AND ec.amount > 0;