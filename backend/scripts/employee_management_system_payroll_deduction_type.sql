

DROP TABLE IF EXISTS `payroll_deduction_types`;

CREATE TABLE `payroll_deduction_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `deduction_type` enum('fixed','percentage') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'fixed',
  `amount` decimal(10,2) DEFAULT '0.00',
  `percentage` decimal(5,4) DEFAULT '0.0000',
  `max_amount` decimal(10,2) DEFAULT NULL,
  `is_government` tinyint(1) DEFAULT '0',
  `is_mandatory` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payroll_deduction_types` VALUES (1,'GSIS','GSIS Contribution','Government Service Insurance System contribution','percentage',0.00,0.0900,NULL,1,1,1,'2025-09-17 19:16:12','2025-09-17 19:16:12'),(2,'PAGIBIG','Pag-IBIG Contribution','Home Development Mutual Fund contribution','percentage',0.00,0.0200,100.00,1,1,1,'2025-09-17 19:16:12','2025-09-17 19:16:12'),(3,'PHILHEALTH','PhilHealth Contribution','Philippine Health Insurance Corporation contribution','percentage',0.00,0.0275,1800.00,1,1,1,'2025-09-17 19:16:12','2025-09-17 19:16:12'),(4,'WITHHOLDING_TAX','Withholding Tax','Income tax withheld from salary','percentage',0.00,0.0000,NULL,1,1,1,'2025-09-17 19:16:12','2025-09-17 19:16:12'),(5,'SSS','SSS Contribution','Social Security System contribution (for private employees)','percentage',0.00,0.0450,1000.00,1,0,1,'2025-09-17 19:16:12','2025-09-17 19:16:12'),(6,'LOAN_DEDUCTION','Loan Deduction','Employee loan deduction','fixed',0.00,0.0000,NULL,0,0,1,'2025-09-17 19:16:12','2025-09-17 19:16:12'),(7,'TARDINESS','Tardiness Deduction','Deduction for tardiness/absences','fixed',0.00,0.0000,NULL,0,0,1,'2025-09-17 19:16:12','2025-09-17 19:16:12'),(8,'UNIFORM_DEDUCTION','Uniform Deduction','Deduction for uniform/equipment','fixed',0.00,0.0000,NULL,0,0,1,'2025-09-17 19:16:12','2025-09-17 19:16:12');
