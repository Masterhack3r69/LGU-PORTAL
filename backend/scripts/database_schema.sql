-- Employee Management System Database Schema
-- MySQL 8.0+ Compatible

-- Create database
CREATE DATABASE IF NOT EXISTS employee_management_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE employee_management_system;

-- ================================
-- 1. USER ACCOUNTS & AUTHENTICATION
-- ================================
-- Clean schema SQL generated from the uploaded dump
-- Run in MySQL 8.0+ (ensure proper user/privileges)

-- 1) users
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','employee') DEFAULT 'employee',
  `is_active` tinyint(1) DEFAULT '1',
  `failed_login_attempts` int DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) salary_grades
CREATE TABLE `salary_grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grade` int NOT NULL,
  `step_1` decimal(12,2) NOT NULL,
  `step_2` decimal(12,2) NOT NULL,
  `step_3` decimal(12,2) NOT NULL,
  `step_4` decimal(12,2) NOT NULL,
  `step_5` decimal(12,2) NOT NULL,
  `step_6` decimal(12,2) NOT NULL,
  `step_7` decimal(12,2) NOT NULL,
  `step_8` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `grade` (`grade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) compensation_types
CREATE TABLE `compensation_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` text,
  `is_taxable` tinyint(1) DEFAULT '1',
  `calculation_method` enum('Fixed','Percentage','Formula') DEFAULT 'Fixed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) document_types
CREATE TABLE `document_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `is_required` tinyint(1) DEFAULT '0',
  `max_file_size` int DEFAULT '5242880',
  `allowed_extensions` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) leave_types
CREATE TABLE `leave_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `code` varchar(10) NOT NULL,
  `description` text,
  `max_days_per_year` int DEFAULT NULL,
  `is_monetizable` tinyint(1) DEFAULT '0',
  `requires_medical_certificate` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) training_programs
CREATE TABLE `training_programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `duration_hours` int DEFAULT NULL,
  `training_type` enum('Internal','External','Online','Seminar','Workshop') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7) employees (depends on users)
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `employee_number` varchar(20) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `suffix` varchar(10) DEFAULT NULL,
  `sex` enum('Male','Female') NOT NULL,
  `birth_date` date NOT NULL,
  `birth_place` varchar(255) DEFAULT NULL,
  `civil_status` enum('Single','Married','Widowed','Separated','Divorced') DEFAULT 'Single',
  `contact_number` varchar(20) DEFAULT NULL,
  `email_address` varchar(100) DEFAULT NULL,
  `current_address` text,
  `permanent_address` text,
  `tin` varchar(20) DEFAULT NULL,
  `gsis_number` varchar(20) DEFAULT NULL,
  `pagibig_number` varchar(20) DEFAULT NULL,
  `philhealth_number` varchar(20) DEFAULT NULL,
  `sss_number` varchar(20) DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `plantilla_position` varchar(100) DEFAULT NULL,
  `plantilla_number` varchar(20) DEFAULT NULL,
  `salary_grade` int DEFAULT NULL,
  `step_increment` int DEFAULT '1',
  `current_monthly_salary` decimal(12,2) DEFAULT NULL,
  `current_daily_rate` decimal(10,2) DEFAULT NULL,
  `highest_monthly_salary` decimal(12,2) DEFAULT NULL,
  `highest_daily_rate` decimal(10,2) DEFAULT NULL,
  `employment_status` enum('Active','Resigned','Retired','Terminated','AWOL') DEFAULT 'Active',
  `separation_date` date DEFAULT NULL,
  `separation_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_number` (`employee_number`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_employee_number` (`employee_number`),
  KEY `idx_employment_status` (`employment_status`),
  KEY `idx_appointment_date` (`appointment_date`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8) employee_education (depends on employees)
CREATE TABLE `employee_education` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `education_level` enum('Elementary','High School','Vocational','College','Graduate Studies','Post Graduate') NOT NULL,
  `school_name` varchar(255) NOT NULL,
  `course_degree` varchar(255) DEFAULT NULL,
  `year_graduated` year DEFAULT NULL,
  `highest_level_units_earned` varchar(100) DEFAULT NULL,
  `scholarship_honors` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_education` (`employee_id`),
  CONSTRAINT `employee_education_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9) employee_eligibility (depends on employees)
CREATE TABLE `employee_eligibility` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `eligibility_title` varchar(255) NOT NULL,
  `rating` decimal(5,2) DEFAULT NULL,
  `date_of_examination` date DEFAULT NULL,
  `place_of_examination` varchar(255) DEFAULT NULL,
  `license_number` varchar(100) DEFAULT NULL,
  `license_validity_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_eligibility` (`employee_id`),
  CONSTRAINT `employee_eligibility_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10) employee_documents (depends on employees, document_types, users)
