// tests/compensationBenefits.test.js - Test suite for Compensation & Benefits module
const CompensationBenefit = require('../models/CompensationBenefit');
const CompensationBenefitService = require('../services/compensationBenefitService');
const Employee = require('../models/Employee');

describe('Compensation & Benefits Module', () => {
    let service;
    let testEmployeeId = 1; // Assuming employee with ID 1 exists

    beforeAll(() => {
        service = new CompensationBenefitService();
    });

    describe('CompensationBenefit Model', () => {
        test('should create a valid compensation benefit record', () => {
            const benefitData = {
                employee_id: testEmployeeId,
                benefit_type: 'PBB',
                amount: 50000.00,
                notes: 'Test PBB calculation',
                processed_by: 1
            };

            const benefit = new CompensationBenefit(benefitData);
            const validation = benefit.validate();

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        test('should fail validation for invalid benefit type', () => {
            const benefitData = {
                employee_id: testEmployeeId,
                benefit_type: 'INVALID_TYPE',
                amount: 50000.00,
                processed_by: 1
            };

            const benefit = new CompensationBenefit(benefitData);
            const validation = benefit.validate();

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Invalid benefit type');
        });

        test('should fail validation for missing required fields', () => {
            const benefitData = {
                benefit_type: 'PBB'
                // Missing employee_id, amount, processed_by
            };

            const benefit = new CompensationBenefit(benefitData);
            const validation = benefit.validate();

            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
        });

        test('should require days_used for TERMINAL_LEAVE and MONETIZATION', () => {
            const benefitData = {
                employee_id: testEmployeeId,
                benefit_type: 'TERMINAL_LEAVE',
                amount: 50000.00,
                processed_by: 1
                // Missing days_used
            };

            const benefit = new CompensationBenefit(benefitData);
            const validation = benefit.validate();

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Days used is required for this benefit type');
        });
    });

    describe('CompensationBenefitService Calculations', () => {
        test('should calculate PBB correctly', async () => {
            // Mock employee data
            const mockEmployee = {
                id: testEmployeeId,
                current_monthly_salary: 50000.00
            };

            // Mock Employee.findById
            jest.spyOn(Employee, 'findById').mockResolvedValue({
                success: true,
                data: mockEmployee
            });

            const result = await service.calculatePBB(testEmployeeId);

            expect(result.success).toBe(true);
            expect(result.data.benefit_type).toBe('PBB');
            expect(result.data.amount).toBe(600000.00); // 50000 * 12 * 1.0
            expect(result.data.calculation_details.monthly_salary).toBe(50000.00);

            Employee.findById.mockRestore();
        });

        test('should calculate Mid-Year Bonus correctly', async () => {
            const mockEmployee = {
                id: testEmployeeId,
                current_monthly_salary: 45000.00
            };

            jest.spyOn(Employee, 'findById').mockResolvedValue({
                success: true,
                data: mockEmployee
            });

            const result = await service.calculateMidYearBonus(testEmployeeId);

            expect(result.success).toBe(true);
            expect(result.data.benefit_type).toBe('MID_YEAR_BONUS');
            expect(result.data.amount).toBe(45000.00);

            Employee.findById.mockRestore();
        });

        test('should calculate GSIS contribution correctly', async () => {
            const mockEmployee = {
                id: testEmployeeId,
                current_monthly_salary: 60000.00
            };

            jest.spyOn(Employee, 'findById').mockResolvedValue({
                success: true,
                data: mockEmployee
            });

            const result = await service.calculateGSIS(testEmployeeId);

            expect(result.success).toBe(true);
            expect(result.data.benefit_type).toBe('GSIS');
            expect(result.data.amount).toBe(5400.00); // 60000 * 0.09
            expect(result.data.calculation_details.gsis_percent).toBe(0.09);

            Employee.findById.mockRestore();
        });

        test('should calculate Loyalty Award correctly', async () => {
            // Employee with 15 years of service
            const appointmentDate = new Date();
            appointmentDate.setFullYear(appointmentDate.getFullYear() - 15);

            const mockEmployee = {
                id: testEmployeeId,
                appointment_date: appointmentDate.toISOString().split('T')[0]
            };

            jest.spyOn(Employee, 'findById').mockResolvedValue({
                success: true,
                data: mockEmployee
            });

            const result = await service.calculateLoyaltyAward(testEmployeeId);

            expect(result.success).toBe(true);
            expect(result.data.benefit_type).toBe('LOYALTY');
            expect(result.data.amount).toBe(15000.00); // 10000 + (1 * 5000)
            expect(result.data.calculation_details.years_of_service).toBe(15);

            Employee.findById.mockRestore();
        });

        test('should fail loyalty award for insufficient years', async () => {
            // Employee with only 5 years of service
            const appointmentDate = new Date();
            appointmentDate.setFullYear(appointmentDate.getFullYear() - 5);

            const mockEmployee = {
                id: testEmployeeId,
                appointment_date: appointmentDate.toISOString().split('T')[0]
            };

            jest.spyOn(Employee, 'findById').mockResolvedValue({
                success: true,
                data: mockEmployee
            });

            const result = await service.calculateLoyaltyAward(testEmployeeId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not eligible for loyalty award');

            Employee.findById.mockRestore();
        });

        test('should handle employee not found', async () => {
            jest.spyOn(Employee, 'findById').mockResolvedValue({
                success: false,
                data: null
            });

            const result = await service.calculatePBB(999);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Employee not found');

            Employee.findById.mockRestore();
        });
    });

    describe('Benefit Constants', () => {
        test('should have correct default constants', () => {
            expect(service.CONSTANTS.TLB_FACTOR).toBe(1.0);
            expect(service.CONSTANTS.PBB_PERCENT).toBe(1.0);
            expect(service.CONSTANTS.GSIS_PERCENT).toBe(0.09);
            expect(service.CONSTANTS.DEFAULT_WORKING_DAYS).toBe(22);
            expect(service.CONSTANTS.LOYALTY_BASE_AMOUNT).toBe(10000);
            expect(service.CONSTANTS.LOYALTY_INCREMENT).toBe(5000);
            expect(service.CONSTANTS.LOYALTY_BASE_YEARS).toBe(10);
            expect(service.CONSTANTS.LOYALTY_INCREMENT_YEARS).toBe(5);
        });
    });

    describe('Bulk Operations', () => {
        test('should handle bulk benefit calculation', async () => {
            const mockEmployee = {
                id: testEmployeeId,
                current_monthly_salary: 50000.00
            };

            jest.spyOn(Employee, 'findById').mockResolvedValue({
                success: true,
                data: mockEmployee
            });

            const result = await service.bulkCalculateBenefit('PBB', [testEmployeeId]);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].employee_id).toBe(testEmployeeId);
            expect(result.data[0].calculation.success).toBe(true);

            Employee.findById.mockRestore();
        });

        test('should handle invalid benefit type in bulk calculation', async () => {
            const result = await service.bulkCalculateBenefit('INVALID_TYPE', [testEmployeeId]);

            expect(result.success).toBe(true);
            expect(result.data[0].calculation.success).toBe(false);
            expect(result.data[0].calculation.error).toBe('Invalid benefit type');
        });
    });
});

// Mock console methods to reduce test output noise
beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
    console.error.mockRestore();
    console.log.mockRestore();
});