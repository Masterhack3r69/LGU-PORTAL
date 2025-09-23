-- Table structure for table `salary_grades`

DROP TABLE IF EXISTS `salary_grades`;

CREATE TABLE `salary_grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grade` int NOT NULL,
  `step_1` decimal(12,2) NOT NULL,
  `step_2` decimal(12,2) NOT NULL,
  `step_3` decimal(12,2) NOT NULL,
  `step_4` decimal(12,2) NOT NULL,
  `step_5` decimal(12,2) NOT NULL,
  `step_6` decimal(12,2) NOT NULL,
  `step_7` decimal(12,2) NOT NULL,
  `step_8` decimal(12,2) NOT NULL,
  `effective_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `grade` (`grade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;