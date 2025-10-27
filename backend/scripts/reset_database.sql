-- Reset Database Script
-- This script drops all tables and recreates the database structure

SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `comp_benefit_records`;
DROP TABLE IF EXISTS `dtr_records`;
DROP TABLE IF EXISTS `dtr_import_batches`;
DROP TABLE IF EXISTS `employee_allowance_overrides`;
DROP TABLE IF EXISTS `employee_deduction_overrides`;
DROP TABLE IF EXISTS `employee_documents`;
DROP TABLE IF EXISTS `employee_education`;
DROP TABLE IF EXISTS `employee_leave_balances`;
DROP TABLE IF EXISTS `employee_trainings`;
DROP TABLE IF EXISTS `exam_certificates`;
DROP TABLE IF EXISTS `leave_applications`;
DROP TABLE IF EXISTS `leave_balance_adjustments`;
DROP TABLE IF EXISTS `leave_monetization_log`;
DROP TABLE IF EXISTS `monthly_accrual_log`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `payroll_item_lines`;
DROP TABLE IF EXISTS `payroll_items`;
DROP TABLE IF EXISTS `payroll_periods`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `allowance_types`;
DROP TABLE IF EXISTS `deduction_types`;
DROP TABLE IF EXISTS `document_types`;
DROP TABLE IF EXISTS `leave_types`;
DROP TABLE IF EXISTS `salary_grades`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `training_programs`;
DROP TABLE IF EXISTS `users`;

-- Drop views
DROP VIEW IF EXISTS `v_compensation_benefits`;
DROP VIEW IF EXISTS `v_dtr_records_detail`;
DROP VIEW IF EXISTS `v_employee_payroll_details`;
DROP VIEW IF EXISTS `v_payroll_period_summary`;

SET FOREIGN_KEY_CHECKS = 1;

-- Now run the database_schema.sql to recreate all tables
-- Execute: SOURCE backend/scripts/database_schema.sql
