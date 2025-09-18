

DROP TABLE IF EXISTS `payroll_allowance_types`;

CREATE TABLE `payroll_allowance_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `amount` decimal(10,2) DEFAULT '0.00',
  `is_monthly` tinyint(1) DEFAULT '1',
  `is_prorated` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payroll_allowance_types` VALUES (1,'SALARY','Basic Salary','Monthly basic salary',0.00,1,1,1,'2025-09-16 22:20:50','2025-09-16 22:20:50'),(2,'RATA','Representation & Transportation Allowance','Fixed monthly RATA allowance',2000.00,1,1,1,'2025-09-16 22:20:50','2025-09-17 19:04:40'),(3,'CA','Clothing Allowance','Annual clothing allowance (prorated monthly)',5000.00,1,1,1,'2025-09-16 22:20:50','2025-09-17 19:04:41'),(4,'MA','Medical Allowance','Monthly medical allowance',500.00,1,1,1,'2025-09-16 22:20:50','2025-09-17 19:04:46'),(5,'SLA','Subsistence & Laundry Allowance','Monthly subsistence and laundry allowance',1000.00,1,1,1,'2025-09-16 22:20:50','2025-09-17 19:04:47'),(6,'HA','Hazard Allowance','Monthly hazard pay allowance',500.00,1,1,1,'2025-09-16 22:20:50','2025-09-17 19:04:48'),(7,'PERA','PERA','Public Education Reorganization Act allowance',2000.00,1,1,1,'2025-09-16 22:20:50','2025-09-17 19:04:49'),(8,'ACA','Additional Compensation Allowance','Additional compensation allowance',1100.00,1,1,1,'2025-09-16 22:20:50','2025-09-17 19:22:32');
