-- Compensation & Benefits Module Database Schema
-- This script creates all tables required for the compensation and benefits management system
-- Execute this script after the main EMS database schema

-- =====================================================================
-- BENEFIT TYPES TABLE
-- Defines different types of benefits (13th Month, 14th Month, PBB, etc.)
-- =====================================================================
CREATE TABLE IF NOT EXISTS `benefit_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` text,
  `category` enum('Annual','Special','Terminal','Performance','Loyalty') NOT NULL DEFAULT 'Annual',
  `calculation_type` enum('Fixed','Percentage','Formula','Manual') NOT NULL DEFAULT 'Formula',
  `calculation_formula` text COMMENT 'Formula for calculation (e.g., basic_pay / 12 * months_worked)',
  `percentage_rate` decimal(5,2) DEFAULT NULL COMMENT 'Percentage rate if calculation_type is Percentage',
  `fixed_amount` decimal(12,2) DEFAULT NULL COMMENT 'Fixed amount if calculation_type is Fixed',
  `is_taxable` boolean NOT NULL DEFAULT TRUE,
  `is_prorated` boolean NOT NULL DEFAULT TRUE COMMENT 'Whether benefit is prorated based on service months',
  `minimum_service_months` int DEFAULT 4 COMMENT 'Minimum months of service required',
  `frequency` enum('Annual','Biannual','Event-Based') NOT NULL DEFAULT 'Annual',
  `is_active` boolean NOT NULL DEFAULT TRUE,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `benefit_types_name_unique` (`name`),
  UNIQUE KEY `benefit_types_code_unique` (`code`),
  KEY `idx_benefit_types_category` (`category`),
  KEY `idx_benefit_types_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuration for different types of employee benefits';

-- =====================================================================
-- BENEFIT CYCLES TABLE
-- Manages benefit processing cycles (yearly or event-based)
-- =====================================================================
CREATE TABLE IF NOT EXISTS `benefit_cycles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `benefit_type_id` int NOT NULL,
  `cycle_year` year NOT NULL,
  `cycle_name` varchar(100) NOT NULL COMMENT 'e.g., "2024 Mid-Year Bonus", "2024 Performance Bonus"',
  `applicable_date` date NOT NULL COMMENT 'Date when benefit is applicable',
  `payment_date` date DEFAULT NULL COMMENT 'Scheduled payment date',
  `cutoff_date` date DEFAULT NULL COMMENT 'Service cutoff date for eligibility',
  `status` enum('Draft','Processing','Completed','Released','Cancelled') NOT NULL DEFAULT 'Draft',
  `total_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'Total amount for all employees in this cycle',
  `employee_count` int DEFAULT 0 COMMENT 'Number of employees included',
  `created_by` int NOT NULL,
  `processed_by` int DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `finalized_by` int DEFAULT NULL,
  `finalized_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_benefit_cycle` (`benefit_type_id`,`cycle_year`,`cycle_name`),
  KEY `idx_benefit_cycles_year` (`cycle_year`),
  KEY `idx_benefit_cycles_status` (`status`),
  KEY `idx_benefit_cycles_dates` (`applicable_date`,`payment_date`),
  KEY `idx_benefit_cycles_created_by` (`created_by`),
  KEY `idx_benefit_cycles_processed_by` (`processed_by`),
  KEY `idx_benefit_cycles_finalized_by` (`finalized_by`),
  CONSTRAINT `benefit_cycles_benefit_type_fk` FOREIGN KEY (`benefit_type_id`) REFERENCES `benefit_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `benefit_cycles_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `benefit_cycles_processed_by_fk` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `benefit_cycles_finalized_by_fk` FOREIGN KEY (`finalized_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Benefit processing cycles for yearly or event-based benefits';

