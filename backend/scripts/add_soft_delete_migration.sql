-- Migration: Add soft delete support to employees table
-- Date: 2025-09-09
-- Description: Adds deleted_at column to employees table for soft delete functionality

USE employee_management_system;

-- Add deleted_at column to employees table
ALTER TABLE employees 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

-- Add index for performance on soft delete queries
CREATE INDEX idx_employees_deleted_at ON employees(deleted_at);

-- Add index for common query patterns with soft delete
CREATE INDEX idx_employees_active ON employees(employment_status, deleted_at);
CREATE INDEX idx_employees_search_active ON employees(first_name, last_name, deleted_at);

-- Update existing records to ensure they are not marked as deleted
UPDATE employees SET deleted_at = NULL WHERE deleted_at IS NULL;

-- Verify the migration
SELECT 
    COUNT(*) as total_employees,
    COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_employees,
    COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_employees
FROM employees;

COMMIT;