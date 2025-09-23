-- Table structure for table `employee_deduction_overrides`

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