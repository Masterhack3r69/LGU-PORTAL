-- Table structure for table `monthly_accrual_log`

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