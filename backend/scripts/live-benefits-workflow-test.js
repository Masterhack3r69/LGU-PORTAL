// Live Compensation & Benefits Workflow Test Script
// Tests the complete workflow against the live API server at 10.0.0.73
const axios = require('axios');

class LiveBenefitsWorkflowTester {
    constructor() {
        this.baseURL = 'http://10.0.0.73:3000/api';
        this.sessionCookie = null;
        this.testData = {
            benefitCycle: null,
            benefitItems: [],
            employees: []
        };
        this.credentials = {
            username: 'deckson',
            password: 'admin123'
        };
        
        // Configure axios to handle cookies
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Add response interceptor for cookie handling
        this.client.interceptors.response.use(
            response => response,
            error => {
                console.error(`API Error: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
                return Promise.reject(error);
            }
        );
    }

    async runCompleteWorkflowTest() {
        console.log('🚀 Starting Live Compensation & Benefits Workflow Test');
        console.log(`🌐 Testing against server: ${this.baseURL}`);
        console.log(`👤 User: ${this.credentials.username}`);
        console.log('=' * 80);

        try {
            // Step 1: Authentication
            await this.testAuthentication();
            
            // Step 2: Verify system setup
            await this.verifySystemSetup();
            
            // Step 3: Test complete workflow
            await this.testCompleteWorkflow();
            
            // Step 4: Test employee access
            await this.testEmployeeAccess();
            
            // Step 5: Cleanup test data
            await this.cleanupTestData();
            
            console.log('\n🎉 All workflow tests completed successfully!');
            console.log('✅ The Compensation & Benefits system is fully functional');
            
        } catch (error) {
            console.error('\n❌ Workflow test failed:', error.message);
            if (error.response?.data) {
                console.error('📋 Error details:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }

    async testAuthentication() {
        console.log('\n🔐 Step 1: Testing Authentication...');
        
        try {
            const response = await this.client.post('/auth/login', this.credentials);
            
            if (response.data.success) {
                // Extract session cookie from response headers
                const setCookieHeader = response.headers['set-cookie'];
                if (setCookieHeader) {
                    this.sessionCookie = setCookieHeader[0].split(';')[0];
                    this.client.defaults.headers.Cookie = this.sessionCookie;
                }
                
                console.log('✅ Authentication successful');
                console.log(`👤 Logged in as: ${response.data.data.username} (${response.data.data.role})`);
                
                if (response.data.data.role !== 'admin') {
                    throw new Error('Admin privileges required for this test');
                }
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            console.error('❌ Authentication failed');
            throw error;
        }
    }

    async verifySystemSetup() {
        console.log('\n🔧 Step 2: Verifying System Setup...');
        
        try {
            // Check if benefits routes are available
            const healthResponse = await this.client.get('/../../health');
            console.log('✅ Server health check passed');
            
            // Check benefit types
            const typesResponse = await this.client.get('/benefits/types');
            if (typesResponse.data.success && typesResponse.data.data.benefit_types.length > 0) {
                console.log(`✅ Found ${typesResponse.data.data.benefit_types.length} benefit types`);
                
                // List available benefit types
                typesResponse.data.data.benefit_types.forEach(type => {
                    console.log(`   - ${type.name} (${type.code}) - ${type.category}`);
                });
            } else {
                throw new Error('No benefit types found');
            }
            
            // Check employees
            const employeesResponse = await this.client.get('/employees?limit=5');
            if (employeesResponse.data.success && employeesResponse.data.data.employees.length > 0) {
                console.log(`✅ Found ${employeesResponse.data.data.pagination.total} employees in system`);
                this.testData.employees = employeesResponse.data.data.employees;
            } else {
                throw new Error('No employees found for testing');
            }
            
        } catch (error) {
            console.error('❌ System setup verification failed');
            throw error;
        }
    }

    async testCompleteWorkflow() {
        console.log('\n📋 Step 3: Testing Complete Compensation & Benefits Workflow...');
        
        // 3.1: Create Benefit Cycle
        await this.createBenefitCycle();
        
        // 3.2: Calculate Benefits for Employees
        await this.calculateBenefits();
        
        // 3.3: Review and Make Adjustments
        await this.reviewAndAdjustBenefits();
        
        // 3.4: Approve Benefits
        await this.approveBenefits();
        
        // 3.5: Mark as Paid
        await this.markBenefitsAsPaid();
        
        // 3.6: Generate Benefit Slips
        await this.generateBenefitSlips();
        
        // 3.7: Finalize Benefit Cycle
        await this.finalizeBenefitCycle();
    }

    async createBenefitCycle() {
        console.log('\n   🔄 3.1: Creating Benefit Cycle...');
        
        try {
            // Get Mid-Year benefit type
            const typesResponse = await this.client.get('/benefits/types');
            const midYearType = typesResponse.data.data.benefit_types.find(t => t.code === 'MID_YEAR');
            
            if (!midYearType) {
                throw new Error('Mid-Year benefit type not found');
            }
            
            const cycleData = {
                benefit_type_id: midYearType.id,
                cycle_year: 2024,
                cycle_name: 'Test 2024 Mid-Year Bonus - Live Test',
                applicable_date: '2024-06-30',
                payment_date: '2024-07-15',
                cutoff_date: '2024-06-30',
                notes: 'Created by live workflow test script'
            };
            
            const response = await this.client.post('/benefits/cycles', cycleData);
            
            if (response.data.success) {
                this.testData.benefitCycle = response.data.data;
                console.log(`✅ Benefit cycle created successfully`);
                console.log(`   ID: ${this.testData.benefitCycle.id}`);
                console.log(`   Name: ${this.testData.benefitCycle.cycle_name}`);
            } else {
                throw new Error('Failed to create benefit cycle');
            }
        } catch (error) {
            console.error('❌ Failed to create benefit cycle');
            throw error;
        }
    }

    async calculateBenefits() {
        console.log('\n   🧮 3.2: Calculating Benefits for Employees...');
        
        try {
            // Calculate benefits for all eligible employees
            const response = await this.client.post(
                `/benefits/cycles/${this.testData.benefitCycle.id}/calculate`
            );
            
            if (response.data.success) {
                this.testData.benefitItems = response.data.data.benefit_items;
                const summary = response.data.data.summary;
                
                console.log(`✅ Benefits calculated successfully`);
                console.log(`   Total Employees: ${summary.total_employees}`);
                console.log(`   Eligible: ${summary.eligible_employees}`);
                console.log(`   Ineligible: ${summary.ineligible_employees}`);
                console.log(`   Total Amount: ₱${summary.total_amount.toLocaleString()}`);
                console.log(`   Average Benefit: ₱${summary.average_benefit.toLocaleString()}`);
                
                // Show first few benefit items
                console.log(`\n   📊 Sample Benefit Items:`);
                this.testData.benefitItems.slice(0, 3).forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.employee_name}: ₱${item.calculated_amount.toLocaleString()}`);
                });
            } else {
                throw new Error('Failed to calculate benefits');
            }
        } catch (error) {
            console.error('❌ Failed to calculate benefits');
            throw error;
        }
    }

    async reviewAndAdjustBenefits() {
        console.log('\n   ✏️  3.3: Reviewing and Making Adjustments...');
        
        try {
            if (this.testData.benefitItems.length === 0) {
                console.log('⚠️  No benefit items to adjust');
                return;
            }
            
            // Add adjustment to first benefit item
            const firstItem = this.testData.benefitItems[0];
            const adjustmentData = {
                adjustment_type: 'Increase',
                amount: 500.00,
                reason: 'Live test adjustment',
                description: 'Additional amount added during live workflow test'
            };
            
            const response = await this.client.post(
                `/benefits/items/${firstItem.id}/adjustment`,
                adjustmentData
            );
            
            if (response.data.success) {
                console.log(`✅ Adjustment added successfully`);
                console.log(`   Employee: ${firstItem.employee_name}`);
                console.log(`   Original Amount: ₱${firstItem.calculated_amount.toLocaleString()}`);
                console.log(`   Adjustment: +₱${adjustmentData.amount.toLocaleString()}`);
                console.log(`   New Final Amount: ₱${response.data.data.final_amount.toLocaleString()}`);
                
                // Update our test data
                this.testData.benefitItems[0] = response.data.data;
            } else {
                throw new Error('Failed to add adjustment');
            }
        } catch (error) {
            console.error('❌ Failed to add adjustment');
            throw error;
        }
    }

    async approveBenefits() {
        console.log('\n   ✅ 3.4: Approving Benefits...');
        
        try {
            if (this.testData.benefitItems.length === 0) {
                console.log('⚠️  No benefit items to approve');
                return;
            }
            
            // Bulk approve all benefit items
            const itemIds = this.testData.benefitItems.map(item => item.id);
            
            const response = await this.client.post('/benefits/items/bulk-approve', {
                item_ids: itemIds
            });
            
            if (response.data.success) {
                console.log(`✅ Bulk approval successful`);
                console.log(`   Approved Items: ${response.data.data.affected_rows}`);
            } else {
                throw new Error('Failed to approve benefits');
            }
        } catch (error) {
            console.error('❌ Failed to approve benefits');
            throw error;
        }
    }

    async markBenefitsAsPaid() {
        console.log('\n   💰 3.5: Marking Benefits as Paid...');
        
        try {
            if (this.testData.benefitItems.length === 0) {
                console.log('⚠️  No benefit items to mark as paid');
                return;
            }
            
            // Bulk mark as paid
            const itemIds = this.testData.benefitItems.map(item => item.id);
            const paymentReference = `LIVE_TEST_${Date.now()}`;
            
            const response = await this.client.post('/benefits/items/bulk-mark-paid', {
                item_ids: itemIds,
                payment_reference: paymentReference
            });
            
            if (response.data.success) {
                console.log(`✅ Bulk payment marking successful`);
                console.log(`   Paid Items: ${response.data.data.affected_rows}`);
                console.log(`   Payment Reference: ${paymentReference}`);
            } else {
                throw new Error('Failed to mark benefits as paid');
            }
        } catch (error) {
            console.error('❌ Failed to mark benefits as paid');
            throw error;
        }
    }

    async generateBenefitSlips() {
        console.log('\n   📄 3.6: Generating Benefit Slips...');
        
        try {
            if (this.testData.benefitItems.length === 0) {
                console.log('⚠️  No benefit items for slip generation');
                return;
            }
            
            // Generate slip for first benefit item
            const firstItem = this.testData.benefitItems[0];
            
            const response = await this.client.post(
                `/benefits/items/${firstItem.id}/generate-slip`,
                {},
                { responseType: 'arraybuffer' }
            );
            
            if (response.status === 200 && response.data.byteLength > 0) {
                console.log(`✅ Benefit slip generated successfully`);
                console.log(`   Employee: ${firstItem.employee_name}`);
                console.log(`   File Size: ${response.data.byteLength} bytes`);
                console.log(`   Content Type: ${response.headers['content-type']}`);
                
                // Optionally save the PDF for verification
                const filename = response.headers['content-disposition']?.match(/filename="(.+)"/)?.[1] || 'benefit-slip.pdf';
                console.log(`   Filename: ${filename}`);
            } else {
                throw new Error('Failed to generate benefit slip');
            }
        } catch (error) {
            console.error('❌ Failed to generate benefit slip');
            throw error;
        }
    }

    async finalizeBenefitCycle() {
        console.log('\n   🏁 3.7: Finalizing Benefit Cycle...');
        
        try {
            // Process the cycle
            let response = await this.client.post(
                `/benefits/cycles/${this.testData.benefitCycle.id}/process`
            );
            
            if (response.data.success) {
                console.log(`✅ Benefit cycle processed (status: ${response.data.data.status})`);
            }
            
            // Finalize the cycle
            response = await this.client.post(
                `/benefits/cycles/${this.testData.benefitCycle.id}/finalize`
            );
            
            if (response.data.success) {
                console.log(`✅ Benefit cycle finalized (status: ${response.data.data.status})`);
            }
            
            // Release the cycle
            response = await this.client.post(
                `/benefits/cycles/${this.testData.benefitCycle.id}/release`
            );
            
            if (response.data.success) {
                console.log(`✅ Benefit cycle released (status: ${response.data.data.status})`);
                console.log(`   Total Amount: ₱${response.data.data.total_amount.toLocaleString()}`);
                console.log(`   Employee Count: ${response.data.data.employee_count}`);
            }
        } catch (error) {
            console.error('❌ Failed to finalize benefit cycle');
            throw error;
        }
    }

    async testEmployeeAccess() {
        console.log('\n👤 Step 4: Testing Employee Access...');
        
        try {
            if (this.testData.employees.length === 0) {
                console.log('⚠️  No employees available for access testing');
                return;
            }
            
            const employee = this.testData.employees[0];
            
            // Test employee benefit items access
            const response = await this.client.get(`/benefits/employees/${employee.id}/items`);
            
            if (response.data.success) {
                const employeeBenefits = response.data.data.benefit_items;
                console.log(`✅ Employee access test successful`);
                console.log(`   Employee: ${employee.first_name} ${employee.last_name}`);
                console.log(`   Benefits Found: ${employeeBenefits.length}`);
                
                if (employeeBenefits.length > 0) {
                    employeeBenefits.forEach((benefit, index) => {
                        console.log(`   ${index + 1}. ${benefit.benefit_type_name} (${benefit.cycle_year}): ₱${benefit.final_amount.toLocaleString()}`);
                    });
                }
            } else {
                throw new Error('Failed to access employee benefits');
            }
        } catch (error) {
            console.error('❌ Employee access test failed');
            throw error;
        }
    }

    async cleanupTestData() {
        console.log('\n🧹 Step 5: Cleaning Up Test Data...');
        
        try {
            if (this.testData.benefitCycle) {
                // Note: We'll keep the test data for demonstration purposes
                // In a real test, you might want to clean up
                console.log(`✅ Test benefit cycle preserved for review (ID: ${this.testData.benefitCycle.id})`);
                console.log(`   Cycle Name: ${this.testData.benefitCycle.cycle_name}`);
                console.log(`   Status: Released`);
                console.log(`   Note: This test cycle can be manually deleted from admin interface if needed`);
            }
        } catch (error) {
            console.error('⚠️  Cleanup warning (not critical):', error.message);
        }
    }

    async getStatistics() {
        console.log('\n📊 Bonus: Getting Benefits Statistics...');
        
        try {
            const response = await this.client.get('/benefits/statistics');
            
            if (response.data.success) {
                const stats = response.data.data;
                console.log(`✅ Statistics retrieved successfully`);
                console.log(`   Total Items: ${stats.total_items}`);
                console.log(`   Eligible: ${stats.eligible_count}`);
                console.log(`   Paid: ${stats.paid_count}`);
                console.log(`   Total Amount: ₱${stats.total_final_amount.toLocaleString()}`);
                console.log(`   Average Benefit: ₱${stats.average_benefit_amount.toLocaleString()}`);
            }
        } catch (error) {
            console.error('⚠️  Statistics retrieval failed (not critical):', error.message);
        }
    }

    async logout() {
        try {
            await this.client.post('/auth/logout');
            console.log('✅ Logged out successfully');
        } catch (error) {
            console.error('⚠️  Logout warning:', error.message);
        }
    }
}

// Run the test if script is called directly
if (require.main === module) {
    const tester = new LiveBenefitsWorkflowTester();
    
    tester.runCompleteWorkflowTest()
        .then(async () => {
            await tester.getStatistics();
            await tester.logout();
            console.log('\n🎯 Live workflow test completed successfully!');
            console.log('=' * 80);
            process.exit(0);
        })
        .catch(async (error) => {
            console.error('\n💥 Live workflow test failed:', error.message);
            await tester.logout();
            console.log('=' * 80);
            process.exit(1);
        });
}

module.exports = LiveBenefitsWorkflowTester;