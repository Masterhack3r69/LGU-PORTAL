-- ============================================================================
-- DTR (Daily Time Record) Module Migration
-- Description: Adds tables and views for DTR import functionality
-- Date: 2025-10-14
-- Requirements: 6.1, 6.2, 6.3, 6.4, 7.2
-- ============================================================================

-- ============================================================================
-- Step 1: Create dtr_import_batches table
-- ============================================================================

DROP TABLE IF EXISTS `dtr_import_batches`;

CREATE TABLE `dtr_import_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_period_id` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `total_records` int NOT NULL DEFAULT 0,
  `valid_records` int NOT NULL DEFAULT 0,
  `invalid_records` int NOT NULL DEFAULT 0,
  `warning_records` int NOT NULL DEFAULT 0,
  `status` enum('Processing','Completed','Partial','Failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Processing',
  `error_log` json DEFAULT NULL COMMENT 'Stores all errors and warnings',
  `imported_by` int NOT NULL,
  `imported_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_batch_period` (`payroll_period_id`),
  KEY `idx_batch_status` (`status`),
  KEY `idx_batch_imported_by` (`imported_by`),
  KEY `idx_batch_imported_at` (`imported_at`),
  CONSTRAINT `dtr_import_batches_ibfk_1` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dtr_import_batches_ibfk_2` FOREIGN KEY (`imported_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DTR import batch tracking and audit trail';

-- ============================================================================
-- Step 2: Create dtr_records table
-- ============================================================================

DROP TABLE IF EXISTS `dtr_records`;

CREATE TABLE `dtr_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_period_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `employee_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Denormalized for reference',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `working_days` decimal(4,2) NOT NULL,
  `import_batch_id` int NOT NULL,
  `status` enum('Active','Superseded','Deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imported_by` int NOT NULL,
  `imported_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_period_batch` (`employee_id`,`payroll_period_id`,`import_batch_id`),
  KEY `idx_dtr_period` (`payroll_period_id`),
  KEY `idx_dtr_employee` (`employee_id`),
  KEY `idx_dtr_batch` (`import_batch_id`),
  KEY `idx_dtr_status` (`status`),
  KEY `idx_dtr_employee_number` (`employee_number`),
  KEY `idx_dtr_period_status` (`payroll_period_id`,`status`),
  CONSTRAINT `dtr_records_ibfk_1` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dtr_records_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dtr_records_ibfk_3` FOREIGN KEY (`import_batch_id`) REFERENCES `dtr_import_batches` (`id`),
  CONSTRAINT `dtr_records_ibfk_4` FOREIGN KEY (`imported_by`) REFERENCES `users` (`id`),
  CONSTRAINT `dtr_records_ibfk_5` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Daily Time Record attendance data';

-- ============================================================================
-- Step 3: Create v_dtr_records_detail view
-- ============================================================================

DROP VIEW IF EXISTS `v_dtr_records_detail`;

CREATE OR REPLACE VIEW `v_dtr_records_detail` AS
SELECT 
  dr.id,
  dr.payroll_period_id,
  pp.year,
  pp.month,
  pp.period_number,
  pp.start_date AS period_start_date,
  pp.end_date AS period_end_date,
  dr.employee_id,
  dr.employee_number,
  CONCAT(e.first_name, ' ', IFNULL(CONCAT(LEFT(e.middle_name, 1), '. '), ''), e.last_name) AS employee_name,
  e.plantilla_position,
  e.current_daily_rate,
  dr.start_date,
  dr.end_date,
  dr.working_days,
  (dr.working_days * e.current_daily_rate) AS calculated_basic_pay,
  dr.status,
  dr.notes,
  dr.import_batch_id,
  ib.file_name AS import_file_name,
  ib.imported_at AS import_date,
  u1.username AS imported_by_username,
  dr.updated_by,
  u2.username AS updated_by_username,
  dr.updated_at
FROM dtr_records dr
JOIN payroll_periods pp ON dr.payroll_period_id = pp.id
JOIN employees e ON dr.employee_id = e.id
JOIN dtr_import_batches ib ON dr.import_batch_id = ib.id
JOIN users u1 ON dr.imported_by = u1.id
LEFT JOIN users u2 ON dr.updated_by = u2.id
WHERE e.deleted_at IS NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================
