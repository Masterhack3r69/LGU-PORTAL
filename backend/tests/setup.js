// tests/setup.js - Jest setup file for global test configuration
const path = require('path');

// Load environment variables for testing
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock database connection for tests
jest.mock('../config/database', () => ({
  pool: {
    execute: jest.fn(),
    query: jest.fn()
  },
  executeQuery: jest.fn(),
  findOne: jest.fn(),
  executeTransaction: jest.fn()
}));

// Global test utilities
global.testUtils = {
  // Helper function to create mock employee data
  createMockEmployee: (overrides = {}) => ({
    id: 1,
    employee_number: 'EMP00000001',
    first_name: 'John',
    middle_name: 'M',
    last_name: 'Doe',
    current_monthly_salary: 50000.00,
    appointment_date: '2020-01-01',
    ...overrides
  }),
  
  // Helper function to create mock user data
  createMockUser: (overrides = {}) => ({
    id: 1,
    username: 'admin',
    role: 'admin',
    ...overrides
  })
};

// Set test environment
process.env.NODE_ENV = 'test';