-- Table structure for table `employee_leave_balances`

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
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;