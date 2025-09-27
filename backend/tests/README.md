# LGU Portal - Test Suite

## Overview

This directory contains comprehensive test suites for the LGU Portal backend components. The tests are built using Jest and focus on ensuring reliability, accuracy, and proper error handling across all modules. All test files follow consistent code formatting standards with proper indentation and quote usage for improved maintainability.

## Test Structure

```
tests/
├── setup.js                           # Global test configuration and mocks
├── compensationBenefits.test.js       # Compensation & Benefits module tests
└── README.md                          # This documentation

# API Integration Tests (outside tests/ directory)
../test-compensation-api.js            # API endpoint integration tests
../test-full-workflow.js               # Complete workflow testing (recently enhanced)
../verify-database.js                  # Database verification tests
```

**Recent Enhancements:**
- **Code Formatting Standards**: All test files updated with consistent formatting
- **Syntax Improvements**: Added trailing commas and standardized quote usage
- **Enhanced Readability**: Improved indentation and code structure
- **Maintainability Focus**: Better code organization while preserving functionality
- **Quality Consistency**: Unified formatting patterns across all test files

## Running Tests

### All Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### API Integration Tests
```bash
# Run API integration tests for Compensation & Benefits
node test-compensation-api.js

# Run from project root
node backend/test-compensation-api.js
```

### Specific Module Tests
```bash
# Run Compensation & Benefits unit tests
npm run test:compensation

# Run Compensation & Benefits tests in watch mode
npm run test:compensation:watch

# Run specific test suite
npm test -- --grep "CompensationBenefit Model"
```

## Test Coverage

### Compensation & Benefits Module

#### Unit Tests (`compensationBenefits.test.js`)

**Model Validation Tests**:
- ✅ Valid benefit record creation
- ✅ Invalid benefit type validation
- ✅ Missing required fields validation
- ✅ Days validation for leave-based benefits

**Service Calculation Tests**:
- ✅ PBB calculation accuracy
- ✅ Mid-Year Bonus calculation
- ✅ GSIS contribution calculation
- ✅ Loyalty Award calculation with service years
- ✅ Employee not found error handling
- ✅ Eligibility validation for loyalty awards

**Business Logic Tests**:
- ✅ Benefit constants validation
- ✅ Bulk operation processing
- ✅ Invalid benefit type handling

#### API Integration Tests (`test-compensation-api.js`)

**Server Connectivity Tests**:
- ✅ Health endpoint accessibility
- ✅ Server running on correct port
- ✅ CORS configuration validation

**Route Registration Tests**:
- ✅ All compensation benefits endpoints registered
- ✅ Authentication middleware properly configured
- ✅ Route parameter handling

**Model Integration Tests**:
- ✅ CompensationBenefit model validation
- ✅ Service constants loading
- ✅ Database connection verification

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: Node.js
- **Test Pattern**: `**/*.test.js`
- **Coverage**: Models, services, controllers, utils
- **Timeout**: 10 seconds
- **Setup**: Global mocks and utilities

### Global Setup (`setup.js`)
- Environment variable loading
- Database connection mocking
- Console output suppression
- Test utility functions
- Mock data generators

## Writing Tests

### Test Structure
```javascript
describe('Module Name', () => {
    describe('Feature/Function', () => {
        test('should do something specific', () => {
            // Arrange
            const input = createTestData();
            
            // Act
            const result = functionUnderTest(input);
            
            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });
    });
});
```

### Mocking Guidelines
```javascript
// Mock external dependencies
jest.spyOn(Employee, 'findById').mockResolvedValue({
    success: true,
    data: mockEmployee
});

// Clean up mocks
afterEach(() => {
    jest.clearAllMocks();
});
```

### Test Data
Use the global test utilities for consistent mock data:
```javascript
const mockEmployee = global.testUtils.createMockEmployee({
    current_monthly_salary: 60000.00
});
```

## Coverage Requirements

- **Branches**: 70% minimum
- **Functions**: 70% minimum  
- **Lines**: 70% minimum
- **Statements**: 70% minimum

## Best Practices

1. **Descriptive Test Names**: Use clear, specific test descriptions
2. **Arrange-Act-Assert**: Follow the AAA pattern for test structure
3. **Mock External Dependencies**: Isolate units under test
4. **Test Edge Cases**: Include error scenarios and boundary conditions
5. **Clean Up**: Restore mocks and clean state between tests
6. **Fast Tests**: Keep tests fast and focused on single responsibilities
7. **Code Formatting**: Use consistent formatting with trailing commas, double quotes, and proper indentation
8. **Code Quality**: Maintain readable and well-structured test code with consistent syntax patterns

## Adding New Tests

When adding new modules or features:

1. **Create Test File**: Follow naming convention `moduleName.test.js`
2. **Import Dependencies**: Import the module and required utilities
3. **Write Test Suites**: Group related tests in `describe` blocks
4. **Mock Dependencies**: Mock external services and database calls
5. **Test All Scenarios**: Include success, error, and edge cases
6. **Update Documentation**: Update this README with new test information

## Debugging Tests

### Common Issues
- **Database Connection Errors**: Ensure mocks are properly configured
- **Timeout Errors**: Increase timeout for slow operations
- **Mock Issues**: Verify mock setup and cleanup
- **Environment Variables**: Check test environment configuration

### Debug Commands
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file with debugging
npm test tests/compensationBenefits.test.js -- --verbose

# Run tests with coverage and open report
npm run test:coverage && open coverage/lcov-report/index.html
```

## Continuous Integration

Tests are designed to run in CI/CD environments:
- No external database dependencies (mocked)
- Environment variable handling
- Consistent cross-platform behavior
- Fast execution times

## Future Enhancements

Planned test additions:
- Employee model tests
- Authentication tests
- Leave management tests
- Payroll calculation tests
- Integration tests
- Performance tests
- API endpoint tests

---

For questions or issues with the test suite, refer to the main project documentation or contact the development team.