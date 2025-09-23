-- Table structure for table `employee_education`

DROP TABLE IF EXISTS `employee_education`;

CREATE TABLE `employee_education` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `education_level` enum('Elementary','High School','Vocational','College','Graduate Studies','Post Graduate') COLLATE utf8mb4_unicode_ci NOT NULL,
  `school_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_degree` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_graduated` year DEFAULT NULL,
  `highest_level_units_earned` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scholarship_honors` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_education` (`employee_id`),
  CONSTRAINT `employee_education_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;