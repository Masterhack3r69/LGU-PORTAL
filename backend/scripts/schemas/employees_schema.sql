-- Table structure for table `employees`

DROP TABLE IF EXISTS `employees`;

CREATE TABLE `employees` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int DEFAULT NULL,
    `employee_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
    `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `suffix` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `sex` enum('Male', 'Female') COLLATE utf8mb4_unicode_ci NOT NULL,
    `birth_date` date NOT NULL,
    `birth_place` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `civil_status` enum(
        'Single',
        'Married',
        'Widowed',
        'Separated',
        'Divorced'
    ) COLLATE utf8mb4_unicode_ci DEFAULT 'Single',
    `contact_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `email_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `current_address` text COLLATE utf8mb4_unicode_ci,
    `permanent_address` text COLLATE utf8mb4_unicode_ci,
    `tin` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `gsis_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `pagibig_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `philhealth_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `sss_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `appointment_date` date NOT NULL,
    `plantilla_position` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `plantilla_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `salary_grade` int DEFAULT NULL,
    `step_increment` int DEFAULT '1',
    `current_monthly_salary` decimal(12, 2) DEFAULT NULL,
    `current_daily_rate` decimal(10, 2) DEFAULT NULL,
    `highest_monthly_salary` decimal(12, 2) DEFAULT NULL,
    `highest_daily_rate` decimal(10, 2) DEFAULT NULL,
    `employment_status` enum(
        'Active',
        'Resigned',
        'Retired',
        'Terminated',
        'AWOL'
    ) COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
    `separation_date` date DEFAULT NULL,
    `separation_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `employee_number` (`employee_number`),
    UNIQUE KEY `user_id` (`user_id`),
    KEY `idx_employee_number` (`employee_number`),
    KEY `idx_employment_status` (`employment_status`),
    KEY `idx_appointment_date` (`appointment_date`),
    KEY `idx_employees_department` (`department`),
    KEY `idx_employees_deleted_at` (`deleted_at`),
    KEY `idx_employees_active` (
        `employment_status`,
        `deleted_at`
    ),
    KEY `idx_employees_search_active` (
        `first_name`,
        `last_name`,
        `deleted_at`
    ),
    CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE = InnoDB AUTO_INCREMENT = 38 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;