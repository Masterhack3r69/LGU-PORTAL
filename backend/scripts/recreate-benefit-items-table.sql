-- Recreate benefit_items table with proper structure
-- First, disable foreign key checks to allow dropping referenced tables
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing table if it exists
DROP TABLE IF EXISTS `benefit_items`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create fresh benefit_items table
CREATE TABLE `benefit_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `benefit_cycle_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `base_salary` decimal(12,2) NOT NULL,
  `service_months` decimal(4,2) NOT NULL DEFAULT '12.00',
  `calculated_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `adjustment_amount` decimal(12,2) DEFAULT '0.00',
  `final_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(12,2) DEFAULT '0.00',
  `net_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `calculation_basis` text,
  `status` enum('Draft','Calculated','Approved','Paid','Cancelled') NOT NULL DEFAULT 'Draft',
  `is_eligible` tinyint(1) NOT NULL DEFAULT '1',
  `eligibility_notes` text,
  `processed_by` int DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `paid_by` int DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_benefit_cycle_employee` (`benefit_cycle_id`,`employee_id`),
  KEY `idx_benefit_items_cycle_status` (`benefit_cycle_id`,`status`),
  KEY `idx_benefit_items_employee_status` (`employee_id`,`status`),
  KEY `idx_benefit_items_payment_status` (`status`,`paid_at`),
  KEY `processed_by` (`processed_by`),
  KEY `paid_by` (`paid_by`),
  CONSTRAINT `benefit_items_ibfk_1` FOREIGN KEY (`benefit_cycle_id`) REFERENCES `benefit_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `benefit_items_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `benefit_items_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `benefit_items_ibfk_4` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert a test record to verify the table works
INSERT INTO benefit_items 
(benefit_cycle_id, employee_id, base_salary, service_months, calculated_amount, final_amount, net_amount, status, is_eligible, calculation_basis)
VALUES 
(13, 37, 26906.00, 13, 5000.00, 5000.00, 5000.00, 'Calculated', 1, 'Test record for table verification');

-- Verify the insert worked
SELECT id, benefit_cycle_id, employee_id, final_amount, status FROM benefit_items WHERE benefit_cycle_id = 13;

-- Clean up test record
DELETE FROM benefit_items WHERE benefit_cycle_id = 13 AND employee_id = 37 AND calculation_basis = 'Test record for table verification';

-- Show final table structure
DESCRIBE benefit_items;