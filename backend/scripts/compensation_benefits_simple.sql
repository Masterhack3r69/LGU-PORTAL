-- Active: 1756658110151@@localhost@3306@employee_management_system
-- Simple SQL script for Compensation & Benefits table creation
-- Run this directly in MySQL Workbench or command line

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
    ) AS employee_name,
    e.plantilla_position,
    e.current_monthly_salary,
    cbr.benefit_type,
    cbr.days_used,
    cbr.amount,
    cbr.notes,
    cbr.processed_at,
    YEAR(cbr.processed_at) AS benefit_year,
    MONTH(cbr.processed_at) AS benefit_month
FROM
    comp_benefit_records cbr
    JOIN employees e ON cbr.employee_id = e.id
    LEFT JOIN users u ON cbr.processed_by = u.id
ORDER BY cbr.processed_at DESC;

-- Verify table creation
SELECT 'Compensation & Benefits table and view created successfully!' AS status;

-- Show table structure
DESCRIBE comp_benefit_records;