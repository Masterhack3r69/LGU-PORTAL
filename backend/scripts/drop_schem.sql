-- Active: 1756484685261@@localhost@3306@employee_management_system
-- DROP TRIGGERS (if they exist)
DROP TRIGGER IF EXISTS `benefit_cycles_audit_insert`;
DROP TRIGGER IF EXISTS `benefit_cycles_audit_update`;
DROP TRIGGER IF EXISTS `benefit_items_audit_insert`;
DROP TRIGGER IF EXISTS `benefit_items_audit_update`;

-- DROP VIEWS
DROP VIEW IF EXISTS `v_employee_benefit_summary`;
DROP VIEW IF EXISTS `v_benefit_cycle_summary`;

-- Temporarily disable foreign key checks to avoid FK errors during drop
SET FOREIGN_KEY_CHECKS = 0;

-- DROP TABLES (drop in order that avoids FK constraint errors)
DROP TABLE IF EXISTS `benefit_adjustments`;
DROP TABLE IF EXISTS `benefit_items`;
DROP TABLE IF EXISTS `benefit_cycles`;
DROP TABLE IF EXISTS `benefit_types`;

-- If you created separate standalone indexes (outside table defs), drop them here.
-- Example (uncomment if needed):
-- DROP INDEX IF EXISTS `idx_benefit_cycles_type_year_status` ON `benefit_cycles`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
