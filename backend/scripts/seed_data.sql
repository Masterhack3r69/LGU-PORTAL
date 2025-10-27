-- Seed Data Script
-- This script populates the database with initial data including:
-- - One admin user
-- - Document types
-- - Allowance types
-- - Deduction types
-- - Leave types

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. CREATE ADMIN USER
-- ============================================
-- Password: admin123 (hashed with bcrypt)
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `is_active`, `created_at`) VALUES
(1, 'admin', 'admin@lgu.gov.ph', '$2a$10$07Iyen8Gjhokmd0wtUnPL.gd3wdppYOMEYcyNsWpff5gbrAgJOPsC', 'admin', 1, NOW());

-- ============================================
-- 2. DOCUMENT TYPES
-- ============================================
INSERT INTO `document_types` (`name`, `description`, `is_required`, `max_file_size`, `allowed_extensions`) VALUES
('Original Approved Appointment', 'Original copy of approved appointment document', 1, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('PSA Birth Certificate', 'Philippine Statistics Authority Birth Certificate', 1, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('Marriage Contract', 'Marriage Contract (if applicable)', 0, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('NOSI (Notice of Step Increment)', 'Notice of Step Increment', 0, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('NOSA (Notice of Salary Adjustment)', 'Notice of Salary Adjustment', 0, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('Promotion if applicable / Appointment', 'Promotion or Appointment document', 0, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('Designations', 'Designation documents', 0, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('CAV / TOR', 'Certificate of Appearance of Voter / Transcript of Records', 0, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('SALN (Statement of Assets & Liabilities Net Worth)', 'Statement of Assets, Liabilities and Net Worth', 1, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('PDS (Personal Data Sheet)', 'Personal Data Sheet', 1, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('Income Tax Return', 'Income Tax Return', 0, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('Reprimand Letter / Show Cause Order if any', 'Reprimand Letter or Show Cause Order', 0, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('Service Record', 'Service Record', 1, 10485760, '["pdf", "jpg", "jpeg", "png"]'),
('Updated Valid ID Licensed (photocopy)', 'Valid ID License photocopy', 1, 10485760, '["pdf", "jpg", "jpeg", "png"]');

-- ============================================
-- 3. ALLOWANCE TYPES
-- ============================================
INSERT INTO `allowance_types` (`name`, `code`, `description`, `default_amount`, `calculation_type`, `is_taxable`, `frequency`, `is_active`) VALUES
('RATA (Representation Allowance & Transportation Allowance) Payroll', 'RATA_PAYROLL', 'Representation and Transportation Allowance for Payroll', 0.00, 'Fixed', 1, 'Monthly', 1),
('Clothing Allowance Payroll', 'CLOTHING_PAYROLL', 'Clothing Allowance for Payroll', 0.00, 'Fixed', 1, 'Annual', 1),
('Medical Allowance Payroll', 'MEDICAL_PAYROLL', 'Medical Allowance for Payroll', 0.00, 'Fixed', 1, 'Monthly', 1),
('Subsistence & Laundry Payroll', 'SUBSISTENCE_PAYROLL', 'Subsistence and Laundry Allowance for Payroll', 0.00, 'Fixed', 1, 'Monthly', 1),
('Hazard Payroll', 'HAZARD_PAYROLL', 'Hazard Pay for Payroll', 0.00, 'Fixed', 1, 'Monthly', 1);

-- ============================================
-- 4. DEDUCTION TYPES
-- ============================================
INSERT INTO `deduction_types` (`name`, `code`, `description`, `default_amount`, `calculation_type`, `is_mandatory`, `frequency`, `is_active`) VALUES
('SSS Contribution', 'SSS', 'Social Security System Contribution', 0.00, 'Formula', 1, 'Monthly', 1),
('PhilHealth Contribution', 'PHILHEALTH', 'Philippine Health Insurance Corporation Contribution', 0.00, 'Formula', 1, 'Monthly', 1),
('Pag-IBIG Contribution', 'PAGIBIG', 'Home Development Mutual Fund Contribution', 0.00, 'Formula', 1, 'Monthly', 1),
('SSS Loan', 'SSS_LOAN', 'SSS Loan Deduction', 0.00, 'Fixed', 0, 'Monthly', 1);

-- ============================================
-- 5. LEAVE TYPES
-- ============================================
INSERT INTO `leave_types` (`name`, `code`, `description`, `max_days_per_year`, `is_monetizable`, `requires_medical_certificate`) VALUES
('Forced Leave', 'FL', 'Mandatory leave that must be taken within the year', 5, 0, 0),
('Special Privilege Leave', 'SPL', 'Special Privilege Leave for qualified employees', 3, 0, 0),
('Maternity Leave (105 days)', 'ML', 'Maternity Leave for female employees', 105, 0, 1),
('Paternity Leave (7 days)', 'PL', 'Paternity Leave for male employees', 7, 0, 0),
('Sick Leave (monetize)', 'SL', 'Sick Leave - can be monetized', 15, 1, 1),
('Vacation Leave (monetize)', 'VL', 'Vacation Leave - can be monetized', 15, 1, 0);

-- ============================================
-- 6. SYSTEM SETTINGS (Optional)
-- ============================================
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`, `updated_by`) VALUES
('leave_accrual_rate', '1.25', 'Monthly leave accrual rate (days per month)', 1),
('max_leave_balance', '300', 'Maximum leave balance allowed', 1),
('working_days_per_month', '22', 'Standard working days per month', 1),
('payroll_cutoff_day', '15', 'Payroll cutoff day of the month', 1);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- SEED DATA COMPLETED
-- ============================================
-- Summary:
-- - 1 Admin user created (username: admin, password: admin123)
-- - 14 Document types
-- - 5 Allowance types
-- - 4 Deduction types
-- - 6 Leave types
-- - 4 System settings
-- ============================================
