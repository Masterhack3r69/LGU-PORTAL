-- Table structure for table `dtr_import_batches`

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