CREATE TABLE `employee_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `document_type_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `upload_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` int NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text,
  PRIMARY KEY (`id`),
  KEY `document_type_id` (`document_type_id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_employee_documents` (`employee_id`),
  KEY `idx_document_status` (`status`),
  CONSTRAINT `employee_documents_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_documents_ibfk_2` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`),
  CONSTRAINT `employee_documents_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  CONSTRAINT `employee_documents_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11) employee_trainings (depends on employees, training_programs)
CREATE TABLE `employee_trainings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `training_program_id` int DEFAULT NULL,
  `training_title` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `duration_hours` decimal(5,2) DEFAULT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `organizer` varchar(255) DEFAULT NULL,
  `certificate_issued` tinyint(1) DEFAULT '0',
  `certificate_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `training_program_id` (`training_program_id`),
  KEY `idx_employee_trainings` (`employee_id`),
  KEY `idx_training_dates` (`start_date`,`end_date`),
  CONSTRAINT `employee_trainings_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_trainings_ibfk_2` FOREIGN KEY (`training_program_id`) REFERENCES `training_programs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12) employee_leave_balances (depends on employees, leave_types)
CREATE TABLE `employee_leave_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `year` year NOT NULL,
  `earned_days` decimal(6,2) DEFAULT '0.00',
  `used_days` decimal(6,2) DEFAULT '0.00',
  `monetized_days` decimal(6,2) DEFAULT '0.00',
  `carried_forward` decimal(6,2) DEFAULT '0.00',
  `current_balance` decimal(6,2) DEFAULT '0.00',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_leave_year` (`employee_id`,`leave_type_id`,`year`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `idx_leave_balances` (`employee_id`,`year`),
  CONSTRAINT `employee_leave_balances_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_leave_balances_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13) leave_applications (depends on employees, leave_types, users)
CREATE TABLE `leave_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days_requested` decimal(4,2) NOT NULL,
  `reason` text,
  `status` enum('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text,
  PRIMARY KEY (`id`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_leave_applications` (`employee_id`),
  KEY `idx_leave_status` (`status`),
  KEY `idx_leave_dates` (`start_date`,`end_date`),
  CONSTRAINT `leave_applications_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_applications_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  CONSTRAINT `leave_applications_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14) payroll_periods (depends on users)
CREATE TABLE `payroll_periods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` year NOT NULL,
  `month` tinyint NOT NULL,
  `period_number` tinyint NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `pay_date` date NOT NULL,
  `status` enum('Draft','Processing','Completed','Cancelled') DEFAULT 'Draft',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_payroll_period` (`year`,`month`,`period_number`),
  KEY `created_by` (`created_by`),
  KEY `idx_payroll_periods` (`year`,`month`),
  CONSTRAINT `payroll_periods_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15) payroll_items (depends on employees, payroll_periods)
CREATE TABLE `payroll_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `payroll_period_id` int NOT NULL,
  `basic_salary` decimal(12,2) DEFAULT '0.00',
  `days_worked` decimal(4,2) DEFAULT '0.00',
  `rata` decimal(10,2) DEFAULT '0.00',
  `clothing_allowance` decimal(10,2) DEFAULT '0.00',
  `medical_allowance` decimal(10,2) DEFAULT '0.00',
  `hazard_allowance` decimal(10,2) DEFAULT '0.00',
  `subsistence_laundry` decimal(10,2) DEFAULT '0.00',
  `gsis_contribution` decimal(10,2) DEFAULT '0.00',
  `pagibig_contribution` decimal(10,2) DEFAULT '0.00',
  `philhealth_contribution` decimal(10,2) DEFAULT '0.00',
  `tax_withheld` decimal(10,2) DEFAULT '0.00',
  `other_deductions` decimal(10,2) DEFAULT '0.00',
  `gross_pay` decimal(12,2) DEFAULT '0.00',
  `total_deductions` decimal(12,2) DEFAULT '0.00',
  `net_pay` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_payroll` (`employee_id`,`payroll_period_id`),
  KEY `idx_payroll_items` (`payroll_period_id`),
  CONSTRAINT `payroll_items_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payroll_items_ibfk_2` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16) employee_compensation (depends on employees, compensation_types)
