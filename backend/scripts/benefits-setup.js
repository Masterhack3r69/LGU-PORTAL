// Compensation & Benefits setup script
const { pool } = require('../config/database');

async function createBenefitsTables() {
    try {
        console.log('🔄 Setting up Compensation & Benefits database tables...');
        
        // Test connection
        await pool.execute('SELECT 1');
        console.log('✅ Database connected');
        
        // 1. Benefit Types Table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS benefit_types (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(100) NOT NULL,
                code varchar(20) NOT NULL,
                description text,
                category enum('Annual','Special','Terminal','Performance','Loyalty') NOT NULL DEFAULT 'Annual',
                calculation_type enum('Fixed','Percentage','Formula','Manual') NOT NULL DEFAULT 'Formula',
                calculation_formula text,
                percentage_rate decimal(5,2) DEFAULT NULL,
                fixed_amount decimal(12,2) DEFAULT NULL,
                is_taxable boolean NOT NULL DEFAULT TRUE,
                is_prorated boolean NOT NULL DEFAULT TRUE,
                minimum_service_months int DEFAULT 4,
                frequency enum('Annual','Biannual','Event-Based') NOT NULL DEFAULT 'Annual',
                is_active boolean NOT NULL DEFAULT TRUE,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY benefit_types_name_unique (name),
                UNIQUE KEY benefit_types_code_unique (code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ benefit_types table created');
        
        // 2. Benefit Cycles Table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS benefit_cycles (
                id int NOT NULL AUTO_INCREMENT,
                benefit_type_id int NOT NULL,
                cycle_year year NOT NULL,
                cycle_name varchar(100) NOT NULL,
                applicable_date date NOT NULL,
                payment_date date DEFAULT NULL,
                cutoff_date date DEFAULT NULL,
                status enum('Draft','Processing','Completed','Released','Cancelled') NOT NULL DEFAULT 'Draft',
                total_amount decimal(15,2) DEFAULT 0.00,
                employee_count int DEFAULT 0,
                created_by int NOT NULL,
                processed_by int DEFAULT NULL,
                processed_at timestamp NULL DEFAULT NULL,
                finalized_by int DEFAULT NULL,
                finalized_at timestamp NULL DEFAULT NULL,
                notes text,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_benefit_cycle (benefit_type_id,cycle_year,cycle_name),
                FOREIGN KEY (benefit_type_id) REFERENCES benefit_types(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (processed_by) REFERENCES users(id),
                FOREIGN KEY (finalized_by) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ benefit_cycles table created');
        
        // 3. Benefit Items Table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS benefit_items (
                id int NOT NULL AUTO_INCREMENT,
                benefit_cycle_id int NOT NULL,
                employee_id int NOT NULL,
                base_salary decimal(12,2) NOT NULL,
                service_months decimal(4,2) NOT NULL DEFAULT 12.00,
                calculated_amount decimal(12,2) NOT NULL DEFAULT 0.00,
                adjustment_amount decimal(12,2) DEFAULT 0.00,
                final_amount decimal(12,2) NOT NULL DEFAULT 0.00,
                tax_amount decimal(12,2) DEFAULT 0.00,
                net_amount decimal(12,2) NOT NULL DEFAULT 0.00,
                calculation_basis text,
                status enum('Draft','Calculated','Approved','Paid','Cancelled') NOT NULL DEFAULT 'Draft',
                is_eligible boolean NOT NULL DEFAULT TRUE,
                eligibility_notes text,
                processed_by int DEFAULT NULL,
                processed_at timestamp NULL DEFAULT NULL,
                paid_by int DEFAULT NULL,
                paid_at timestamp NULL DEFAULT NULL,
                payment_reference varchar(100) DEFAULT NULL,
                notes text,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_benefit_cycle_employee (benefit_cycle_id,employee_id),
                FOREIGN KEY (benefit_cycle_id) REFERENCES benefit_cycles(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (processed_by) REFERENCES users(id),
                FOREIGN KEY (paid_by) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ benefit_items table created');
        
        // 4. Benefit Adjustments Table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS benefit_adjustments (
                id int NOT NULL AUTO_INCREMENT,
                benefit_item_id int NOT NULL,
                adjustment_type enum('Increase','Decrease','Override') NOT NULL,
                amount decimal(12,2) NOT NULL,
                reason varchar(255) NOT NULL,
                description text,
                adjusted_by int NOT NULL,
                approved_by int DEFAULT NULL,
                approved_at timestamp NULL DEFAULT NULL,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (benefit_item_id) REFERENCES benefit_items(id) ON DELETE CASCADE,
                FOREIGN KEY (adjusted_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ benefit_adjustments table created');
        
        // Insert default benefit types
        await pool.execute(`
            INSERT IGNORE INTO benefit_types (name, code, description, category, calculation_type, calculation_formula, is_taxable, is_prorated, minimum_service_months, frequency) VALUES
            ('13th Month Pay (Mid-Year Bonus)', 'MID_YEAR', 'Mid-year bonus equivalent to 1/12 of annual basic salary', 'Annual', 'Formula', 'basic_salary / 12 * (service_months / 12)', TRUE, TRUE, 4, 'Annual'),
            ('14th Month Pay (Year-End Bonus)', 'YEAR_END', 'Year-end bonus equivalent to 1/12 of annual basic salary', 'Annual', 'Formula', 'basic_salary / 12 * (service_months / 12)', TRUE, TRUE, 4, 'Annual'),
            ('Performance-Based Bonus (PBB)', 'PBB', 'Performance-based bonus for eligible employees', 'Performance', 'Manual', NULL, TRUE, TRUE, 4, 'Annual'),
            ('Loyalty Award - 10 Years', 'LOYALTY_10', 'Loyalty award for 10 years of service', 'Loyalty', 'Fixed', NULL, FALSE, FALSE, 120, 'Event-Based'),
            ('Loyalty Award - 15 Years', 'LOYALTY_15', 'Loyalty award for 15 years of service', 'Loyalty', 'Fixed', NULL, FALSE, FALSE, 180, 'Event-Based'),
            ('Loyalty Award - 20 Years', 'LOYALTY_20', 'Loyalty award for 20 years of service', 'Loyalty', 'Fixed', NULL, FALSE, FALSE, 240, 'Event-Based'),
            ('Loyalty Award - 25 Years', 'LOYALTY_25', 'Loyalty award for 25 years of service', 'Loyalty', 'Fixed', NULL, FALSE, FALSE, 300, 'Event-Based'),
            ('Terminal Benefit Claims', 'TERMINAL', 'Terminal benefits for retiring or separating employees', 'Terminal', 'Manual', NULL, TRUE, FALSE, 0, 'Event-Based'),
            ('Monetization of Leave Credits', 'LEAVE_MONETIZE', 'Monetization of accumulated leave credits', 'Special', 'Formula', 'daily_rate * leave_days', TRUE, FALSE, 0, 'Event-Based'),
            ('Employee Compensation (EC)', 'EC', 'Employee compensation benefit', 'Special', 'Manual', NULL, TRUE, FALSE, 0, 'Annual'),
            ('GSIS Contributions/Claims', 'GSIS_CLAIM', 'GSIS-related contributions or claims', 'Special', 'Manual', NULL, FALSE, FALSE, 0, 'Event-Based')
        `);
        console.log('✅ Default benefit types inserted');
        
        // Update loyalty award fixed amounts
        await pool.execute(`
            UPDATE benefit_types SET fixed_amount = 10000.00 WHERE code = 'LOYALTY_10'
        `);
        await pool.execute(`
            UPDATE benefit_types SET fixed_amount = 15000.00 WHERE code = 'LOYALTY_15'
        `);
        await pool.execute(`
            UPDATE benefit_types SET fixed_amount = 20000.00 WHERE code = 'LOYALTY_20'
        `);
        await pool.execute(`
            UPDATE benefit_types SET fixed_amount = 25000.00 WHERE code = 'LOYALTY_25'
        `);
        console.log('✅ Loyalty award amounts updated');
        
        console.log('🎉 Compensation & Benefits database setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error setting up benefits database:', error.message);
        throw error;
    }
}

// Run setup if called directly
if (require.main === module) {
    createBenefitsTables()
        .then(() => {
            console.log('✅ Setup completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        });
}

module.exports = { createBenefitsTables };