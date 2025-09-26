// scripts/fix-views.js - Fix problematic database views
const { executeQuery } = require('../config/database');

async function fixDatabaseViews() {
    try {
        console.log('🔍 Checking for problematic views...');
        
        // Check if the problematic view exists
        const viewCheck = await executeQuery(`
            SELECT TABLE_NAME, VIEW_DEFINITION 
            FROM INFORMATION_SCHEMA.VIEWS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'v_employee_benefit_details'
        `, [process.env.DB_NAME || 'employee_management_system']);
        
        if (viewCheck.success && viewCheck.data.length > 0) {
            console.log('📋 Found problematic view: v_employee_benefit_details');
            console.log('🗑️ Dropping problematic view...');
            
            // Drop the problematic view
            const dropResult = await executeQuery('DROP VIEW IF EXISTS v_employee_benefit_details');
            
            if (dropResult.success) {
                console.log('✅ Successfully dropped problematic view');
            } else {
                console.log('❌ Failed to drop view:', dropResult.error);
            }
        } else {
            console.log('✅ No problematic views found');
        }
        
        // List all views to check for other issues
        console.log('📋 Listing all views in database...');
        const allViews = await executeQuery(`
            SELECT TABLE_NAME, VIEW_DEFINITION 
            FROM INFORMATION_SCHEMA.VIEWS 
            WHERE TABLE_SCHEMA = ?
        `, [process.env.DB_NAME || 'employee_management_system']);
        
        if (allViews.success) {
            if (allViews.data.length === 0) {
                console.log('📋 No views found in database');
            } else {
                console.log(`📋 Found ${allViews.data.length} views:`);
                allViews.data.forEach(view => {
                    console.log(`  - ${view.TABLE_NAME}`);
                });
            }
        }
        
        console.log('✅ View check completed');
        
    } catch (error) {
        console.error('❌ Error fixing database views:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    fixDatabaseViews()
        .then(() => {
            console.log('🎉 Database view fix completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Database view fix failed:', error);
            process.exit(1);
        });
}

module.exports = { fixDatabaseViews };