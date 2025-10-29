-- Migration: Add comprehensive PDS (Personal Data Sheet) fields to employees table
-- Date: 2025-10-29
-- Description: Adds all fields from the Philippine Civil Service Commission PDS form

-- I. PERSONAL INFORMATION (Additional fields)
ALTER TABLE employees
ADD COLUMN height DECIMAL(5, 2) COMMENT 'Height in meters',
ADD COLUMN weight DECIMAL(5, 2) COMMENT 'Weight in kilograms',
ADD COLUMN blood_type VARCHAR(5) COMMENT 'Blood type (A+, B+, O+, AB+, etc.)',
ADD COLUMN umid_id_no VARCHAR(50) COMMENT 'UMID ID Number',
ADD COLUMN philsys_number VARCHAR(50) COMMENT 'PhilSys Number (PSN)',
ADD COLUMN agency_employee_no VARCHAR(50) COMMENT 'Agency Employee Number',
ADD COLUMN citizenship VARCHAR(50) DEFAULT 'Filipino' COMMENT 'Citizenship',
ADD COLUMN dual_citizenship_country VARCHAR(100) COMMENT 'Country if dual citizen',

-- Residential Address (detailed breakdown)
ADD COLUMN residential_house_no VARCHAR(50) COMMENT 'House/Block/Lot No',
ADD COLUMN residential_street VARCHAR(100) COMMENT 'Street',
ADD COLUMN residential_subdivision VARCHAR(100) COMMENT 'Subdivision/Village',
ADD COLUMN residential_barangay VARCHAR(100) COMMENT 'Barangay',
ADD COLUMN residential_city VARCHAR(100) COMMENT 'City/Municipality',
ADD COLUMN residential_province VARCHAR(100) COMMENT 'Province',
ADD COLUMN residential_zipcode VARCHAR(10) COMMENT 'ZIP Code',

-- Permanent Address (detailed breakdown)
ADD COLUMN permanent_house_no VARCHAR(50) COMMENT 'House/Block/Lot No',
ADD COLUMN permanent_street VARCHAR(100) COMMENT 'Street',
ADD COLUMN permanent_subdivision VARCHAR(100) COMMENT 'Subdivision/Village',
ADD COLUMN permanent_barangay VARCHAR(100) COMMENT 'Barangay',
ADD COLUMN permanent_city VARCHAR(100) COMMENT 'City/Municipality',
ADD COLUMN permanent_province VARCHAR(100) COMMENT 'Province',
ADD COLUMN permanent_zipcode VARCHAR(10) COMMENT 'ZIP Code',
ADD COLUMN telephone_no VARCHAR(20) COMMENT 'Telephone Number',
ADD COLUMN mobile_no VARCHAR(20) COMMENT 'Mobile Number';

-- II. FAMILY BACKGROUND
CREATE TABLE IF NOT EXISTS employee_family_background (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,

-- Spouse Information
spouse_surname VARCHAR(100),
spouse_first_name VARCHAR(100),
spouse_middle_name VARCHAR(100),
spouse_name_extension VARCHAR(10),
spouse_occupation VARCHAR(100),
spouse_employer_name VARCHAR(200),
spouse_business_address TEXT,
spouse_telephone_no VARCHAR(20),

-- Father Information
father_surname VARCHAR(100),
father_first_name VARCHAR(100),
father_middle_name VARCHAR(100),
father_name_extension VARCHAR(10),

-- Mother Information


mother_maiden_surname VARCHAR(100),
    mother_first_name VARCHAR(100),
    mother_middle_name VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_family (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Children Information
CREATE TABLE IF NOT EXISTS employee_children (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    INDEX idx_employee_children (employee_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- III. EDUCATIONAL BACKGROUND
CREATE TABLE IF NOT EXISTS employee_education (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    level ENUM(
        'ELEMENTARY',
        'SECONDARY',
        'VOCATIONAL',
        'COLLEGE',
        'GRADUATE_STUDIES'
    ) NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    degree_course TEXT COMMENT 'Basic Education/Degree/Course',
    period_from VARCHAR(10) COMMENT 'Year started',
    period_to VARCHAR(10) COMMENT 'Year ended',
    highest_level_units VARCHAR(100) COMMENT 'Highest level/units earned if not graduated',
    year_graduated VARCHAR(10),
    scholarship_honors TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    INDEX idx_employee_education (employee_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- IV. CIVIL SERVICE ELIGIBILITY (Already exists as exam_certificates, but let's add more fields)
ALTER TABLE exam_certificates
ADD COLUMN IF NOT EXISTS rating DECIMAL(5, 2) COMMENT 'Rating if applicable',
ADD COLUMN IF NOT EXISTS license_number VARCHAR(100) COMMENT 'License number if applicable',
ADD COLUMN IF NOT EXISTS validity_date DATE COMMENT 'License validity date';

-- V. WORK EXPERIENCE
CREATE TABLE IF NOT EXISTS employee_work_experience (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date_from DATE,
    date_to DATE,
    position_title VARCHAR(255) NOT NULL,
    department_agency VARCHAR(255) NOT NULL,
    monthly_salary DECIMAL(12, 2),
    salary_grade VARCHAR(20),
    status_of_appointment VARCHAR(100),
    is_government_service BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    INDEX idx_employee_work_exp (employee_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- VI. VOLUNTARY WORK
CREATE TABLE IF NOT EXISTS employee_voluntary_work (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    organization_address TEXT,
    date_from DATE,
    date_to DATE,
    number_of_hours INT,
    position_nature VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    INDEX idx_employee_voluntary (employee_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- VII. LEARNING AND DEVELOPMENT (Already exists as training_programs, but let's ensure proper structure)
-- The training_programs table already handles this section

-- VIII. OTHER INFORMATION
CREATE TABLE IF NOT EXISTS employee_other_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    special_skills TEXT COMMENT 'Special skills and hobbies',
    non_academic_distinctions TEXT COMMENT 'Non-academic distinctions/recognition',
    membership_associations TEXT COMMENT 'Membership in associations/organizations',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_other_info (employee_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Add indexes for better performance
CREATE INDEX idx_employees_citizenship ON employees (citizenship);

CREATE INDEX idx_employees_blood_type ON employees (blood_type);

CREATE INDEX idx_employees_residential_city ON employees (residential_city);

CREATE INDEX idx_employees_permanent_city ON employees (permanent_city);