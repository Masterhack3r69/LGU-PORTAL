# Compensation & Benefits Module Documentation

## Overview

The Compensation & Benefits module is a standalone system for managing employee benefits calculations and processing. It handles various types of benefits including Terminal Leave, Monetization, Performance-Based Bonuses, and other government-mandated benefits.

## Features

### Benefit Types Supported

1. **Terminal Leave Benefit (TLB)**
   - Formula: `total_leave_earned × highest_salary × TLB_FACTOR`
   - Uses highest salary and total leave earned during employment
   - **Eligibility**: Only for employees with status: Resigned, Terminated, or Retired
   - Automatically calculated based on employee data

2. **Leave Monetization**
   - Formula: `days × (monthly_salary ÷ DEFAULT_WORKING_DAYS)`
   - Validates against current leave balance
   - Updates leave balance after processing
   - Maximum days validation included

3. **Performance-Based Bonus (PBB)**
   - Formula: `monthly_salary × 12 × PBB_PERCENT`
   - Annual bonus calculation
   - Configurable percentage

4. **13th Month Bonus (Mid-Year)**
   - Formula: `monthly_salary`
   - Standard mid-year bonus

5. **14th Month Bonus (Year-End)**
   - Formula: `monthly_salary`
   - Standard year-end bonus

6. **Employee Compensation (EC)**
   - Manual input by Admin
   - Flexible amount entry

7. **GSIS Contribution**
   - Formula: `monthly_salary × GSIS_PERCENT`
   - Government service insurance

8. **Loyalty Award**
   - Formula: `10,000 at 10 years + 5,000 for every +5 years`
   - Automatic eligibility calculation
   - Years of service validation

## Database Schema

### Main Table: `comp_benefit_records`

```sql
CREATE TABLE comp_benefit_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  benefit_type ENUM(
    'TERMINAL_LEAVE',
    'MONETIZATION', 
    'PBB',
    'MID_YEAR_BONUS',
    'YEAR_END_BONUS',
    'EC',
    'GSIS',
    'LOYALTY'
  ) NOT NULL,
  days_used DECIMAL(6,2) DEFAULT NULL,
  amount DECIMAL(12,2) NOT NULL,
  notes VARCHAR(255) DEFAULT NULL,
  processed_by INT NOT NULL,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id)
);
```

### View: `v_compensation_benefits`

Provides enriched data with employee information for reporting.

## API Endpoints

### Base URL: `/api/compensation-benefits`

#### GET Endpoints

- `GET /` - Get all compensation benefit records (paginated)
- `GET /statistics` - Get comprehensive benefit statistics with totals and breakdowns
- `GET /eligible/:benefitType` - Get employees eligible for specific benefit
- `GET /calculate/:benefitType/:employeeId` - Calculate benefit for employee
- `GET /:id` - Get specific benefit record by ID

#### POST Endpoints

- `POST /` - Create single benefit record
- `POST /bulk-calculate` - Calculate benefits for multiple employees
- `POST /bulk-process` - Process multiple benefit records
- `POST /process-monetization` - Process monetization with leave balance update

#### DELETE Endpoints

- `DELETE /:id` - Delete benefit record (admin only)

## Usage Examples

### 1. Calculate Terminal Leave Benefit

```javascript
GET /api/compensation-benefits/calculate/TERMINAL_LEAVE/123
```

Response:
```json
{
  "success": true,
  "data": {
    "employee_id": 123,
    "benefit_type": "TERMINAL_LEAVE",
    "days_used": 45.5,
    "amount": 125000.00,
    "calculation_details": {
      "total_leave_earned": 45.5,
      "highest_salary": 60000.00,
      "daily_rate": 2727.27,
      "tlb_factor": 1.0
    }
  }
}
```

### 2. Bulk Process PBB for All Employees

```javascript
POST /api/compensation-benefits/bulk-calculate
{
  "benefitType": "PBB",
  "employeeIds": [1, 2, 3, 4, 5]
}
```

### 3. Process Monetization

```javascript
POST /api/compensation-benefits/process-monetization
{
  "employee_id": 123,
  "days_to_monetize": 15,
  "notes": "Leave monetization for Q4 2024"
}
```

### 4. Get Comprehensive Statistics

```javascript
GET /api/compensation-benefits/statistics
```

Response:
```json
{
  "success": true,
  "data": {
    "total_records": 1250,
    "total_amount": 15750000.00,
    "by_benefit_type": [
      {
        "benefit_type": "PBB",
        "count": 450,
        "total_amount": 8500000.00
      },
      {
        "benefit_type": "MID_YEAR_BONUS",
        "count": 400,
        "total_amount": 3200000.00
      }
    ],
    "monthly_summary": [
      {
        "month": 1,
        "count": 120,
        "total_amount": 1200000.00
      }
    ],
    "top_employees": [
      {
        "employee_id": 123,
        "employee_name": "John Doe",
        "employee_number": "EMP001",
        "benefit_count": 5,
        "total_amount": 250000.00
      }
    ]
  }
}
```

## Admin Workflows

### Bulk Processing (Yearly Benefits)

