// Mock test for PayrollCalculationEngine
// Tests the calculation engine with mock data (no database required)

const PayrollCalculationEngine = require('../PayrollCalculationEngine');

describe('PayrollCalculationEngine - Mock Tests', () => {
    let engine;

    beforeEach(() => {
        engine = new PayrollCalculationEngine();
    });

    describe('Basic Salary Calculations', () => {
        test('should calculate full month salary correctly', async () => {
            const mockEmployee = {
                id: 1,
                first_name: 'Juan',
                last_name: 'Dela Cruz',
                employee_number: 'EMP-001',
                current_monthly_salary: 30000,
                current_daily_rate: 1363.64,
                department: 'ADMIN'
            };

            const mockPeriod = {
                id: 1,
                year: 2024,
                month: 10,
                period_number: 1,
                start_date: '2024-10-01',
                end_date: '2024-10-15',
                pay_date: '2024-10-20',
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { daysPresent: 22 }
            );

            console.log('\n=== Test 1: Full Month Salary ===');
            console.log('Employee:', mockEmployee.first_name, mockEmployee.last_name);
            console.log('Monthly Salary: ₱' + mockEmployee.current_monthly_salary.toLocaleString());
            console.log('Working Days: 22');
            console.log('Days Present: 22');
            console.log('\nResults:');
            console.log('Basic Pay: ₱' + result.data.basic_pay.toLocaleString());
            console.log('Total Allowances: ₱' + result.data.total_allowances.toLocaleString());
            console.log('Gross Pay: ₱' + result.data.gross_pay.toLocaleString());
            console.log('Total Deductions: ₱' + result.data.total_deductions.toLocaleString());
            console.log('Net Pay: ₱' + result.data.net_pay.toLocaleString());

            expect(result.success).toBe(true);
            expect(result.data.basic_pay).toBe(30000);
            expect(result.data.gross_pay).toBeGreaterThan(30000);
            expect(result.data.net_pay).toBeGreaterThan(0);
            expect(result.data.net_pay).toBeLessThan(result.data.gross_pay);
        });

        test('should calculate prorated salary for partial attendance', async () => {
            const mockEmployee = {
                id: 2,
                first_name: 'Maria',
                last_name: 'Santos',
                employee_number: 'EMP-002',
                current_monthly_salary: 25000,
                current_daily_rate: 1136.36,
                department: 'FINANCE'
            };

            const mockPeriod = {
                id: 2,
                year: 2024,
                month: 10,
                period_number: 2,
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { daysPresent: 15 }
            );

            console.log('\n=== Test 2: Prorated Salary (15/22 days) ===');
            console.log('Employee:', mockEmployee.first_name, mockEmployee.last_name);
            console.log('Monthly Salary: ₱' + mockEmployee.current_monthly_salary.toLocaleString());
            console.log('Working Days: 22');
            console.log('Days Present: 15');
            console.log('\nResults:');
            console.log('Basic Pay: ₱' + result.data.basic_pay.toLocaleString());
            console.log('Total Allowances: ₱' + result.data.total_allowances.toLocaleString());
            console.log('Gross Pay: ₱' + result.data.gross_pay.toLocaleString());
            console.log('Net Pay: ₱' + result.data.net_pay.toLocaleString());

            expect(result.success).toBe(true);
            expect(result.data.basic_pay).toBeLessThan(25000);
            expect(result.data.basic_pay).toBeCloseTo(17045.45, 1);
        });

        test('should apply LWOP deduction correctly', async () => {
            const mockEmployee = {
                id: 3,
                first_name: 'Pedro',
                last_name: 'Reyes',
                employee_number: 'EMP-003',
                current_monthly_salary: 28000,
                department: 'HR'
            };

            const mockPeriod = {
                id: 3,
                year: 2024,
                month: 10,
                period_number: 1,
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { 
                    daysPresent: 20,
                    daysLWOP: 2
                }
            );

            console.log('\n=== Test 3: LWOP Deduction (2 days) ===');
            console.log('Employee:', mockEmployee.first_name, mockEmployee.last_name);
            console.log('Monthly Salary: ₱' + mockEmployee.current_monthly_salary.toLocaleString());
            console.log('Days Present: 20');
            console.log('LWOP Days: 2');
            console.log('\nResults:');
            console.log('Basic Pay (after LWOP): ₱' + result.data.basic_pay.toLocaleString());
            console.log('LWOP Deduction: ₱' + (result.data.lwop_deduction || 0).toLocaleString());
            console.log('Net Pay: ₱' + result.data.net_pay.toLocaleString());

            expect(result.success).toBe(true);
            expect(result.data.lwop_deduction).toBeGreaterThan(0);
        });
    });

    describe('Allowance Calculations', () => {
        test('should calculate PERA correctly', async () => {
            const mockEmployee = {
                id: 4,
                first_name: 'Ana',
                last_name: 'Garcia',
                employee_number: 'EMP-004',
                current_monthly_salary: 35000,
                department: 'IT'
            };

            const mockPeriod = {
                id: 4,
                year: 2024,
                month: 10,
                period_number: 1,
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { daysPresent: 22 }
            );

            console.log('\n=== Test 4: PERA Allowance ===');
            const pera = result.data.allowances.find(a => a.code === 'PERA');
            console.log('PERA Amount: ₱' + (pera?.amount || 0).toLocaleString());
            console.log('Basis:', pera?.basis);

            expect(pera).toBeDefined();
            expect(pera.amount).toBe(2000);
        });

        test('should calculate hazard pay for health workers', async () => {
            const mockEmployee = {
                id: 5,
                first_name: 'Dr. Rosa',
                last_name: 'Cruz',
                employee_number: 'EMP-005',
                current_monthly_salary: 45000,
                current_daily_rate: 2045.45,
                department: 'RHU'
            };

            const mockPeriod = {
                id: 5,
                year: 2024,
                month: 10,
                period_number: 1,
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { daysPresent: 22 }
            );

            console.log('\n=== Test 5: Hazard Pay (Health Worker) ===');
            const hazardPay = result.data.allowances.find(a => a.code === 'HAZARD');
            console.log('Hazard Pay Amount: ₱' + (hazardPay?.amount || 0).toLocaleString());
            console.log('Basis:', hazardPay?.basis);

            expect(hazardPay).toBeDefined();
            expect(hazardPay.amount).toBeGreaterThan(0);
            // Should be 25% of basic pay
            expect(hazardPay.amount).toBeCloseTo(45000 * 0.25, 1);
        });

        test('should calculate RATA for executive employees', async () => {
            const mockEmployee = {
                id: 6,
                first_name: 'Mayor',
                last_name: 'Lopez',
                employee_number: 'EMP-006',
                current_monthly_salary: 80000,
                monthly_rata: 5000,
                position: 'Municipal Mayor',
                department: 'EXECUTIVE'
            };

            const mockPeriod = {
                id: 6,
                year: 2024,
                month: 10,
                period_number: 1,
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { daysPresent: 22 }
            );

            console.log('\n=== Test 6: RATA (Executive) ===');
            const rata = result.data.allowances.find(a => a.code === 'RATA');
            console.log('RATA Amount: ₱' + (rata?.amount || 0).toLocaleString());
            console.log('Basis:', rata?.basis);

            expect(rata).toBeDefined();
            expect(rata.amount).toBe(5000);
        });
    });

    describe('Deduction Calculations', () => {
        test('should calculate GSIS correctly', async () => {
            const mockEmployee = {
                id: 7,
                first_name: 'Jose',
                last_name: 'Ramos',
                employee_number: 'EMP-007',
                current_monthly_salary: 40000,
                department: 'ADMIN'
            };

            const mockPeriod = {
                id: 7,
                year: 2024,
                month: 10,
                period_number: 1,
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { daysPresent: 22 }
            );

            console.log('\n=== Test 7: GSIS Deduction ===');
            const gsis = result.data.deductions.find(d => d.code === 'GSIS');
            console.log('GSIS Amount: ₱' + (gsis?.amount || 0).toLocaleString());
            console.log('Basis:', gsis?.basis);

            expect(gsis).toBeDefined();
            // Should be 9% of basic salary
            expect(gsis.amount).toBeCloseTo(40000 * 0.09, 1);
        });

        test('should calculate PhilHealth correctly', async () => {
            const mockEmployee = {
                id: 8,
                first_name: 'Linda',
                last_name: 'Torres',
                employee_number: 'EMP-008',
                current_monthly_salary: 50000,
                department: 'FINANCE'
            };

            const mockPeriod = {
                id: 8,
                year: 2024,
                month: 10,
                period_number: 1,
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { daysPresent: 22 }
            );

            console.log('\n=== Test 8: PhilHealth Deduction ===');
            const philhealth = result.data.deductions.find(d => d.code === 'PHILHEALTH');
            console.log('PhilHealth Amount: ₱' + (philhealth?.amount || 0).toLocaleString());
            console.log('Basis:', philhealth?.basis);

            expect(philhealth).toBeDefined();
            expect(philhealth.amount).toBeGreaterThan(0);
        });

        test('should calculate withholding tax correctly', async () => {
            const mockEmployee = {
                id: 9,
                first_name: 'Roberto',
                last_name: 'Fernandez',
                employee_number: 'EMP-009',
                current_monthly_salary: 60000,
                department: 'IT'
            };

            const mockPeriod = {
                id: 9,
                year: 2024,
                month: 10,
                period_number: 1,
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { daysPresent: 22 }
            );

            console.log('\n=== Test 9: Withholding Tax ===');
            const wtax = result.data.deductions.find(d => d.code === 'WTAX');
            console.log('Withholding Tax: ₱' + (wtax?.amount || 0).toLocaleString());
            console.log('Taxable Income: ₱' + result.data.taxable_income.toLocaleString());
            console.log('Basis:', wtax?.basis);

            expect(wtax).toBeDefined();
            expect(wtax.amount).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        test('should handle zero days present', async () => {
            const mockEmployee = {
                id: 10,
                first_name: 'Carlos',
                last_name: 'Mendoza',
                employee_number: 'EMP-010',
                current_monthly_salary: 30000,
                department: 'ADMIN'
            };

            const mockPeriod = {
                id: 10,
                year: 2024,
                month: 10,
                period_number: 1,
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { daysPresent: 0 }
            );

            console.log('\n=== Test 10: Zero Days Present ===');
            console.log('Basic Pay: ₱' + result.data.basic_pay.toLocaleString());
            console.log('Net Pay: ₱' + result.data.net_pay.toLocaleString());
            console.log('Warnings:', result.data.warnings);

            expect(result.success).toBe(true);
            expect(result.data.basic_pay).toBe(0);
            expect(result.data.warnings.length).toBeGreaterThan(0);
        });

        test('should prevent negative net pay', async () => {
            const mockEmployee = {
                id: 11,
                first_name: 'Elena',
                last_name: 'Diaz',
                employee_number: 'EMP-011',
                current_monthly_salary: 15000,
                department: 'ADMIN'
            };

            const mockPeriod = {
                id: 11,
                year: 2024,
                month: 10,
                period_number: 1,
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { 
                    daysPresent: 5,
                    loanDeductions: [
                        { code: 'LOAN1', name: 'Personal Loan', amount: 10000 }
                    ]
                }
            );

            console.log('\n=== Test 11: Excessive Deductions ===');
            console.log('Gross Pay: ₱' + result.data.gross_pay.toLocaleString());
            console.log('Total Deductions: ₱' + result.data.total_deductions.toLocaleString());
            console.log('Net Pay: ₱' + result.data.net_pay.toLocaleString());
            console.log('Errors:', result.data.errors);

            expect(result.data.net_pay).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Calculation Breakdown', () => {
        test('should generate detailed calculation breakdown', async () => {
            const mockEmployee = {
                id: 12,
                first_name: 'Sofia',
                last_name: 'Alvarez',
                employee_number: 'EMP-012',
                current_monthly_salary: 38000,
                department: 'HR'
            };

            const mockPeriod = {
                id: 12,
                year: 2024,
                month: 10,
                period_number: 1,
                working_days: 22
            };

            const result = await engine.calculateEmployeePayroll(
                mockEmployee,
                mockPeriod,
                22,
                { daysPresent: 22 }
            );

            const breakdown = engine.generateCalculationBreakdown(result.data);

            console.log('\n=== Test 12: Calculation Breakdown ===');
            console.log(JSON.stringify(breakdown, null, 2));

            expect(breakdown.employee).toBeDefined();
            expect(breakdown.salary).toBeDefined();
            expect(breakdown.allowances).toBeDefined();
            expect(breakdown.deductions).toBeDefined();
            expect(breakdown.summary).toBeDefined();
        });
    });
});
