-- Create exam_certificates table
CREATE TABLE IF NOT EXISTS exam_certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    exam_name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(100),
    rating DECIMAL(5, 2),
    date_taken DATE,
    place_of_examination VARCHAR(255),
    license_number VARCHAR(100),
    validity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_exam_name (exam_name),
    INDEX idx_date_taken (date_taken)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
