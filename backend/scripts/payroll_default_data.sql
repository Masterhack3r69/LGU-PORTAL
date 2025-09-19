-- Insert default data for payroll system

-- Default Allowance Types
INSERT IGNORE INTO `allowance_types` (`name`, `code`, `description`, `default_amount`, `calculation_type`, `is_taxable`, `frequency`) VALUES
('Transportation Allowance', 'TRANS', 'Monthly transportation allowance for employees', 2000.00, 'Fixed', FALSE, 'Monthly'),
('Rice Allowance', 'RICE', 'Monthly rice subsidy allowance', 1500.00, 'Fixed', FALSE, 'Monthly'),
('Communication Allowance', 'COMM', 'Monthly communication allowance', 1000.00, 'Fixed', FALSE, 'Monthly'),
('Hazard Pay', 'HAZARD', 'Additional compensation for hazardous work', 0.00, 'Percentage', TRUE, 'Monthly'),
('Overtime Pay', 'OT', 'Overtime compensation', 0.00, 'Formula', TRUE, 'Monthly'),
('Night Differential', 'NIGHT', 'Night shift differential pay', 0.00, 'Percentage', TRUE, 'Monthly'),
('Holiday Pay', 'HOLIDAY', 'Holiday work compensation', 0.00, 'Formula', TRUE, 'Conditional'),
('Performance Bonus', 'PERF', 'Performance-based bonus', 0.00, 'Fixed', TRUE, 'Conditional');

-- Default Deduction Types
INSERT IGNORE INTO `deduction_types` (`name`, `code`, `description`, `default_amount`, `calculation_type`, `is_mandatory`, `frequency`) VALUES
('Income Tax', 'ITAX', 'Monthly income tax withholding', 0.00, 'Formula', TRUE, 'Monthly'),
('GSIS Premium', 'GSIS', 'Government Service Insurance System premium', 0.00, 'Percentage', TRUE, 'Monthly'),
('Pag-IBIG', 'PAGIBIG', 'Pag-IBIG Fund contribution', 100.00, 'Fixed', TRUE, 'Monthly'),
('PhilHealth', 'PHILHEALTH', 'Philippine Health Insurance Corporation premium', 0.00, 'Percentage', TRUE, 'Monthly'),
('Union Dues', 'UNION', 'Labor union membership dues', 50.00, 'Fixed', FALSE, 'Monthly'),
('Loan Payment', 'LOAN', 'Various loan payments', 0.00, 'Fixed', FALSE, 'Monthly'),
('Salary Loan', 'SALARY_LOAN', 'Salary loan deduction', 0.00, 'Fixed', FALSE, 'Monthly'),
('Emergency Loan', 'EMERGENCY_LOAN', 'Emergency loan deduction', 0.00, 'Fixed', FALSE, 'Monthly'),
('Multipurpose Loan', 'MPL', 'Multipurpose loan deduction', 0.00, 'Fixed', FALSE, 'Monthly'),
('Policy Loan', 'POLICY_LOAN', 'Policy loan deduction', 0.00, 'Fixed', FALSE, 'Monthly');