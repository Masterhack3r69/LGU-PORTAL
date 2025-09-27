-- Table structure for table `deduction_types`

DROP TABLE IF EXISTS `deduction_types`;

CREATE TABLE `deduction_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `default_amount` decimal(12,2) DEFAULT NULL,
  `calculation_type` enum('Fixed','Percentage','Formula') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Fixed',
  `percentage_base` enum('BasicPay','MonthlySalary','GrossPay') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `frequency` enum('Monthly','Annual','Conditional') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Monthly',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;