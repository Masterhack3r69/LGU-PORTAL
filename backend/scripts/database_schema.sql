
--
-- Table structure for table `users`
--
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','employee') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'employee',
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
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `employees`
--
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `employee_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `suffix` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sex` enum('Male','Female') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` date NOT NULL,
  `birth_place` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `civil_status` enum('Single','Married','Widowed','Separated','Divorced') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Single',
  `contact_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `permanent_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tin` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gsis_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagibig_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `philhealth_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sss_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `plantilla_position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plantilla_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_grade` int DEFAULT NULL,
  `step_increment` int DEFAULT '1',
  `current_monthly_salary` decimal(12,2) DEFAULT NULL,
  `current_daily_rate` decimal(10,2) DEFAULT NULL,
  `highest_monthly_salary` decimal(12,2) DEFAULT NULL,
  `highest_daily_rate` decimal(10,2) DEFAULT NULL,
  `employment_status` enum('Active','Resigned','Retired','Terminated','AWOL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  `separation_date` date DEFAULT NULL,
  `separation_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_number` (`employee_number`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_employee_number` (`employee_number`),
  KEY `idx_employment_status` (`employment_status`),
  KEY `idx_appointment_date` (`appointment_date`),
  KEY `idx_employees_deleted_at` (`deleted_at`),
  KEY `idx_employees_active` (`employment_status`,`deleted_at`),
  KEY `idx_employees_search_active` (`first_name`,`last_name`,`deleted_at`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `allowance_types`
--
DROP TABLE IF EXISTS `allowance_types`;
CREATE TABLE `allowance_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `default_amount` decimal(12,2) DEFAULT NULL,
  `calculation_type` enum('Fixed','Percentage','Formula') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Fixed',
  `percentage_base` enum('BasicPay','MonthlySalary','GrossPay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_taxable` tinyint(1) NOT NULL DEFAULT '0',
  `frequency` enum('Monthly','Annual','Conditional') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Monthly',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `deduction_types`
--
DROP TABLE IF EXISTS `deduction_types`;
CREATE TABLE `deduction_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `default_amount` decimal(12,2) DEFAULT NULL,
  `calculation_type` enum('Fixed','Percentage','Formula') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Fixed',
  `percentage_base` enum('BasicPay','MonthlySalary','GrossPay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `frequency` enum('Monthly','Annual','Conditional') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Monthly',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `leave_types`
--
DROP TABLE IF EXISTS `leave_types`;
CREATE TABLE `leave_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `max_days_per_year` int DEFAULT NULL,
  `is_monetizable` tinyint(1) DEFAULT '0',
  `requires_medical_certificate` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `document_types`
--
DROP TABLE IF EXISTS `document_types`;
CREATE TABLE `document_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_required` tinyint(1) DEFAULT '0',
  `max_file_size` int DEFAULT '5242880',
  `allowed_extensions` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `training_programs`
--
DROP TABLE IF EXISTS `training_programs`;
CREATE TABLE `training_programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `duration_hours` int DEFAULT NULL,
  `training_type` enum('Internal','External','Online','Seminar','Workshop') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `payroll_periods`
--
DROP TABLE IF EXISTS `payroll_periods`;
CREATE TABLE `payroll_periods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` year NOT NULL,
  `month` tinyint NOT NULL,
  `period_number` tinyint NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `pay_date` date NOT NULL,
  `status` enum('Draft','Processing','Completed','Paid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `created_by` int NOT NULL,
  `finalized_by` int DEFAULT NULL,
  `finalized_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_period` (`year`,`month`,`period_number`),
  KEY `created_by` (`created_by`),
  KEY `finalized_by` (`finalized_by`),
  KEY `idx_payroll_periods_year_month_status` (`year`,`month`,`status`),
  CONSTRAINT `payroll_periods_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `payroll_periods_ibfk_2` FOREIGN KEY (`finalized_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `audit_logs`
--
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_id` int DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_table` (`table_name`),
  KEY `idx_audit_created` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `comp_benefit_records`
--
DROP TABLE IF EXISTS `comp_benefit_records`;
CREATE TABLE `comp_benefit_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `benefit_type` enum('TERMINAL_LEAVE','MONETIZATION','PBB','MID_YEAR_BONUS','YEAR_END_BONUS','EC','GSIS','LOYALTY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `days_used` decimal(6,2) DEFAULT NULL COMMENT 'For TLB/Monetization benefits',
  `amount` decimal(12,2) NOT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processed_by` int NOT NULL COMMENT 'User ID who processed the benefit',
  `processed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `processed_by` (`processed_by`),
  KEY `idx_comp_benefits_employee` (`employee_id`),
  KEY `idx_comp_benefits_type` (`benefit_type`),
  KEY `idx_comp_benefits_processed_at` (`processed_at`),
  KEY `idx_comp_benefits_employee_type` (`employee_id`,`benefit_type`),
  KEY `idx_comp_benefits_year` (`processed_at`,`benefit_type`),
  CONSTRAINT `comp_benefit_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comp_benefit_records_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Compensation and benefits processing history log';

--
-- Table structure for table `employee_allowance_overrides`
--
DROP TABLE IF EXISTS `employee_allowance_overrides`;
CREATE TABLE `employee_allowance_overrides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `allowance_type_id` int NOT NULL,
  `override_amount` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_allowance_effective` (`employee_id`,`allowance_type_id`,`effective_date`),
  KEY `allowance_type_id` (`allowance_type_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_allowance_overrides_employee_active` (`employee_id`,`is_active`),
  CONSTRAINT `employee_allowance_overrides_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_allowance_overrides_ibfk_2` FOREIGN KEY (`allowance_type_id`) REFERENCES `allowance_types` (`id`),
  CONSTRAINT `employee_allowance_overrides_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `employee_deduction_overrides`
--
DROP TABLE IF EXISTS `employee_deduction_overrides`;
CREATE TABLE `employee_deduction_overrides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `deduction_type_id` int NOT NULL,
  `override_amount` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_deduction_effective` (`employee_id`,`deduction_type_id`,`effective_date`),
  KEY `deduction_type_id` (`deduction_type_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_deduction_overrides_employee_active` (`employee_id`,`is_active`),
  CONSTRAINT `employee_deduction_overrides_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_deduction_overrides_ibfk_2` FOREIGN KEY (`deduction_type_id`) REFERENCES `deduction_types` (`id`),
  CONSTRAINT `employee_deduction_overrides_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `employee_documents`
--
DROP TABLE IF EXISTS `employee_documents`;
CREATE TABLE `employee_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `document_type_id` int NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upload_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` int NOT NULL,
  `status` enum('Pending','Approved','Rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `employee_education`
--
DROP TABLE IF EXISTS `employee_education`;
CREATE TABLE `employee_education` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `education_level` enum('Elementary','High School','Vocational','College','Graduate Studies','Post Graduate') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_degree` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_graduated` year DEFAULT NULL,
  `highest_level_units_earned` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scholarship_honors` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_education` (`employee_id`),
  CONSTRAINT `employee_education_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `employee_leave_balances`
--
DROP TABLE IF EXISTS `employee_leave_balances`;
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
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL COMMENT 'User ID who last updated the balance',
  `prorated_start_month` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_leave_year` (`employee_id`,`leave_type_id`,`year`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `idx_leave_balances` (`employee_id`,`year`),
  KEY `idx_leave_balances_employee_year_type` (`employee_id`,`year`,`leave_type_id`),
  CONSTRAINT `employee_leave_balances_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_leave_balances_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `employee_trainings`
--
DROP TABLE IF EXISTS `employee_trainings`;
CREATE TABLE `employee_trainings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `training_program_id` int DEFAULT NULL,
  `training_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `duration_hours` decimal(5,2) DEFAULT NULL,
  `venue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organizer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificate_issued` tinyint(1) DEFAULT '0',
  `certificate_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `training_program_id` (`training_program_id`),
  KEY `idx_employee_trainings` (`employee_id`),
  KEY `idx_training_dates` (`start_date`,`end_date`),
  CONSTRAINT `employee_trainings_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_trainings_ibfk_2` FOREIGN KEY (`training_program_id`) REFERENCES `training_programs` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `leave_applications`
--
DROP TABLE IF EXISTS `leave_applications`;
CREATE TABLE `leave_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days_requested` decimal(4,2) NOT NULL,
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('Pending','Approved','Rejected','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `auto_approved` tinyint(1) DEFAULT '0' COMMENT 'Flag for automatically approved entries',
  `application_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unique application reference number',
  `is_admin_created` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_number` (`application_number`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_leave_applications` (`employee_id`),
  KEY `idx_leave_status` (`status`),
  KEY `idx_leave_dates` (`start_date`,`end_date`),
  KEY `idx_leave_applications_status_dates` (`status`,`start_date`,`end_date`),
  KEY `idx_leave_applications_employee_dates` (`employee_id`,`start_date`,`end_date`),
  KEY `idx_leave_applications_admin_created` (`is_admin_created`,`status`),
  CONSTRAINT `leave_applications_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_applications_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  CONSTRAINT `leave_applications_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `leave_balance_adjustments`
--
DROP TABLE IF EXISTS `leave_balance_adjustments`;
CREATE TABLE `leave_balance_adjustments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `year` year NOT NULL,
  `adjustment_type` enum('credit','debit','carry_forward','monetization','correction') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `days_adjusted` decimal(6,2) NOT NULL,
  `previous_balance` decimal(6,2) NOT NULL,
  `new_balance` decimal(6,2) NOT NULL,
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adjustment_date` date NOT NULL,
  `processed_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_adjustment_employee` (`employee_id`,`year`),
  KEY `idx_adjustment_type` (`adjustment_type`),
  KEY `idx_adjustment_date` (`adjustment_date`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `processed_by` (`processed_by`),
  KEY `idx_balance_adjustments_employee_year` (`employee_id`,`year`),
  CONSTRAINT `leave_balance_adjustments_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_balance_adjustments_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  CONSTRAINT `leave_balance_adjustments_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `leave_monetization_log`
--
DROP TABLE IF EXISTS `leave_monetization_log`;
CREATE TABLE `leave_monetization_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `year` year NOT NULL,
  `monetizable_balance` decimal(6,2) NOT NULL,
  `max_monetizable_days` decimal(6,2) DEFAULT '29.00',
  `days_monetized` decimal(6,2) NOT NULL,
  `daily_rate` decimal(10,2) NOT NULL,
  `computed_amount` decimal(12,2) NOT NULL,
  `processing_date` date NOT NULL,
  `status` enum('calculated','processed','paid','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'calculated',
  `reference_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `processed_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_monetization_employee` (`employee_id`,`year`),
  KEY `idx_monetization_status` (`status`),
  KEY `idx_monetization_date` (`processing_date`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `processed_by` (`processed_by`),
  KEY `idx_monetization_log_employee_year` (`employee_id`,`year`),
  CONSTRAINT `leave_monetization_log_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_monetization_log_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  CONSTRAINT `leave_monetization_log_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `monthly_accrual_log`
--
DROP TABLE IF EXISTS `monthly_accrual_log`;
CREATE TABLE `monthly_accrual_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `year` year NOT NULL,
  `month` tinyint NOT NULL,
  `leave_type_id` int NOT NULL,
  `accrual_amount` decimal(4,2) NOT NULL,
  `processed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_by` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_month_type` (`employee_id`,`year`,`month`,`leave_type_id`),
  KEY `idx_accrual_year_month` (`year`,`month`),
  KEY `idx_accrual_employee` (`employee_id`),
  KEY `idx_accrual_processed` (`processed_at`),
  KEY `monthly_accrual_log_ibfk_2` (`leave_type_id`),
  KEY `monthly_accrual_log_ibfk_3` (`processed_by`),
  KEY `idx_accrual_lookup` (`employee_id`,`year`,`month`),
  KEY `idx_accrual_summary` (`year`,`month`,`leave_type_id`),
  CONSTRAINT `monthly_accrual_log_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `monthly_accrual_log_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  CONSTRAINT `monthly_accrual_log_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks monthly leave accrual processing for employees';

--
-- Table structure for table `notifications`
--
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'MEDIUM',
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`),
  KEY `idx_notifications_type` (`type`),
  KEY `idx_notifications_read` (`is_read`),
  KEY `idx_notifications_created` (`created_at`),
  KEY `idx_notifications_reference` (`reference_type`,`reference_id`),
  KEY `idx_notifications_user_unread` (`user_id`,`is_read`),
  KEY `idx_notifications_priority_created` (`priority`,`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `payroll_items`
--
DROP TABLE IF EXISTS `payroll_items`;
CREATE TABLE `payroll_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_period_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `working_days` decimal(4,2) NOT NULL DEFAULT '22.00',
  `daily_rate` decimal(10,2) NOT NULL,
  `basic_pay` decimal(12,2) NOT NULL,
  `total_allowances` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_deductions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gross_pay` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_pay` decimal(12,2) NOT NULL,
  `status` enum('Draft','Processed','Finalized','Paid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `processed_by` int DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `paid_by` int DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_payroll_period_employee` (`payroll_period_id`,`employee_id`),
  KEY `processed_by` (`processed_by`),
  KEY `paid_by` (`paid_by`),
  KEY `idx_payroll_items_period_status` (`payroll_period_id`,`status`),
  KEY `idx_payroll_items_employee_status` (`employee_id`,`status`),
  CONSTRAINT `payroll_items_ibfk_1` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payroll_items_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payroll_items_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `payroll_items_ibfk_4` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `payroll_item_lines`
--
DROP TABLE IF EXISTS `payroll_item_lines`;
CREATE TABLE `payroll_item_lines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_item_id` int NOT NULL,
  `line_type` enum('Allowance','Deduction','Adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_id` int DEFAULT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `is_override` tinyint(1) NOT NULL DEFAULT '0',
  `calculation_basis` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payroll_item_id` (`payroll_item_id`),
  CONSTRAINT `payroll_item_lines_ibfk_1` FOREIGN KEY (`payroll_item_id`) REFERENCES `payroll_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `salary_grades`
--
DROP TABLE IF EXISTS `salary_grades`;
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

--
-- Table structure for table `system_settings`
--
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `updated_by` int NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_setting_key` (`setting_key`),
  CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--
-- Final view structure for view `v_compensation_benefits`
--
DROP VIEW IF EXISTS `v_compensation_benefits`;
CREATE ALGORITHM=UNDEFINED
DEFINER=`root`@`localhost` SQL SECURITY DEFINER
VIEW `v_compensation_benefits` AS
select `cbr`.`id` AS `id`,
  `cbr`.`employee_id` AS `employee_id`,
  `e`.`employee_number` AS `employee_number`,
  concat(`e`.`first_name`,' ',ifnull(concat(left(`e`.`middle_name`,1),'. '),''),`e`.`last_name`) AS `employee_name`,
  `e`.`plantilla_position` AS `plantilla_position`,
  `e`.`current_monthly_salary` AS `current_monthly_salary`,
  `cbr`.`benefit_type` AS `benefit_type`,
  `cbr`.`days_used` AS `days_used`,
  `cbr`.`amount` AS `amount`,
  `cbr`.`notes` AS `notes`,
  `cbr`.`processed_at` AS `processed_at`,
  year(`cbr`.`processed_at`) AS `benefit_year`,
  month(`cbr`.`processed_at`) AS `benefit_month`
from ((`comp_benefit_records` `cbr`
  join `employees` `e` on((`cbr`.`employee_id` = `e`.`id`)))
  left join `users` `u` on((`cbr`.`processed_by` = `u`.`id`)))
order by `cbr`.`processed_at` desc;

--
-- Final view structure for view `v_employee_payroll_details`
--
DROP VIEW IF EXISTS `v_employee_payroll_details`;
CREATE ALGORITHM=UNDEFINED
DEFINER=`root`@`localhost` SQL SECURITY DEFINER
VIEW `v_employee_payroll_details` AS
select `pi`.`id` AS `id`,
  `pi`.`payroll_period_id` AS `payroll_period_id`,
  `pp`.`year` AS `year`,
  `pp`.`month` AS `month`,
  `pp`.`period_number` AS `period_number`,
  `pp`.`start_date` AS `start_date`,
  `pp`.`end_date` AS `end_date`,
  `pp`.`pay_date` AS `pay_date`,
  `pi`.`employee_id` AS `employee_id`,
  `e`.`employee_number` AS `employee_number`,
  concat(`e`.`first_name`,' ',ifnull(`e`.`middle_name`,''),' ',`e`.`last_name`) AS `employee_name`,
  `e`.`plantilla_position` AS `plantilla_position`,
  `pi`.`working_days` AS `working_days`,
  `pi`.`daily_rate` AS `daily_rate`,
  `pi`.`basic_pay` AS `basic_pay`,
  `pi`.`total_allowances` AS `total_allowances`,
  `pi`.`total_deductions` AS `total_deductions`,
  `pi`.`gross_pay` AS `gross_pay`,
  `pi`.`net_pay` AS `net_pay`,
  `pi`.`status` AS `status`,
  `pi`.`processed_at` AS `processed_at`,
  `pi`.`paid_at` AS `paid_at`,
  concat(`u1`.`username`) AS `processed_by_username`,
  concat(`u2`.`username`) AS `paid_by_username`
from ((((`payroll_items` `pi`
  join `payroll_periods` `pp` on((`pi`.`payroll_period_id` = `pp`.`id`)))
  join `employees` `e` on((`pi`.`employee_id` = `e`.`id`)))
  left join `users` `u1` on((`pi`.`processed_by` = `u1`.`id`)))
  left join `users` `u2` on((`pi`.`paid_by` = `u2`.`id`)))
where (`e`.`deleted_at` is null);

--
-- Final view structure for view `v_payroll_period_summary`
--
DROP VIEW IF EXISTS `v_payroll_period_summary`;
CREATE ALGORITHM=UNDEFINED
DEFINER=`root`@`localhost` SQL SECURITY DEFINER
VIEW `v_payroll_period_summary` AS
select `pp`.`id` AS `id`,
  `pp`.`year` AS `year`,
  `pp`.`month` AS `month`,
  `pp`.`period_number` AS `period_number`,
  `pp`.`start_date` AS `start_date`,
  `pp`.`end_date` AS `end_date`,
  `pp`.`pay_date` AS `pay_date`,
  `pp`.`status` AS `status`,
  count(`pi`.`id`) AS `employee_count`,
  coalesce(sum(`pi`.`basic_pay`),0) AS `total_basic_pay`,
  coalesce(sum(`pi`.`total_allowances`),0) AS `total_allowances`,
  coalesce(sum(`pi`.`total_deductions`),0) AS `total_deductions`,
  coalesce(sum(`pi`.`gross_pay`),0) AS `total_gross_pay`,
  coalesce(sum(`pi`.`net_pay`),0) AS `total_net_pay`,
  `pp`.`created_at` AS `created_at`,
  concat(`u1`.`username`) AS `created_by_username`,
  concat(`u2`.`username`) AS `finalized_by_username`
from (((`payroll_periods` `pp`
  left join `payroll_items` `pi` on((`pp`.`id` = `pi`.`payroll_period_id`)))
  left join `users` `u1` on((`pp`.`created_by` = `u1`.`id`)))
  left join `users` `u2` on((`pp`.`finalized_by` = `u2`.`id`)))
group by `pp`.`id`,`pp`.`year`,`pp`.`month`,`pp`.`period_number`,`pp`.`start_date`,`pp`.`end_date`,`pp`.`pay_date`,`pp`.`status`,`pp`.`created_at`,`u1`.`username`,`u2`.`username`;
