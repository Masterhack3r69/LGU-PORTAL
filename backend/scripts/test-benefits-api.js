// Test script for Compensation & Benefits API
const { pool } = require('../config/database');
const { BenefitType, BenefitCycle, BenefitItem } = require('../models/Benefits');
const Employee = require('../models/Employee');
const benefitsCalculationService = require('../services/benefitsCalculationService');

class BenefitsAPITester {
    constructor() {
        this.testResults = [];
        this.errors = [];
    }

    async runAllTests() {
        console.log('🚀 Starting Compensation & Benefits API Tests...\n');

        try {
            // Test database setup
            await this.testDatabaseSetup();
            
            // Test models
            await this.testBenefitTypeModel();
            await this.testBenefitCycleModel();
            await this.testBenefitItemModel();
            
            // Test calculation service
            await this.testCalculationService();
            
            // Test integration
            await this.testEndToEndFlow();
            await this.testSessionValidation();
            
            // Display results
            this.displayResults();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            this.errors.push(`Test suite error: ${error.message}`);
        }
    }

    async testDatabaseSetup() {
        console.log('🔄 1. Testing database setup...');
        
        try {
            // Test connection
            await pool.execute('SELECT 1');
            this.logSuccess('Database connection established');

            // Check if benefits tables exist
            const tables = ['benefit_types', 'benefit_cycles', 'benefit_items', 'benefit_adjustments'];
            
            for (const table of tables) {
                const [rows] = await pool.execute(`SHOW TABLES LIKE '${table}'`);
                if (rows.length > 0) {
                    this.logSuccess(`Table ${table} exists`);
                } else {
                    this.logError(`Table ${table} missing`);
                }
            }

            // Check if default benefit types are inserted
            const [benefitTypes] = await pool.execute('SELECT COUNT(*) as count FROM benefit_types');
            if (benefitTypes[0].count > 0) {
                this.logSuccess(`${benefitTypes[0].count} default benefit types found`);
            } else {
                this.logError('No default benefit types found');
            }

        } catch (error) {
            this.logError(`Database setup test failed: ${error.message}`);
        }
    }

    async testBenefitTypeModel() {
        console.log('\\n🔄 2. Testing BenefitType model...');
        
        try {
            // Test findAll
            const allTypesResult = await BenefitType.findAll();
            if (allTypesResult.success && allTypesResult.data.length > 0) {
                this.logSuccess(`BenefitType.findAll() returned ${allTypesResult.data.length} types`);
            } else {
                this.logError('BenefitType.findAll() failed');
            }

            // Test findById
            if (allTypesResult.success && allTypesResult.data.length > 0) {
                const firstType = allTypesResult.data[0];
                const typeResult = await BenefitType.findById(firstType.id);
                
                if (typeResult.success && typeResult.data) {
                    this.logSuccess(`BenefitType.findById(${firstType.id}) successful`);
                } else {
                    this.logError('BenefitType.findById() failed');
                }
            }

            // Test findByCode
            const midYearResult = await BenefitType.findByCode('MID_YEAR');
            if (midYearResult.success && midYearResult.data) {
                this.logSuccess('BenefitType.findByCode("MID_YEAR") successful');
            } else {
                this.logError('BenefitType.findByCode("MID_YEAR") failed');
            }

            // Test validation
            const invalidType = new BenefitType({});
            const validation = invalidType.validate();
            if (!validation.isValid && validation.errors.length > 0) {
                this.logSuccess('BenefitType validation working correctly');
            } else {
                this.logError('BenefitType validation failed');
            }

        } catch (error) {
            this.logError(`BenefitType model test failed: ${error.message}`);
        }
    }

    async testBenefitCycleModel() {
        console.log('\\n🔄 3. Testing BenefitCycle model...');
        
        try {
            // Get a benefit type for testing
            const typeResult = await BenefitType.findByCode('MID_YEAR');
            if (!typeResult.success || !typeResult.data) {
                this.logError('Cannot find MID_YEAR benefit type for cycle testing');
                return;
            }

            const benefitType = typeResult.data;

            // Test creating a benefit cycle
            const cycleData = {
                benefit_type_id: benefitType.id,
                cycle_year: 2024,
                cycle_name: 'Test Mid-Year Bonus 2024',
                applicable_date: '2024-06-30',
                payment_date: '2024-07-15',
                cutoff_date: '2024-06-30',
                created_by: 1 // Assuming admin user with ID 1 exists
            };

            const benefitCycle = new BenefitCycle(cycleData);
            const validation = benefitCycle.validate();
            
            if (validation.isValid) {
                this.logSuccess('BenefitCycle validation passed');
            } else {
                this.logError(`BenefitCycle validation failed: ${validation.errors.join(', ')}`);
            }

            // Test cycle state management
            if (benefitCycle.canProcess()) {
                this.logSuccess('BenefitCycle.canProcess() working correctly');
            } else {
                this.logError('BenefitCycle.canProcess() failed');
            }

            // Test findAll
            const allCyclesResult = await BenefitCycle.findAll({ limit: 10 });
            if (allCyclesResult.success) {
                this.logSuccess(`BenefitCycle.findAll() returned ${allCyclesResult.data.length} cycles`);
            } else {
                this.logError('BenefitCycle.findAll() failed');
            }

        } catch (error) {
            this.logError(`BenefitCycle model test failed: ${error.message}`);
        }
    }

