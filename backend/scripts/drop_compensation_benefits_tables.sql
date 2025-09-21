-- Drop Compensation & Benefits Tables and Views
-- This script removes all compensation and benefits related database objects

-- Drop views first (due to dependencies)
DROP VIEW IF EXISTS `v_compensation_summary`;
DROP VIEW IF EXISTS `v_compensation_migration_analysis`;

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS `benefit_item_lines`;
DROP TABLE IF EXISTS `benefit_items`;
DROP TABLE IF EXISTS `benefit_cycles`;
DROP TABLE IF EXISTS `employee_compensation`;
DROP TABLE IF EXISTS `compensation_types`;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS `tr_benefit_cycles_insert`;
DROP TRIGGER IF EXISTS `tr_benefit_cycles_update`;
DROP TRIGGER IF EXISTS `tr_employee_compensation_insert`;
DROP TRIGGER IF EXISTS `tr_employee_compensation_update`;

-- Drop indexes if they exist (they should be dropped automatically with tables, but just in case)
-- DROP INDEX IF EXISTS `idx_employee_compensation_employee_year_status` ON `employee_compensation`;
-- DROP INDEX IF EXISTS `idx_benefit_cycles_year_type_status` ON `benefit_cycles`;
-- DROP INDEX IF EXISTS `idx_benefit_items_cycle_employee` ON `benefit_items`;