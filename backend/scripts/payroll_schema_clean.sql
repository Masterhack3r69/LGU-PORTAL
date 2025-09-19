-- Payroll Module Database Schema - Clean Version
-- Creates all required tables for payroll management

-- Payroll Periods Table
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
  CONSTRAINT `payroll_periods_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `payroll_periods_finalized_by_fk` FOREIGN KEY (`finalized_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Allowance Types Table
CREATE TABLE IF NOT EXISTS `allowance_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` text,
  `default_amount` decimal(12,2) DEFAULT NULL,
  `calculation_type` enum('Fixed','Percentage','Formula') NOT NULL DEFAULT 'Fixed',
  `percentage_base` enum('BasicPay','MonthlySalary','GrossPay') DEFAULT NULL,
  `is_taxable` boolean NOT NULL DEFAULT FALSE,
  `frequency` enum('Monthly','Annual','Conditional') NOT NULL DEFAULT 'Monthly',
  `is_active` boolean NOT NULL DEFAULT TRUE,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `allowance_types_name_unique` (`name`),
  UNIQUE KEY `allowance_types_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deduction Types Table
CREATE TABLE IF NOT EXISTS `deduction_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` text,
  `default_amount` decimal(12,2) DEFAULT NULL,
  `calculation_type` enum('Fixed','Percentage','Formula') NOT NULL DEFAULT 'Fixed',
  `percentage_base` enum('BasicPay','MonthlySalary','GrossPay') DEFAULT NULL,
  `is_mandatory` boolean NOT NULL DEFAULT FALSE,
  `frequency` enum('Monthly','Annual','Conditional') NOT NULL DEFAULT 'Monthly',
  `is_active` boolean NOT NULL DEFAULT TRUE,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deduction_types_name_unique` (`name`),
  UNIQUE KEY `deduction_types_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Allowance Overrides Table
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
  CONSTRAINT `employee_allowance_overrides_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_allowance_overrides_type_fk` FOREIGN KEY (`allowance_type_id`) REFERENCES `allowance_types` (`id`),
  CONSTRAINT `employee_allowance_overrides_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employee Deduction Overrides Table
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
  CONSTRAINT `employee_deduction_overrides_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_deduction_overrides_type_fk` FOREIGN KEY (`deduction_type_id`) REFERENCES `deduction_types` (`id`),
  CONSTRAINT `employee_deduction_overrides_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Items Table
CREATE TABLE IF NOT EXISTS `payroll_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_period_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `working_days` decimal(4,2) NOT NULL DEFAULT 22.00,
  `daily_rate` decimal(10,2) NOT NULL,
  `basic_pay` decimal(12,2) NOT NULL,
  `total_allowances` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_deductions` decimal(12,2) NOT NULL DEFAULT 0.00,
  `gross_pay` decimal(12,2) NOT NULL DEFAULT 0.00,
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
  CONSTRAINT `payroll_items_period_fk` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payroll_items_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payroll_items_processed_by_fk` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `payroll_items_paid_by_fk` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Item Lines Table
CREATE TABLE IF NOT EXISTS `payroll_item_lines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_item_id` int NOT NULL,
  `line_type` enum('Allowance','Deduction','Adjustment') NOT NULL,
  `type_id` int DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `is_override` boolean NOT NULL DEFAULT FALSE,
  `calculation_basis` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `payroll_item_lines_item_fk` FOREIGN KEY (`payroll_item_id`) REFERENCES `payroll_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;