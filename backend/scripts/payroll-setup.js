// Simplified payroll schema setup
const { pool } = require('../config/database');

async function createPayrollTables() {
    try {
        console.log('🔄 Setting up payroll database tables...');
        
        // Test connection
        await pool.execute('SELECT 1');
        console.log('✅ Database connected');
        
        // 1. Payroll Periods
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS payroll_periods (
                id int NOT NULL AUTO_INCREMENT,
                year year NOT NULL,
                month tinyint NOT NULL,
                period_number tinyint NOT NULL,
                start_date date NOT NULL,
                end_date date NOT NULL,
                pay_date date NOT NULL,
                status enum('Draft','Processing','Completed','Paid') NOT NULL DEFAULT 'Draft',
                created_by int NOT NULL,
                finalized_by int DEFAULT NULL,
                finalized_at timestamp NULL DEFAULT NULL,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_period (year,month,period_number),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (finalized_by) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ payroll_periods table created');
        
        // 2. Allowance Types
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS allowance_types (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(100) NOT NULL,
                code varchar(20) NOT NULL,
                description text,
                default_amount decimal(12,2) DEFAULT NULL,
                calculation_type enum('Fixed','Percentage','Formula') NOT NULL DEFAULT 'Fixed',
                percentage_base enum('BasicPay','MonthlySalary','GrossPay') DEFAULT NULL,
                is_taxable boolean NOT NULL DEFAULT FALSE,
                frequency enum('Monthly','Annual','Conditional') NOT NULL DEFAULT 'Monthly',
                is_active boolean NOT NULL DEFAULT TRUE,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY name (name),
                UNIQUE KEY code (code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ allowance_types table created');
        
        // 3. Deduction Types
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS deduction_types (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(100) NOT NULL,
                code varchar(20) NOT NULL,
                description text,
                default_amount decimal(12,2) DEFAULT NULL,
                calculation_type enum('Fixed','Percentage','Formula') NOT NULL DEFAULT 'Fixed',
                percentage_base enum('BasicPay','MonthlySalary','GrossPay') DEFAULT NULL,
                is_mandatory boolean NOT NULL DEFAULT FALSE,
                frequency enum('Monthly','Annual','Conditional') NOT NULL DEFAULT 'Monthly',
                is_active boolean NOT NULL DEFAULT TRUE,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY name (name),
                UNIQUE KEY code (code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ deduction_types table created');
        
        // 4. Employee Allowance Overrides
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS employee_allowance_overrides (
                id int NOT NULL AUTO_INCREMENT,
                employee_id int NOT NULL,
                allowance_type_id int NOT NULL,
                override_amount decimal(12,2) NOT NULL,
                effective_date date NOT NULL,
                end_date date DEFAULT NULL,
                is_active boolean NOT NULL DEFAULT TRUE,
                created_by int NOT NULL,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_employee_allowance_effective (employee_id,allowance_type_id,effective_date),
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (allowance_type_id) REFERENCES allowance_types(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ employee_allowance_overrides table created');
        
        // 5. Employee Deduction Overrides
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS employee_deduction_overrides (
                id int NOT NULL AUTO_INCREMENT,
                employee_id int NOT NULL,
                deduction_type_id int NOT NULL,
                override_amount decimal(12,2) NOT NULL,
                effective_date date NOT NULL,
                end_date date DEFAULT NULL,
                is_active boolean NOT NULL DEFAULT TRUE,
                created_by int NOT NULL,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_employee_deduction_effective (employee_id,deduction_type_id,effective_date),
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (deduction_type_id) REFERENCES deduction_types(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ employee_deduction_overrides table created');
        
        // 6. Payroll Items
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS payroll_items (
                id int NOT NULL AUTO_INCREMENT,
                payroll_period_id int NOT NULL,
                employee_id int NOT NULL,
                working_days decimal(4,2) NOT NULL DEFAULT 22.00,
                daily_rate decimal(10,2) NOT NULL,
                basic_pay decimal(12,2) NOT NULL,
                total_allowances decimal(12,2) NOT NULL DEFAULT 0.00,
                total_deductions decimal(12,2) NOT NULL DEFAULT 0.00,
                gross_pay decimal(12,2) NOT NULL DEFAULT 0.00,
                net_pay decimal(12,2) NOT NULL,
                status enum('Draft','Processed','Finalized','Paid') NOT NULL DEFAULT 'Draft',
                processed_by int DEFAULT NULL,
                processed_at timestamp NULL DEFAULT NULL,
                paid_by int DEFAULT NULL,
                paid_at timestamp NULL DEFAULT NULL,
                notes text,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_payroll_period_employee (payroll_period_id,employee_id),
                FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                FOREIGN KEY (processed_by) REFERENCES users(id),
                FOREIGN KEY (paid_by) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ payroll_items table created');
        
        // 7. Payroll Item Lines
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS payroll_item_lines (
                id int NOT NULL AUTO_INCREMENT,
                payroll_item_id int NOT NULL,
                line_type enum('Allowance','Deduction','Adjustment') NOT NULL,
                type_id int DEFAULT NULL,
                description varchar(255) NOT NULL,
                amount decimal(12,2) NOT NULL,
                is_override boolean NOT NULL DEFAULT FALSE,
                calculation_basis varchar(100) DEFAULT NULL,
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (payroll_item_id) REFERENCES payroll_items(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ payroll_item_lines table created');
        
        // Insert default allowance types
        await pool.execute(`
            INSERT IGNORE INTO allowance_types (name, code, description, default_amount, calculation_type, is_taxable, frequency) VALUES
            ('Transportation Allowance', 'TRANS', 'Monthly transportation allowance', 2000.00, 'Fixed', FALSE, 'Monthly'),
            ('Rice Allowance', 'RICE', 'Monthly rice subsidy allowance', 1500.00, 'Fixed', FALSE, 'Monthly'),
            ('Communication Allowance', 'COMM', 'Monthly communication allowance', 1000.00, 'Fixed', FALSE, 'Monthly'),
            ('Hazard Pay', 'HAZARD', 'Additional compensation for hazardous work', 0.00, 'Percentage', TRUE, 'Monthly'),
            ('Overtime Pay', 'OT', 'Overtime compensation', 0.00, 'Formula', TRUE, 'Monthly')
        `);
        console.log('✅ Default allowance types inserted');
        
        // Insert default deduction types
        await pool.execute(`
            INSERT IGNORE INTO deduction_types (name, code, description, default_amount, calculation_type, is_mandatory, frequency) VALUES
            ('Income Tax', 'ITAX', 'Monthly income tax withholding', 0.00, 'Formula', TRUE, 'Monthly'),
            ('GSIS Premium', 'GSIS', 'Government Service Insurance System premium', 0.00, 'Percentage', TRUE, 'Monthly'),
            ('Pag-IBIG', 'PAGIBIG', 'Pag-IBIG Fund contribution', 100.00, 'Fixed', TRUE, 'Monthly'),
            ('PhilHealth', 'PHILHEALTH', 'Philippine Health Insurance premium', 0.00, 'Percentage', TRUE, 'Monthly'),
            ('Loan Payment', 'LOAN', 'Various loan payments', 0.00, 'Fixed', FALSE, 'Monthly')
        `);
        console.log('✅ Default deduction types inserted');
        
        console.log('🎉 Payroll database setup completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error setting up payroll database:', error.message);
        process.exit(1);
    }
}

createPayrollTables();