CREATE TABLE `employee_compensation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `compensation_type_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `year` year NOT NULL,
  `month` tinyint DEFAULT NULL,
  `date_paid` date DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `compensation_type_id` (`compensation_type_id`),
  KEY `idx_employee_compensation` (`employee_id`,`year`),
  CONSTRAINT `employee_compensation_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_compensation_ibfk_2` FOREIGN KEY (`compensation_type_id`) REFERENCES `compensation_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17) service_records (depends on employees)
CREATE TABLE `service_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `position_title` varchar(255) NOT NULL,
  `appointment_status` varchar(100) DEFAULT NULL,
  `salary` decimal(12,2) DEFAULT NULL,
  `station_assignment` varchar(255) DEFAULT NULL,
  `service_from` date NOT NULL,
  `service_to` date DEFAULT NULL,
  `lwop_from` date DEFAULT NULL,
  `lwop_to` date DEFAULT NULL,
  `separation_cause` varchar(255) DEFAULT NULL,
  `separation_date` date DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_service_records` (`employee_id`),
  KEY `idx_service_dates` (`service_from`,`service_to`),
  CONSTRAINT `service_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18) terminal_leave_benefits (depends on employees, users)
CREATE TABLE `terminal_leave_benefits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `total_leave_credits` decimal(6,2) NOT NULL,
  `highest_monthly_salary` decimal(12,2) NOT NULL,
  `constant_factor` decimal(4,2) DEFAULT '1.00',
  `computed_amount` decimal(15,2) NOT NULL,
  `claim_date` date NOT NULL,
  `separation_date` date NOT NULL,
  `processed_by` int NOT NULL,
  `processed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('Computed','Approved','Paid','Cancelled') DEFAULT 'Computed',
  `check_number` varchar(50) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `processed_by` (`processed_by`),
  KEY `idx_tlb_employee` (`employee_id`),
  KEY `idx_tlb_status` (`status`),
  CONSTRAINT `terminal_leave_benefits_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `terminal_leave_benefits_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19) system_settings (depends on users)
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `description` text,
  `updated_by` int NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_setting_key` (`setting_key`),
  CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20) audit_logs (depends on users)
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `table_name` varchar(100) DEFAULT NULL,
  `record_id` int DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_table` (`table_name`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- End of schema

-- ================================
-- INSERT INITIAL DATA
-- ================================

-- Insert default leave types
INSERT INTO leave_types (name, code, description, max_days_per_year, is_monetizable) VALUES
('Vacation Leave', 'VL', 'Annual vacation leave', 15, TRUE),
('Sick Leave', 'SL', 'Sick leave for medical reasons', 15, TRUE),
('Forced Leave', 'FL', 'Mandatory forced leave', NULL, FALSE),
('Special Privilege Leave', 'SPL', 'Special occasions leave', 3, FALSE),
('Maternity Leave', 'ML', 'Maternity leave for female employees', 105, FALSE),
('Paternity Leave', 'PL', 'Paternity leave for male employees', 7, FALSE);

-- Insert default document types
INSERT INTO document_types (name, description, is_required, allowed_extensions) VALUES
('Appointment Papers', 'Official appointment documents', TRUE, '["pdf", "jpg", "png"]'),
('PSA Birth Certificate', 'Official birth certificate from PSA', TRUE, '["pdf", "jpg", "png"]'),
('Transcript of Records', 'Academic transcript or Certificate of Achievement Verification', TRUE, '["pdf", "jpg", "png"]'),
('SALN', 'Statement of Assets, Liabilities and Net Worth', TRUE, '["pdf", "docx"]'),
('Personal Data Sheet', 'Complete PDS form', TRUE, '["pdf", "docx"]'),
('Income Tax Return', 'Latest ITR filing', FALSE, '["pdf", "jpg", "png"]'),
('Service Records', 'Complete service record history', FALSE, '["pdf", "docx"]'),
('Government IDs', 'Copies of government-issued IDs', TRUE, '["pdf", "jpg", "png"]');

-- Insert default compensation types
INSERT INTO compensation_types (name, code, description, is_taxable, calculation_method) VALUES
('Performance-Based Bonus', 'PBB', 'Annual performance bonus', TRUE, 'Fixed'),
('Mid-Year Bonus', 'MYB', '13th Month Pay', TRUE, 'Formula'),
('Year-End Bonus', 'YEB', '14th Month Pay', TRUE, 'Formula'),
('RATA', 'RATA', 'Representation and Transportation Allowance', TRUE, 'Fixed'),
('Clothing Allowance', 'CA', 'Annual clothing allowance', TRUE, 'Fixed'),
('Medical Allowance', 'MA', 'Medical benefits allowance', FALSE, 'Fixed'),
('Hazard Allowance', 'HA', 'Hazard duty allowance', TRUE, 'Fixed'),
('Subsistence & Laundry', 'SL', 'Meal and laundry allowance', TRUE, 'Fixed'),
('Loyalty Award', 'LA', 'Long service award', TRUE, 'Fixed');

-- Insert system default settings (will be inserted after admin user creation)