-- =====================================================================
-- BENEFIT ITEMS TABLE
-- Individual employee benefit records for each cycle
-- =====================================================================
CREATE TABLE IF NOT EXISTS `benefit_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `benefit_cycle_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `base_salary` decimal(12,2) NOT NULL COMMENT 'Base salary used for calculation',
  `service_months` decimal(4,2) NOT NULL DEFAULT 12.00 COMMENT 'Months of service for proration',
  `calculated_amount` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'System calculated amount',
  `adjustment_amount` decimal(12,2) DEFAULT 0.00 COMMENT 'Manual adjustment amount',
  `final_amount` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Final amount after adjustments',
  `tax_amount` decimal(12,2) DEFAULT 0.00 COMMENT 'Tax withheld if applicable',
  `net_amount` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Net amount to be paid',
  `calculation_basis` text COMMENT 'Details of how amount was calculated',
  `status` enum('Draft','Calculated','Approved','Paid','Cancelled') NOT NULL DEFAULT 'Draft',
  `is_eligible` boolean NOT NULL DEFAULT TRUE,
  `eligibility_notes` text COMMENT 'Notes about eligibility or ineligibility',
  `processed_by` int DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `paid_by` int DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL COMMENT 'Payment reference number',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_benefit_cycle_employee` (`benefit_cycle_id`,`employee_id`),
  KEY `idx_benefit_items_employee` (`employee_id`),
  KEY `idx_benefit_items_status` (`status`),
  KEY `idx_benefit_items_eligible` (`is_eligible`),
  KEY `idx_benefit_items_processed_by` (`processed_by`),
  KEY `idx_benefit_items_paid_by` (`paid_by`),
  KEY `idx_benefit_items_amounts` (`calculated_amount`,`final_amount`),
  CONSTRAINT `benefit_items_cycle_fk` FOREIGN KEY (`benefit_cycle_id`) REFERENCES `benefit_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `benefit_items_employee_fk` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `benefit_items_processed_by_fk` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `benefit_items_paid_by_fk` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_benefit_service_months` CHECK ((`service_months` >= 0 AND `service_months` <= 60)),
  CONSTRAINT `chk_benefit_amounts_positive` CHECK ((`base_salary` >= 0 AND `calculated_amount` >= 0 AND `final_amount` >= 0 AND `net_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Individual employee benefit records';

-- =====================================================================
-- BENEFIT ADJUSTMENTS TABLE
-- Track manual adjustments made to benefit items
-- =====================================================================
CREATE TABLE IF NOT EXISTS `benefit_adjustments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `benefit_item_id` int NOT NULL,
  `adjustment_type` enum('Increase','Decrease','Override') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `description` text,
  `adjusted_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_benefit_adjustments_item` (`benefit_item_id`),
  KEY `idx_benefit_adjustments_type` (`adjustment_type`),
  KEY `idx_benefit_adjustments_user` (`adjusted_by`),
  KEY `idx_benefit_adjustments_approver` (`approved_by`),
  CONSTRAINT `benefit_adjustments_item_fk` FOREIGN KEY (`benefit_item_id`) REFERENCES `benefit_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `benefit_adjustments_adjusted_by_fk` FOREIGN KEY (`adjusted_by`) REFERENCES `users` (`id`),
  CONSTRAINT `benefit_adjustments_approved_by_fk` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Manual adjustments to benefit items';

-- =====================================================================
-- CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================================

-- Additional composite indexes for common queries
CREATE INDEX `idx_benefit_cycles_type_year_status` ON `benefit_cycles` (`benefit_type_id`, `cycle_year`, `status`);
CREATE INDEX `idx_benefit_items_cycle_status` ON `benefit_items` (`benefit_cycle_id`, `status`);
CREATE INDEX `idx_benefit_items_employee_status` ON `benefit_items` (`employee_id`, `status`);
CREATE INDEX `idx_benefit_items_payment_status` ON `benefit_items` (`status`, `paid_at`);

