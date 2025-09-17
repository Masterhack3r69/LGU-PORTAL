-- Active: 1756484685261@@localhost@3306@employee_management_system
-- Create payroll_deduction_types table
-- This table stores different types of payroll deductions (both fixed and percentage-based)

CREATE TABLE IF NOT EXISTS `payroll_deduction_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `deduction_type` enum('fixed','percentage') COLLATE utf8mb4_unicode_ci DEFAULT 'fixed',
  `amount` decimal(10,2) DEFAULT '0.00',
  `percentage` decimal(5,4) DEFAULT '0.0000',
  `max_amount` decimal(10,2) DEFAULT NULL,
  `is_government` tinyint(1) DEFAULT '0',
  `is_mandatory` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert common Philippine government deductions
INSERT INTO `payroll_deduction_types` (`code`, `name`, `description`, `deduction_type`, `percentage`, `max_amount`, `is_government`, `is_mandatory`) VALUES
('GSIS', 'GSIS Contribution', 'Government Service Insurance System contribution', 'percentage', 0.0900, NULL, 1, 1),
('PAGIBIG', 'Pag-IBIG Contribution', 'Home Development Mutual Fund contribution', 'percentage', 0.0200, 100.00, 1, 1),
('PHILHEALTH', 'PhilHealth Contribution', 'Philippine Health Insurance Corporation contribution', 'percentage', 0.0275, 1800.00, 1, 1),
('WITHHOLDING_TAX', 'Withholding Tax', 'Income tax withheld from salary', 'percentage', 0.0000, NULL, 1, 1),
('SSS', 'SSS Contribution', 'Social Security System contribution (for private employees)', 'percentage', 0.0450, 1000.00, 1, 0),
('LOAN_DEDUCTION', 'Loan Deduction', 'Employee loan deduction', 'fixed', 0.00, NULL, 0, 0),
('TARDINESS', 'Tardiness Deduction', 'Deduction for tardiness/absences', 'fixed', 0.00, NULL, 0, 0),
('UNIFORM_DEDUCTION', 'Uniform Deduction', 'Deduction for uniform/equipment', 'fixed', 0.00, NULL, 0, 0);