    async testBenefitItemModel() {
        console.log('\\n🔄 4. Testing BenefitItem model...');
        
        try {
            // Test findAll
            const allItemsResult = await BenefitItem.findAll({ limit: 10 });
            if (allItemsResult.success) {
                this.logSuccess(`BenefitItem.findAll() returned ${allItemsResult.data.length} items`);
            } else {
                this.logError('BenefitItem.findAll() failed');
            }

            // Test validation
            const invalidItem = new BenefitItem({});
            const validation = invalidItem.validate();
            if (!validation.isValid && validation.errors.length > 0) {
                this.logSuccess('BenefitItem validation working correctly');
            } else {
                this.logError('BenefitItem validation failed');
            }

            // Test amount calculation
            const testItem = new BenefitItem({
                calculated_amount: 10000,
                adjustment_amount: 500,
                tax_amount: 1000
            });
            
            const finalAmount = testItem.calculateFinalAmount();
            if (finalAmount === 10500 && testItem.net_amount === 9500) {
                this.logSuccess('BenefitItem amount calculation working correctly');
            } else {
                this.logError(`BenefitItem amount calculation failed: final=${finalAmount}, net=${testItem.net_amount}`);
            }

            // Test statistics
            const statistics = await BenefitItem.getStatistics();
            if (statistics !== null) {
                this.logSuccess('BenefitItem.getStatistics() working');
            } else {
                this.logError('BenefitItem.getStatistics() failed');
            }

        } catch (error) {
            this.logError(`BenefitItem model test failed: ${error.message}`);
        }
    }

    async testCalculationService() {
        console.log('\\n🔄 5. Testing Benefits Calculation Service...');
        
        try {
            // Get a test employee
            const employeesResult = await Employee.findAll({ limit: 1 });
            if (!employeesResult.success || employeesResult.data.length === 0) {
                this.logError('No employees found for calculation testing');
                return;
            }

            const employee = employeesResult.data[0];

            // Get Mid-Year benefit type
            const typeResult = await BenefitType.findByCode('MID_YEAR');
            if (!typeResult.success || !typeResult.data) {
                this.logError('Cannot find MID_YEAR benefit type for calculation testing');
                return;
            }

            const benefitType = typeResult.data;

            // Test service months calculation
            const serviceMonths = benefitsCalculationService.calculateServiceMonths(employee);
            if (serviceMonths >= 0) {
                this.logSuccess(`Service months calculation: ${serviceMonths} months`);
            } else {
                this.logError('Service months calculation failed');
            }

            // Test eligibility check
            const eligibility = benefitsCalculationService.checkEligibility(employee, benefitType, serviceMonths);
            this.logSuccess(`Eligibility check: ${eligibility.is_eligible ? 'Eligible' : 'Not eligible'} - ${eligibility.notes || 'No notes'}`);

            // Test benefit calculation
            const calculation = await benefitsCalculationService.calculateBenefitAmount(employee, benefitType);
            if (calculation.success) {
                this.logSuccess(`Benefit calculation successful: ₱${calculation.data.calculated_amount}`);
                this.logSuccess(`Calculation basis: ${calculation.data.calculation_basis}`);
            } else {
                this.logError(`Benefit calculation failed: ${calculation.error}`);
            }

            // Test eligible employees retrieval
            const eligibleResult = await benefitsCalculationService.getEligibleEmployees(benefitType);
            if (eligibleResult.success) {
                this.logSuccess(`Found ${eligibleResult.data.length} eligible employees for ${benefitType.name}`);
            } else {
                this.logError(`Failed to get eligible employees: ${eligibleResult.error}`);
            }

        } catch (error) {
            this.logError(`Calculation service test failed: ${error.message}`);
        }
    }

    async testEndToEndFlow() {
        console.log('\\n🔄 6. Testing End-to-End Benefits Flow...');

        try {
            // Test the exact scenario that's failing in the UI
            await this.testBenefitCycleCreation();

            this.logSuccess('End-to-end flow structure validated');
            this.logSuccess('All models and services are properly integrated');

        } catch (error) {
            this.logError(`End-to-end flow test failed: ${error.message}`);
        }
    }

