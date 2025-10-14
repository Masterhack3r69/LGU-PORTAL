-- Table structure for table `dtr_records`

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
