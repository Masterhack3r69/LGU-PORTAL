-- Migration: Add medical certificate support to leave applications
-- Date: 2025-10-31

-- Add medical_certificate_path column to leave_applications table
ALTER TABLE `leave_applications`
ADD COLUMN `medical_certificate_path` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Path to uploaded medical certificate file' AFTER `review_notes`;

-- Add index for faster queries
ALTER TABLE `leave_applications`
ADD INDEX `idx_medical_certificate` (`medical_certificate_path`);

-- Update comment on table
ALTER TABLE `leave_applications` COMMENT = 'Leave applications with medical certificate support';