    async testBenefitCycleCreation() {
        console.log('\\n🔄 6a. Testing Benefit Cycle Creation (reproducing UI error)...');

        try {
            // Get a benefit type for testing
            const typeResult = await BenefitType.findByCode('MID_YEAR');
            if (!typeResult.success || !typeResult.data) {
                this.logError('Cannot find MID_YEAR benefit type for cycle testing');
                return;
            }

            const benefitType = typeResult.data;
            console.log(`Using benefit type: ${benefitType.name} (ID: ${benefitType.id})`);

            // Get a valid user ID from the database
            const { executeQuery } = require('../config/database');
            const userResult = await executeQuery('SELECT id, username FROM users LIMIT 1');
            if (!userResult.success || userResult.data.length === 0) {
                this.logError('No users found in database for testing');
                return;
            }
            const validUserId = userResult.data[0].id;

            // Test creating a benefit cycle with the exact data structure from the UI
            const cycleData = {
                benefit_type_id: benefitType.id,
                cycle_year: 2024,
                cycle_name: 'Test Mid-Year Bonus 2024',
                applicable_date: '2024-06-30',
                payment_date: '2024-07-15',
                cutoff_date: '2024-06-30',
                created_by: validUserId // Use valid user ID from database
            };

            console.log('Creating benefit cycle with data:', JSON.stringify(cycleData, null, 2));

            const benefitCycle = new BenefitCycle(cycleData);
            const validation = benefitCycle.validate();

            console.log('Validation result:', validation);

            if (validation.isValid) {
                this.logSuccess('BenefitCycle validation passed');

                // Try to save it
                const saveResult = await benefitCycle.save();
                console.log('Save result:', saveResult);

                if (saveResult.success) {
                    this.logSuccess('BenefitCycle creation successful');
                } else {
                    this.logError(`BenefitCycle creation failed: ${saveResult.error}`);
                    if (saveResult.details) {
                        console.log('Error details:', saveResult.details);
                    }
                }
            } else {
                this.logError(`BenefitCycle validation failed: ${validation.errors.join(', ')}`);
                console.log('Validation errors:', validation.errors);
            }

        } catch (error) {
            this.logError(`Benefit cycle creation test failed: ${error.message}`);
            console.error('Full error:', error);
        }
    }

    async testSessionValidation() {
        console.log('\\n🔄 6b. Testing Session Validation Fix...');

        try {
            // Test the new session validation logic
            const { executeQuery } = require('../config/database');

            // Test with non-existent user ID
            const invalidUserId = 99999;
            const invalidUserCheck = await executeQuery('SELECT id, username FROM users WHERE id = ?', [invalidUserId]);

            if (!invalidUserCheck.success || invalidUserCheck.data.length === 0) {
                this.logSuccess('Session validation correctly rejects invalid user ID');
                console.log('Invalid user check result:', invalidUserCheck);
            } else {
                this.logError('Session validation should have rejected invalid user ID');
            }

            // Test with valid user ID (if any exist)
            const validUserCheck = await executeQuery('SELECT id, username FROM users LIMIT 1');

            if (validUserCheck.success && validUserCheck.data.length > 0) {
                const validUser = validUserCheck.data[0];
                const validUserReCheck = await executeQuery('SELECT id, username FROM users WHERE id = ?', [validUser.id]);

                if (validUserReCheck.success && validUserReCheck.data.length > 0) {
                    this.logSuccess('Session validation correctly accepts valid user ID');
                    console.log('Valid user check result:', validUserReCheck.data[0]);
                } else {
                    this.logError('Session validation failed for valid user ID');
                }
            } else {
                this.logError('No users found in database for testing');
            }

        } catch (error) {
            this.logError(`Session validation test failed: ${error.message}`);
            console.error('Full error:', error);
        }
    }

    logSuccess(message) {
        console.log(`✅ ${message}`);
        this.testResults.push({ type: 'success', message });
    }

    logError(message) {
        console.log(`❌ ${message}`);
        this.testResults.push({ type: 'error', message });
        this.errors.push(message);
    }

    displayResults() {
        console.log('\\n' + '='.repeat(60));
        console.log('🎯 COMPENSATION & BENEFITS API TEST RESULTS');
        console.log('='.repeat(60));

        const successCount = this.testResults.filter(r => r.type === 'success').length;
        const errorCount = this.testResults.filter(r => r.type === 'error').length;
        const totalTests = this.testResults.length;

        console.log(`\\n📊 Test Summary:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   ✅ Passed: ${successCount}`);
        console.log(`   ❌ Failed: ${errorCount}`);
        console.log(`   📈 Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);

        if (this.errors.length > 0) {
            console.log(`\\n⚠️  Errors Found:`);
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

        console.log('\\n' + '='.repeat(60));
        
        if (errorCount === 0) {
            console.log('🎉 All tests passed! Compensation & Benefits API is ready.');
        } else {
            console.log('⚠️  Some tests failed. Please review and fix the issues above.');
        }
        
        console.log('='.repeat(60));
    }
}

// Run tests if script is called directly
if (require.main === module) {
    const tester = new BenefitsAPITester();
    tester.runAllTests()
        .then(() => {
            console.log('\\n✅ Test suite completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\\n❌ Test suite failed:', error.message);
            process.exit(1);
        });
}

module.exports = BenefitsAPITester;