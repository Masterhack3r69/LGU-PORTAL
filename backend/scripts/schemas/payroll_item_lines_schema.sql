-- Table structure for table `payroll_item_lines`

DROP TABLE IF EXISTS `payroll_item_lines`;

CREATE TABLE `payroll_item_lines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payroll_item_id` int NOT NULL,
  `line_type` enum('Allowance','Deduction','Adjustment') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_id` int DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `is_override` tinyint(1) NOT NULL DEFAULT '0',
  `calculation_basis` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payroll_item_id` (`payroll_item_id`),
  CONSTRAINT `payroll_item_lines_ibfk_1` FOREIGN KEY (`payroll_item_id`) REFERENCES `payroll_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;