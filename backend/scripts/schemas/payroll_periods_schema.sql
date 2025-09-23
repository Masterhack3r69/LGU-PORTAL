-- Table structure for table `payroll_periods`

DROP TABLE IF EXISTS `payroll_periods`;

CREATE TABLE `payroll_periods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` year NOT NULL,
  `month` tinyint NOT NULL,
  `period_number` tinyint NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `pay_date` date NOT NULL,
  `status` enum('Draft','Processing','Completed','Paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;