1. **Select Benefit Type** (PBB, 13th Month, 14th Month, Loyalty, GSIS)
2. **Fetch Eligible Employees** using `/eligible/:benefitType`
3. **Calculate Amounts** using `/bulk-calculate`
4. **Review and Edit** amounts in admin interface
5. **Process All** using `/bulk-process`

### Individual Processing (TLB, EC)

1. **Select Employee and Benefit Type**
2. **Calculate Amount** (automatic for TLB, manual for EC)
3. **Process Single Record** using POST `/`

### Monetization Workflow

1. **Select Employees**
2. **Enter Days to Monetize**
3. **Validate Against Leave Balances**
4. **Process** using `/process-monetization`
5. **System Updates Leave Balances Automatically**

## Configuration Constants

Located in `CompensationBenefitService.js`:

```javascript
this.CONSTANTS = {
  TLB_FACTOR: 1.0,
  PBB_PERCENT: 1.0,
  GSIS_PERCENT: 0.09,
  DEFAULT_WORKING_DAYS: 22,
  LOYALTY_BASE_AMOUNT: 10000,
  LOYALTY_INCREMENT: 5000,
  LOYALTY_BASE_YEARS: 10,
  LOYALTY_INCREMENT_YEARS: 5
};
```

## Security & Access Control

- **All endpoints require authentication**
- **Admin-only access** for all operations
- **Audit logging** enabled for all transactions
- **Input validation** on all data entry points
- **Transaction safety** for monetization processing

## Reports Available

1. **Benefit History per Employee**
2. **Annual Summary per Benefit Type**
3. **Leave Monetization Register**
4. **Loyalty Awards List**
5. **Monthly/Yearly Statistics** with total records and amounts
6. **Top Employees by Benefits** - Ranking by total benefit amounts received

## Installation & Setup

1. **Run Database Migration**:
   ```bash
   node backend/scripts/setup-compensation-benefits.js
   ```

2. **Verify Installation**:
   - Check that `comp_benefit_records` table exists
   - Verify API endpoints are accessible
   - Test calculation functions

3. **Run Test Suite**:
   ```bash
   # Run all compensation benefits tests
   npm test -- --grep "Compensation & Benefits"
   
   # Run with coverage report
   npm run test:coverage
   ```

4. **Configure Constants** (if needed):
   - Edit `CompensationBenefitService.js`
   - Adjust calculation factors and percentages

## Integration Points

### With Existing Modules

- **Employee Module**: Uses employee salary and service data
- **Leave Module**: Integrates with leave balances for TLB and monetization
- **Audit Module**: All operations are logged
- **User Module**: Tracks who processed each benefit

### Data Dependencies

- Employee salary information (current and highest)
- Leave balance data (for TLB and monetization)
- Employee appointment dates (for loyalty awards)
- User authentication (for processing tracking)

## Error Handling

- **Validation Errors**: Input validation with detailed error messages
- **Business Logic Errors**: Insufficient balances, eligibility checks
- **Database Errors**: Transaction rollback for data integrity
- **Calculation Errors**: Safe mathematical operations with error catching

## Frontend Integration

### TypeScript Support

The module now includes comprehensive TypeScript definitions for frontend integration:

- **Complete Type Coverage**: All API endpoints, request/response objects, and data models
- **Type-Safe Development**: Compile-time validation for React components
- **Enhanced Developer Experience**: IntelliSense support and error detection
- **API Contract Enforcement**: Ensures consistency between frontend and backend

### Available Types

Located in `frontend/src/types/compensation.ts`:

- `CompensationBenefit` - Main benefit record interface
- `BenefitType` - Union type for all supported benefit types
- `BenefitCalculation` - Calculation result interface
- `EligibleEmployee` - Employee eligibility interface
- `BulkProcessRequest` - Bulk processing request
- `MonetizationRequest` - Monetization processing request
- `CompensationFilters` - Filtering and pagination options
- `CompensationResponse` - Paginated API response
- `BenefitStatistics` - Statistics and analytics data

### Constants and Labels

Pre-defined constants for UI display:

- `BENEFIT_TYPE_LABELS` - Human-readable benefit type names
- `BENEFIT_TYPE_DESCRIPTIONS` - Detailed calculation descriptions

### React Components

The frontend includes specialized React components for benefits management:

#### `BulkProcessingPanel.tsx`
- **Purpose**: Handles bulk processing of benefits for multiple employees
- **Features**: 
  - Benefit type selection (PBB, bonuses, GSIS, Loyalty)
  - Employee multi-selection with eligibility validation
  - Real-time calculation preview
  - Bulk processing with progress tracking
  - Comprehensive error handling and user feedback
- **Integration**: Uses `compensationService` for API calls and type-safe operations

#### `SingleProcessingPanel.tsx`
- **Purpose**: Individual employee benefit processing
- **Features**:
  - Single employee selection
  - Individual benefit calculations (TLB, EC, Monetization)
  - Manual amount entry for Employee Compensation
  - Leave balance validation for monetization
- **Integration**: Type-safe API integration with validation

