-- Table structure for table `leave_monetization_log`

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
  `status` enum('calculated','processed','paid','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'calculated',
  `reference_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
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