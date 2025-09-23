-- Table structure for table `leave_balance_adjustments`

DROP TABLE IF EXISTS `leave_balance_adjustments`;

CREATE TABLE `leave_balance_adjustments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `year` year NOT NULL,
  `adjustment_type` enum('credit','debit','carry_forward','monetization','correction') COLLATE utf8mb4_unicode_ci NOT NULL,
  `days_adjusted` decimal(6,2) NOT NULL,
  `previous_balance` decimal(6,2) NOT NULL,
  `new_balance` decimal(6,2) NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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