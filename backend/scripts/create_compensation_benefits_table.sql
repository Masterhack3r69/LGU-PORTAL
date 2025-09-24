-- Create compensation benefits table
-- This script creates the comp_benefit_records table as specified in the workflow

USE employee_management_system;

-- Create the compensation benefits table
CREATE TABLE IF NOT EXISTS comp_benefit_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  benefit_type ENUM(
    'TERMINAL_LEAVE',
    'MONETIZATION',
    'PBB',
    'MID_YEAR_BONUS',
    'YEAR_END_BONUS',
    'EC',
    'GSIS',
    'LOYALTY'
  ) NOT NULL,
  days_used DECIMAL(6,2) DEFAULT NULL COMMENT 'For TLB/Monetization benefits',
  amount DECIMAL(12,2) NOT NULL,
  notes VARCHAR(255) DEFAULT NULL,
  processed_by INT NOT NULL COMMENT 'User ID who processed the benefit',
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

-- Foreign key constraints
FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
FOREIGN KEY (processed_by) REFERENCES users (id),

-- Indexes for better performance
INDEX idx_comp_benefits_employee (employee_id),
  INDEX idx_comp_benefits_type (benefit_type),
  INDEX idx_comp_benefits_processed_at (processed_at),
  INDEX idx_comp_benefits_employee_type (employee_id, benefit_type),
  INDEX idx_comp_benefits_year (processed_at, benefit_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Compensation and benefits processing history log';

-- Insert sample data for testing (optional)
-- This can be uncommented for development/testing purposes
/*
INSERT INTO comp_benefit_records (employee_id, benefit_type, days_used, amount, notes, processed_by) VALUES
(1, 'PBB', NULL, 50000.00, 'Performance-Based Bonus for 2024', 1),
(2, 'MID_YEAR_BONUS', NULL, 25000.00, '13th Month Bonus - Mid Year', 1),
(3, 'MONETIZATION', 15.00, 18181.82, 'Leave monetization - 15 days', 1),
(1, 'LOYALTY', NULL, 15000.00, 'Loyalty Award - 15 years of service', 1);
*/

-- Create a view for easier reporting
CREATE OR REPLACE VIEW v_compensation_benefits AS
SELECT
    cbr.id,
    cbr.employee_id,
    e.employee_number,
    CONCAT(
        e.first_name,
        ' ',
        IFNULL(
            CONCAT(LEFT(e.middle_name, 1), '. '),
            ''
        ),
        e.last_name
    ) as employee_name,
    e.plantilla_position,
    e.current_monthly_salary,
    cbr.benefit_type,
    cbr.days_used,
    cbr.amount,
    cbr.notes,
    cbr.processed_at,
    CONCAT(
        u.first_name,
        ' ',
        u.last_name
    ) as processed_by_name,
    YEAR(cbr.processed_at) as benefit_year,
    MONTH(cbr.processed_at) as benefit_month
FROM
    comp_benefit_records cbr
    JOIN employees e ON cbr.employee_id = e.id
    JOIN users u ON cbr.processed_by = u.id
ORDER BY cbr.processed_at DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON comp_benefit_records TO 'ems_user'@'localhost';
-- GRANT SELECT ON v_compensation_benefits TO 'ems_user'@'localhost';

SELECT 'Compensation & Benefits table created successfully!' as status;