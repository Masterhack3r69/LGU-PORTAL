-- Table structure for table `payroll_items`

DROP TABLE IF EXISTS `payroll_items`;

CREATE TABLE `payroll_items` (
    `id` int NOT NULL AUTO_INCREMENT,
    `payroll_period_id` int NOT NULL,
    `employee_id` int NOT NULL,
    `working_days` decimal(4, 2) NOT NULL DEFAULT '22.00',
    `daily_rate` decimal(10, 2) NOT NULL,
    `basic_pay` decimal(12, 2) NOT NULL,
    `total_allowances` decimal(12, 2) NOT NULL DEFAULT '0.00',
    `total_deductions` decimal(12, 2) NOT NULL DEFAULT '0.00',
    `gross_pay` decimal(12, 2) NOT NULL DEFAULT '0.00',
    `net_pay` decimal(12, 2) NOT NULL,
    `status` enum(
        'Draft',
        'Processed',
        'Finalized',
        'Paid'
    ) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
    `processed_by` int DEFAULT NULL,
    `processed_at` timestamp NULL DEFAULT NULL,
    `paid_by` int DEFAULT NULL,
    `paid_at` timestamp NULL DEFAULT NULL,
    `notes` text COLLATE utf8mb4_unicode_ci,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_payroll_period_employee` (
        `payroll_period_id`,
        `employee_id`
    ),
    KEY `processed_by` (`processed_by`),
    KEY `paid_by` (`paid_by`),
    KEY `idx_payroll_items_period_status` (`payroll_period_id`, `status`),
    KEY `idx_payroll_items_employee_status` (`employee_id`, `status`),
    CONSTRAINT `payroll_items_ibfk_1` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE,
    CONSTRAINT `payroll_items_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
    CONSTRAINT `payroll_items_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
    CONSTRAINT `payroll_items_ibfk_4` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 19 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;