-- =====================================================================
-- INSERT DEFAULT BENEFIT TYPES
-- =====================================================================
INSERT INTO `benefit_types` (`name`, `code`, `description`, `category`, `calculation_type`, `calculation_formula`, `is_taxable`, `is_prorated`, `minimum_service_months`, `frequency`) VALUES
('13th Month Pay (Mid-Year Bonus)', 'MID_YEAR', 'Mid-year bonus equivalent to 1/12 of annual basic salary', 'Annual', 'Formula', 'basic_salary / 12 * (service_months / 12)', TRUE, TRUE, 4, 'Annual'),
('14th Month Pay (Year-End Bonus)', 'YEAR_END', 'Year-end bonus equivalent to 1/12 of annual basic salary', 'Annual', 'Formula', 'basic_salary / 12 * (service_months / 12)', TRUE, TRUE, 4, 'Annual'),
('Performance-Based Bonus (PBB)', 'PBB', 'Performance-based bonus for eligible employees', 'Performance', 'Manual', NULL, TRUE, TRUE, 4, 'Annual'),
('Loyalty Award - 10 Years', 'LOYALTY_10', 'Loyalty award for 10 years of service', 'Loyalty', 'Fixed', NULL, FALSE, FALSE, 120, 'Event-Based'),
('Loyalty Award - 15 Years', 'LOYALTY_15', 'Loyalty award for 15 years of service', 'Loyalty', 'Fixed', NULL, FALSE, FALSE, 180, 'Event-Based'),
('Loyalty Award - 20 Years', 'LOYALTY_20', 'Loyalty award for 20 years of service', 'Loyalty', 'Fixed', NULL, FALSE, FALSE, 240, 'Event-Based'),
('Loyalty Award - 25 Years', 'LOYALTY_25', 'Loyalty award for 25 years of service', 'Loyalty', 'Fixed', NULL, FALSE, FALSE, 300, 'Event-Based'),
('Terminal Benefit Claims', 'TERMINAL', 'Terminal benefits for retiring or separating employees', 'Terminal', 'Manual', NULL, TRUE, FALSE, 0, 'Event-Based'),
('Monetization of Leave Credits', 'LEAVE_MONETIZE', 'Monetization of accumulated leave credits', 'Special', 'Formula', 'daily_rate * leave_days', TRUE, FALSE, 0, 'Event-Based'),
('Employee Compensation (EC)', 'EC', 'Employee compensation benefit', 'Special', 'Manual', NULL, TRUE, FALSE, 0, 'Annual'),
('GSIS Contributions/Claims', 'GSIS_CLAIM', 'GSIS-related contributions or claims', 'Special', 'Manual', NULL, FALSE, FALSE, 0, 'Event-Based');

-- =====================================================================
-- INSERT DEFAULT LOYALTY AWARD AMOUNTS
-- =====================================================================
UPDATE `benefit_types` SET `fixed_amount` = 10000.00 WHERE `code` = 'LOYALTY_10';
UPDATE `benefit_types` SET `fixed_amount` = 15000.00 WHERE `code` = 'LOYALTY_15';
UPDATE `benefit_types` SET `fixed_amount` = 20000.00 WHERE `code` = 'LOYALTY_20';
UPDATE `benefit_types` SET `fixed_amount` = 25000.00 WHERE `code` = 'LOYALTY_25';

-- =====================================================================
-- CREATE TRIGGERS FOR AUDIT LOGGING
-- =====================================================================

DELIMITER $$

-- Trigger for benefit_cycles audit logging
CREATE TRIGGER `benefit_cycles_audit_insert` AFTER INSERT ON `benefit_cycles`
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        user_id, action, table_name, record_id,
        old_values, new_values
    ) VALUES (
        NEW.created_by, 'INSERT', 'benefit_cycles', NEW.id,
        NULL,
        JSON_OBJECT('cycle_name', NEW.cycle_name, 'benefit_type_id', NEW.benefit_type_id, 'cycle_year', NEW.cycle_year, 'status', NEW.status)
    );
END$$

