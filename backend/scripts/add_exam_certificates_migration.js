// Migration script to add exam_certificates table
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'ems_db',
            port: parseInt(process.env.DB_PORT) || 3306
        });

        console.log('✅ Connected to database');

        // Check if table already exists
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'exam_certificates'"
        );

        if (tables.length > 0) {
            console.log('ℹ️  Table exam_certificates already exists');
            return;
        }

        // Create exam_certificates table
        await connection.query(`
            CREATE TABLE exam_certificates (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Table exam_certificates created successfully');

        // Insert sample data (optional)
        console.log('ℹ️  Migration completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('✅ Database connection closed');
        }
    }
}

// Run migration
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log('✅ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = runMigration;
