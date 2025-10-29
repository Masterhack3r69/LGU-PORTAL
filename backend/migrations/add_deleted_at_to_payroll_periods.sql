-- Active: 1760420048574@@localhost@3306@employee_management_system
-- Migration: Add deleted_at column to payroll_periods table for soft delete functionality
-- Date: 2025-10-28
-- Description: Adds deleted_at timestamp column to support soft deletion of completed payroll periods

-- Add deleted_at column if it doesn't exist
ALTER TABLE payroll_periods
ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL COMMENT 'Timestamp when the period was soft deleted (only for Completed status)';

-- Add index for better query performance when filtering out deleted periods
CREATE INDEX idx_payroll_periods_deleted_at ON payroll_periods (deleted_at);

-- Add comment to the table
ALTER TABLE payroll_periods COMMENT = 'Payroll periods with soft delete support for completed periods';