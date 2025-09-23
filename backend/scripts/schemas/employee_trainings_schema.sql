-- Table structure for table `employee_trainings`

DROP TABLE IF EXISTS `employee_trainings`;

CREATE TABLE `employee_trainings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `training_program_id` int DEFAULT NULL,
  `training_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `duration_hours` decimal(5,2) DEFAULT NULL,
  `venue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organizer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `certificate_issued` tinyint(1) DEFAULT '0',
  `certificate_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `training_program_id` (`training_program_id`),
  KEY `idx_employee_trainings` (`employee_id`),
  KEY `idx_training_dates` (`start_date`,`end_date`),
  CONSTRAINT `employee_trainings_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_trainings_ibfk_2` FOREIGN KEY (`training_program_id`) REFERENCES `training_programs` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;