-- Table structure for table `leave_applications`

DROP TABLE IF EXISTS `leave_applications`;

CREATE TABLE `leave_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days_requested` decimal(4,2) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('Pending','Approved','Rejected','Cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by` int DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_notes` text COLLATE utf8mb4_unicode_ci,
  `auto_approved` tinyint(1) DEFAULT '0' COMMENT 'Flag for automatically approved entries',
  `application_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unique application reference number',
  `is_admin_created` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_number` (`application_number`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_leave_applications` (`employee_id`),
  KEY `idx_leave_status` (`status`),
  KEY `idx_leave_dates` (`start_date`,`end_date`),
  KEY `idx_leave_applications_status_dates` (`status`,`start_date`,`end_date`),
  KEY `idx_leave_applications_employee_dates` (`employee_id`,`start_date`,`end_date`),
  KEY `idx_leave_applications_admin_created` (`is_admin_created`,`status`),
  CONSTRAINT `leave_applications_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_applications_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  CONSTRAINT `leave_applications_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;