CREATE TRIGGER `benefit_cycles_audit_update` AFTER UPDATE ON `benefit_cycles`
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        user_id, action, table_name, record_id,
        old_values, new_values
    ) VALUES (
        COALESCE(NEW.processed_by, NEW.finalized_by, NEW.created_by), 'UPDATE', 'benefit_cycles', NEW.id,
        JSON_OBJECT('status', OLD.status, 'total_amount', OLD.total_amount, 'employee_count', OLD.employee_count),
        JSON_OBJECT('status', NEW.status, 'total_amount', NEW.total_amount, 'employee_count', NEW.employee_count)
    );
END$$

-- Trigger for benefit_items audit logging
CREATE TRIGGER `benefit_items_audit_insert` AFTER INSERT ON `benefit_items`
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        user_id, action, table_name, record_id,
        old_values, new_values
    ) VALUES (
        NEW.processed_by, 'INSERT', 'benefit_items', NEW.id,
        NULL,
        JSON_OBJECT('employee_id', NEW.employee_id, 'calculated_amount', NEW.calculated_amount, 'final_amount', NEW.final_amount, 'status', NEW.status)
    );
END$$

CREATE TRIGGER `benefit_items_audit_update` AFTER UPDATE ON `benefit_items`
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        user_id, action, table_name, record_id,
        old_values, new_values
    ) VALUES (
        COALESCE(NEW.paid_by, NEW.processed_by), 'UPDATE', 'benefit_items', NEW.id,
        JSON_OBJECT('calculated_amount', OLD.calculated_amount, 'final_amount', OLD.final_amount, 'status', OLD.status),
        JSON_OBJECT('calculated_amount', NEW.calculated_amount, 'final_amount', NEW.final_amount, 'status', NEW.status)
    );
END$$

DELIMITER ;

-- =====================================================================
-- CREATE VIEWS FOR REPORTING
-- =====================================================================

-- Benefit cycle summary view
CREATE OR REPLACE VIEW `v_benefit_cycle_summary` AS
SELECT 
    bc.id,
    bc.cycle_name,
    bt.name as benefit_type_name,
    bt.code as benefit_type_code,
    bt.category,
    bc.cycle_year,
    bc.status,
    bc.total_amount,
    bc.employee_count,
    bc.applicable_date,
    bc.payment_date,
    u1.username as created_by_username,
    u2.username as processed_by_username,
    u3.username as finalized_by_username,
    bc.created_at,
    bc.processed_at,
    bc.finalized_at
FROM benefit_cycles bc
LEFT JOIN benefit_types bt ON bc.benefit_type_id = bt.id
LEFT JOIN users u1 ON bc.created_by = u1.id
LEFT JOIN users u2 ON bc.processed_by = u2.id
LEFT JOIN users u3 ON bc.finalized_by = u3.id;

-- Employee benefit summary view
CREATE OR REPLACE VIEW `v_employee_benefit_summary` AS
SELECT 
    bi.id,
    e.employee_number,
    CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as employee_name,
    e.current_monthly_salary,
    bc.cycle_name,
    bt.name as benefit_type_name,
    bt.code as benefit_type_code,
    bc.cycle_year,
    bi.base_salary,
    bi.service_months,
    bi.calculated_amount,
    bi.adjustment_amount,
    bi.final_amount,
    bi.tax_amount,
    bi.net_amount,
    bi.status,
    bi.is_eligible,
    bi.calculation_basis,
    bi.payment_reference,
    bi.paid_at
FROM benefit_items bi
LEFT JOIN benefit_cycles bc ON bi.benefit_cycle_id = bc.id
LEFT JOIN benefit_types bt ON bc.benefit_type_id = bt.id
LEFT JOIN employees e ON bi.employee_id = e.id
WHERE e.deleted_at IS NULL;

-- =====================================================================
-- END OF COMPENSATION & BENEFITS SCHEMA
-- =====================================================================