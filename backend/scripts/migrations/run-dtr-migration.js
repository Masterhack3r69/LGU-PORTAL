/**
 * DTR Module Migration Script
 *
 * This script applies the DTR database migration to create the necessary
 * tables and views for the DTR (Daily Time Record) module.
 *
 * Usage:
 *   node backend/scripts/migrations/run-dtr-migration.js
 *
 * Options:
 *   --rollback : Rollback the migration (remove DTR tables)
 */

const fs = require("fs");
const path = require("path");
const { pool } = require("../../config/database");

// Parse command line arguments
const args = process.argv.slice(2);
const isRollback = args.includes("--rollback");

async function runMigration() {
  let connection;

  try {
    console.log("========================================");
    console.log("DTR Module Database Migration");
    console.log("========================================\n");

    // Get connection from pool
    connection = await pool.getConnection();
    console.log("✅ Database connection established\n");

    // Determine which migration file to use
    const migrationFile = isRollback
      ? "rollback_dtr_tables.sql"
      : "add_dtr_tables.sql";

    const migrationPath = path.join(__dirname, migrationFile);

    // Check if migration file exists
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }

    console.log(`📄 Reading migration file: ${migrationFile}\n`);

    // Read migration SQL file
    const sql = fs.readFileSync(migrationPath, "utf8");

    // Split SQL into individual statements (handle multi-statement execution)
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    if (isRollback) {
      console.log(
        "⚠️  ROLLBACK MODE: This will remove all DTR tables and views!\n"
      );
    } else {
      console.log("🚀 MIGRATION MODE: Creating DTR tables and views\n");
    }

    // Execute each statement
    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Extract statement type for logging
      const statementType = statement.split(/\s+/)[0].toUpperCase();

      try {
        console.log(
          `   Executing statement ${i + 1}/${
            statements.length
          }: ${statementType}...`
        );
        await connection.query(statement);
        successCount++;
      } catch (error) {
        // Some errors are acceptable (e.g., DROP IF EXISTS when table doesn't exist)
        if (
          error.code === "ER_BAD_TABLE_ERROR" ||
          error.code === "ER_NO_SUCH_TABLE"
        ) {
          console.log(`   ⚠️  Warning: ${error.message} (continuing...)`);
          successCount++;
        } else {
          throw error;
        }
      }
    }

    console.log(
      `\n✅ Successfully executed ${successCount}/${statements.length} statements\n`
    );

    // Verify migration
    if (!isRollback) {
      console.log("🔍 Verifying migration...\n");

      // Check if tables exist
      const [tables] = await connection.query("SHOW TABLES LIKE 'dtr_%'");
      console.log(`   ✅ Found ${tables.length} DTR tables`);

      // Check if view exists
      const [views] = await connection.query(
        "SHOW FULL TABLES WHERE Table_type = 'VIEW' AND Tables_in_employee_management_system LIKE 'v_dtr%'"
      );
      console.log(`   ✅ Found ${views.length} DTR view(s)`);

      // Display table structures
      console.log("\n📋 Table Structures:\n");

      const [batchesDesc] = await connection.query(
        "DESCRIBE dtr_import_batches"
      );
      console.log("   dtr_import_batches:");
      console.log(`      - ${batchesDesc.length} columns`);

      const [recordsDesc] = await connection.query("DESCRIBE dtr_records");
      console.log("   dtr_records:");
      console.log(`      - ${recordsDesc.length} columns`);

      // Check indexes
      const [batchesIndexes] = await connection.query(
        "SHOW INDEX FROM dtr_import_batches"
      );
      const [recordsIndexes] = await connection.query(
        "SHOW INDEX FROM dtr_records"
      );

      console.log("\n📊 Indexes Created:\n");
      console.log(`   dtr_import_batches: ${batchesIndexes.length} indexes`);
      console.log(`   dtr_records: ${recordsIndexes.length} indexes`);
    } else {
      console.log("🔍 Verifying rollback...\n");

      // Check if tables were removed
      const [tables] = await connection.query("SHOW TABLES LIKE 'dtr_%'");
      if (tables.length === 0) {
        console.log("   ✅ All DTR tables successfully removed");
      } else {
        console.log(
          `   ⚠️  Warning: ${tables.length} DTR table(s) still exist`
        );
      }
    }

    console.log("\n========================================");
    console.log(
      isRollback
        ? "✅ Rollback completed successfully!"
        : "✅ Migration completed successfully!"
    );
    console.log("========================================\n");
  } catch (error) {
    console.error("\n❌ Migration failed!\n");
    console.error("Error:", error.message);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log("🔌 Database connection released\n");
    }

    // Close pool
    await pool.end();
    process.exit(0);
  }
}

// Run migration
runMigration().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
