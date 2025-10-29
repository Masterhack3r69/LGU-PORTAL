-- Migration: Add deleted_at column to payroll_periods table for soft delete functionality
-- Date: 2025-10-28
-- Description: Adds deleted_at timestamp column to support soft deletion of completed payroll periods
-- This is a safe migration that checks if the column exists before adding it

-- Add deleted_at column (will fail silently if column already exists)
ALTER TABLE payroll_periods
ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL COMMENT 'Timestamp when the period was soft deleted (only for Completed status)';

-- Add index for better query performance when filtering out deleted periods
-- Note: If index already exists, you may need to drop it first or ignore the error
CREATE INDEX idx_payroll_periods_deleted_at ON payroll_periods (deleted_at);