#### `BenefitRecordsTable.tsx`
- **Purpose**: Display and manage benefit records
- **Features**:
  - Paginated benefit history
  - Filtering by benefit type, employee, date range
  - Sortable columns with search functionality
  - Export capabilities for reporting
- **Integration**: Uses typed API responses for data display

#### `BenefitStatisticsCards.tsx`
- **Purpose**: Dashboard statistics and analytics
- **Features**:
  - Summary cards for total amounts by benefit type
  - Monthly/yearly trend analysis
  - Employee benefit distribution
  - Visual charts and graphs
- **Integration**: Consumes typed statistics API endpoints

## Future Enhancements

1. **Export Functionality** (CSV/PDF)
2. **Email Notifications** for processed benefits
3. **Approval Workflows** for high-value benefits
4. **Integration with Payroll** module
5. **Automated Scheduling** for yearly benefits
6. **Custom Benefit Types** configuration
7. **Multi-currency Support**
8. **React Components** for benefit management UI
9. **Real-time Processing** updates via WebSocket
10. **Mobile-Responsive** benefit processing interface

## Testing

### API Integration Testing

A dedicated API testing script is available at `backend/test-compensation-api.js` for comprehensive endpoint validation:

```bash
# Run API integration tests
node backend/test-compensation-api.js
```

**Test Coverage:**
- Server connectivity and health checks
- Route registration verification
- Authentication middleware validation
- Model validation testing
- Service calculation constants verification

### Full Workflow Testing

A comprehensive end-to-end test suite is available at `backend/test-full-workflow.js`:

```bash
# Run complete workflow tests
node backend/test-full-workflow.js
```

**Enhanced Test Coverage:**
- ✅ **Automated Test Data Setup**: Creates test employees, users, and leave balances
- ✅ **All Benefit Calculations**: Tests PBB, TLB, Monetization, GSIS, Loyalty, and bonuses
- ✅ **Database Operations**: Validates CRUD operations and foreign key relationships
- ✅ **Statistics Generation**: Tests comprehensive analytics with proper property access
- ✅ **Bulk Operations**: Multi-employee processing workflows
- ✅ **Error Handling**: Comprehensive validation and edge case testing

**Recent Improvements:**
- **Statistics Property Fixes**: Corrected property name consistency (`by_benefit_type`, `monthly_summary`, `top_employees`)
- **Enhanced Debug Logging**: Added detailed statistics output for troubleshooting
- **Null Safety**: Implemented optional chaining for robust error handling
- **Data Validation**: Improved test data verification and setup
- **Numeric Calculation Fix**: Added `parseFloat()` to ensure accurate total amount calculations in statistics

### Unit Test Suite Coverage

The module includes comprehensive Jest tests covering:

- **Model Validation**: All benefit types and required fields
- **Calculation Accuracy**: PBB, GSIS, Loyalty Awards, and bonuses
- **Business Logic**: Eligibility rules and error handling
- **Bulk Operations**: Multi-employee processing
- **Edge Cases**: Invalid data and missing employees

### Running Tests

```bash
# Run API integration tests
node backend/test-compensation-api.js

# Run full workflow tests (recommended)
node backend/test-full-workflow.js

# Run unit tests
npm test backend/tests/compensationBenefits.test.js

# Run specific test suites
npm test -- --grep "CompensationBenefit Model"
npm test -- --grep "Service Calculations"

# Generate coverage report
npm run test:coverage
```

**Expected Full Workflow Test Output:**
```
🚀 Running Full Compensation & Benefits Workflow Test
============================================================
🔧 Setting up test data...
✅ Created test admin user
✅ Created test employee
✅ Created test leave type
✅ Created test leave balance

🧮 Testing Benefit Calculations...
✅ PBB calculation successful
✅ Mid-Year Bonus calculation successful
✅ GSIS calculation successful
✅ Terminal Leave calculation successful
✅ Monetization calculation successful

💾 Testing Database Operations...
✅ Benefit record created successfully
✅ Record retrieved successfully
✅ Retrieved 5 records
✅ Statistics retrieved successfully
   Statistics data: { total_records: 1250, total_amount: 15750000.00, ... }
   Benefit Types: 8
   Monthly Summary: 12 months
   Top Employees: 10

📦 Testing Bulk Operations...
✅ Bulk calculation successful
✅ Bulk creation successful

🎉 Full Workflow Test Complete!
🏆 Compensation & Benefits Module Status: FULLY OPERATIONAL
```

### Test Data

Tests use mocked employee data to validate:
- Calculation formulas with known inputs/outputs
- Error handling for invalid scenarios
- Business rule enforcement
- Data validation requirements

## Troubleshooting

### Common Issues

1. **"Employee not found"**: Verify employee ID exists and is active
2. **"Insufficient leave balance"**: Check current leave balance before monetization
3. **"Not eligible for loyalty award"**: Verify years of service calculation
4. **"Validation failed"**: Check required fields and data types

### Debug Information

- Enable detailed logging in development
- Check audit logs for transaction history
- Verify database constraints and foreign keys
- Test calculations with known values
- Run test suite to validate functionality

## Support

For technical support or feature requests, contact the development team or refer to the main system documentation.