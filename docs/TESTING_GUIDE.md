# Employee Management System - Testing Guide

## Testing Strategy Overview

The Employee Management System employs a comprehensive testing strategy covering unit tests, integration tests, API tests, and end-to-end testing to ensure reliability and maintainability.

### Testing Pyramid
```
                E2E Tests
               /         \
            Integration Tests
             /              \
        Unit Tests (Backend & Frontend)
```

## Backend Testing

### Test Environment Setup

#### Prerequisites
```bash
# Install testing dependencies (already included in package.json)
cd backend
npm install

# Create test database
mysql -u root -p
CREATE DATABASE employee_management_system_test;
GRANT ALL PRIVILEGES ON employee_management_system_test.* TO 'ems_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Jest Configuration
```javascript
// backend/jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
```

### Unit Tests

#### Model Tests
```javascript
// backend/tests/models/Employee.test.js
const Employee = require('../../models/Employee');
const db = require('../../config/database');

describe('Employee Model', () => {
  beforeAll(async () => {
    await db.query('DELETE FROM employees WHERE employee_number LIKE "TEST%"');
  });

  afterAll(async () => {
    await db.query('DELETE FROM employees WHERE employee_number LIKE "TEST%"');
    await db.end();
  });

  describe('create', () => {
    test('should create employee with valid data', async () => {
      const employeeData = {
        employee_number: 'TEST001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        hire_date: '2024-01-15',
        position: 'Software Developer',
        department: 'IT',
        basic_salary: 50000.00,
        employment_status: 'Regular',
        employment_type: 'Full-time'
      };

      const employee = await Employee.create(employeeData);
      
      expect(employee).toBeDefined();
      expect(employee.id).toBeDefined();
      expect(employee.employee_number).toBe('TEST001');
      expect(employee.first_name).toBe('John');
      expect(employee.last_name).toBe('Doe');
    });

    test('should throw error for duplicate employee number', async () => {
      const employeeData = {
        employee_number: 'TEST001', // Duplicate
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@test.com',
        hire_date: '2024-01-16',
        position: 'HR Specialist',
        department: 'HR',
        basic_salary: 45000.00
      };

      await expect(Employee.create(employeeData)).rejects.toThrow();
    });
  });
});
```

### Running Backend Tests

#### Test Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/models/Employee.test.js

# Run tests in watch mode
npm run test:watch
```

## Frontend Testing

### Test Environment Setup

#### Install Testing Dependencies
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

#### Vitest Configuration
```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
```

### Component Tests

#### Employee List Component Test
```typescript
// frontend/src/components/employees/__tests__/EmployeeList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import EmployeeList from '../EmployeeList';
import * as api from '@/services/api';

// Mock API
vi.mock('@/services/api');
const mockApi = vi.mocked(api);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('EmployeeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders employee list correctly', async () => {
    const mockEmployees = [
      {
        id: 1,
        employee_number: 'EMP001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com',
        position: 'Software Developer',
        department: 'IT',
        status: 'Active',
      },
    ];

    mockApi.get.mockResolvedValue({
      data: {
        success: true,
        data: mockEmployees,
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      },
    });

    render(<EmployeeList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('EMP001')).toBeInTheDocument();
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
  });
});
```

### Running Frontend Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- EmployeeList.test.tsx
```

## End-to-End Testing

### Playwright Setup

#### Install Playwright
```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

#### E2E Test Example
```typescript
// frontend/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login and logout successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    await expect(page).toHaveURL('/login');
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run tests in headed mode
npx playwright test --headed

# Run specific test file
npx playwright test auth.spec.ts
```

## Test Data Management

### Test Database Setup
```sql
-- Create test-specific data
INSERT INTO users (username, password_hash, role) VALUES 
('testadmin', '$2a$12$hashedpassword', 'admin'),
('testemployee', '$2a$12$hashedpassword', 'employee');

INSERT INTO employees (employee_number, first_name, last_name, hire_date, position, department, basic_salary) VALUES
('TEST001', 'Test', 'Admin', '2024-01-01', 'Administrator', 'IT', 60000.00),
('TEST002', 'Test', 'Employee', '2024-01-01', 'Developer', 'IT', 50000.00);
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: employee_management_system_test
        ports:
          - 3306:3306

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install backend dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run backend tests
      run: |
        cd backend
        npm run test:ci
      env:
        TEST_DB_HOST: 127.0.0.1
        TEST_DB_USER: root
        TEST_DB_PASSWORD: root
        TEST_DB_NAME: employee_management_system_test

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm run test:coverage
```

This testing guide provides a comprehensive framework for ensuring the quality and reliability of the Employee Management System through various testing methodologies and continuous integration practices.