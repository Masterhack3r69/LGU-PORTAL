# Compensation & Benefits API Documentation

## Overview

The Compensation & Benefits module provides comprehensive management of employee benefits including Terminal Leave, Monetization, Performance-Based Bonuses (PBB), Mid-Year and Year-End bonuses, Employee Compensation (EC), GSIS contributions, and Loyalty Awards.

## Database Schema

### comp_benefit_records Table

```sql
CREATE TABLE comp_benefit_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    benefit_type ENUM(
        'TERMINAL_LEAVE',    -- Terminal Leave Benefit
        'MONETIZATION',      -- Leave Monetization
        'PBB',              -- Performance-Based Bonus
        'MID_YEAR_BONUS',   -- 13th Month Bonus
        'YEAR_END_BONUS',   -- 14th Month Bonus
        'EC',               -- Employee Compensation
        'GSIS',             -- GSIS Contribution
        'LOYALTY'           -- Loyalty Award
    ) NOT NULL,
    days_used DECIMAL(6,2) DEFAULT NULL,     -- For leave-based benefits
    amount DECIMAL(12,2) NOT NULL,           -- Benefit amount
    notes VARCHAR(255) DEFAULT NULL,         -- Additional notes
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by INT NOT NULL,               -- Admin user who processed
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id)
);
```

## Model API Reference

### CompensationBenefit Class

#### Constructor
```javascript
new CompensationBenefit(data = {})
```

**Parameters:**
- `data` (Object): Initial data for the compensation benefit record

**Properties:**
- `id` (Number): Record ID
- `employee_id` (Number): Employee ID (required)
- `benefit_type` (String): Type of benefit (required)
- `days_used` (Number): Days used for leave-based benefits
- `amount` (Number): Benefit amount (required)
- `notes` (String): Additional notes
- `processed_at` (Date): Processing timestamp
- `processed_by` (Number): Admin user ID who processed

#### Instance Methods

##### validate()
Validates the compensation benefit data according to business rules.

**Returns:**
```javascript
{
    isValid: boolean,
    errors: string[]
}
```

**Validation Rules:**
- Employee ID is required
- Benefit type must be valid enum value
- Amount must be positive
- Days used required for TERMINAL_LEAVE and MONETIZATION
- Business rule validation for specific benefit types

##### save()
Saves the compensation benefit record (creates new record).

**Returns:**
```javascript
{
    success: boolean,
    data?: CompensationBenefit,
    error?: string,
    details?: string[]
}
```

#### Static Methods

##### findById(id)
Retrieves a compensation benefit record by ID with employee details.

**Parameters:**
- `id` (Number): Record ID

**Returns:**
```javascript
{
    success: boolean,
    data?: CompensationBenefit
}
```

**SQL Query:**
```sql
SELECT cbr.*, 
       CONCAT(e.first_name, ' ', IFNULL(e.middle_name, ''), ' ', e.last_name) as employee_name,
       e.employee_number,
       e.current_monthly_salary as monthly_salary
FROM comp_benefit_records cbr
JOIN employees e ON cbr.employee_id = e.id
WHERE cbr.id = ?
```

##### findAll(filters = {})
Retrieves compensation benefit records with filtering and pagination.

**Parameters:**
- `filters` (Object): Filter options
  - `employee_id` (Number): Filter by employee
  - `benefit_type` (String): Filter by benefit type
  - `year` (Number): Filter by processing year
  - `date_from` (String): Start date filter (YYYY-MM-DD)
  - `date_to` (String): End date filter (YYYY-MM-DD)
  - `search` (String): Search employee name or number
  - `limit` (Number): Records per page
  - `offset` (Number): Pagination offset

**Returns:**
```javascript
{
    success: boolean,
    data: CompensationBenefit[]
}
```

**Example Usage:**
```javascript
// Get all PBB records for 2024
const filters = {
    benefit_type: 'PBB',
    year: 2024,
    limit: 50,
    offset: 0
};
const result = await CompensationBenefit.findAll(filters);
```

##### getCount(filters = {})
Gets total count of records matching filters (for pagination).

**Parameters:**
- `filters` (Object): Same filter options as findAll()

**Returns:**
- `Number`: Total count of matching records

##### getStatistics(filters = {})
Retrieves comprehensive benefit statistics and analytics.

**Parameters:**
- `filters` (Object): Filter options
  - `year` (Number): Filter by year

**Returns:**
```javascript
{
    success: boolean,
    data: {
        benefitTypes: Array<{
            benefit_type: string,
            count: number,
            total_amount: number
        }>,
        monthlySummary: Array<{
            month: number,
            count: number,
            total_amount: number
        }>,
        topEmployees: Array<{
            employee_id: number,
            employee_name: string,
            employee_number: string,
            benefit_count: number,
            total_amount: number
        }>
    }
}
```

##### bulkCreate(records, processedBy)
Creates multiple compensation benefit records in a single transaction.

**Parameters:**
- `records` (Array): Array of benefit record objects
- `processedBy` (Number): Admin user ID processing the bulk operation

**Returns:**
```javascript
{
    success: boolean,
    data: Array<{
        employee_id: number,
        id: number,
        amount: number
    }>
}
```

**Example Usage:**
```javascript
const records = [
    {
        employee_id: 1,
        benefit_type: 'PBB',
        amount: 50000.00,
        notes: 'Performance-based bonus 2024'
    },
    {
        employee_id: 2,
        benefit_type: 'PBB',
        amount: 45000.00,
        notes: 'Performance-based bonus 2024'
    }
];

const result = await CompensationBenefit.bulkCreate(records, adminUserId);
```

##### delete(id)
Deletes a compensation benefit record (admin only).

**Parameters:**
- `id` (Number): Record ID to delete

**Returns:**
```javascript
{
    success: boolean,
    error?: string
}
```

## Benefit Type Calculations

### Terminal Leave Benefit (TLB)
```javascript
amount = unused_leave_days × highest_monthly_salary × TLB_FACTOR
```
- Uses highest salary earned during employment
- Calculated based on unused leave balance
- Typically processed upon retirement/resignation

### Leave Monetization
```javascript
amount = days_to_monetize × (monthly_salary ÷ DEFAULT_WORKING_DAYS)
```
- Converts unused leave days to cash
- Updates employee leave balance
- Limited by current leave balance

### Performance-Based Bonus (PBB)
```javascript
amount = monthly_salary × 12 × PBB_PERCENTAGE
```
- Annual performance bonus
- Based on current monthly salary
- Percentage varies by performance rating

### Mid-Year Bonus (13th Month)
```javascript
amount = monthly_salary
```
- Fixed at one month's salary
- Typically processed mid-year

### Year-End Bonus (14th Month)
```javascript
amount = monthly_salary
```
- Fixed at one month's salary
- Processed at year-end

### Employee Compensation (EC)
- Manual input by administrator
- Used for special compensations and adjustments

### GSIS Contribution
```javascript
amount = monthly_salary × GSIS_PERCENTAGE
```
- Government Service Insurance System contribution
- Percentage-based calculation

### Loyalty Award
```javascript
amount = 10000 + (additional_5_year_periods × 5000)
```
- ₱10,000 base amount at 10 years of service
- Additional ₱5,000 for every 5 years thereafter
- Example: 20 years = ₱10,000 + (2 × ₱5,000) = ₱20,000

## Error Handling

### Validation Errors
```javascript
{
    success: false,
    error: 'Validation failed',
    details: [
        'Employee ID is required',
        'Amount must be a positive number'
    ]
}
```

### Database Errors
```javascript
{
    success: false,
    error: 'Failed to save compensation benefit record',
    details: 'Duplicate entry for employee_id'
}
```

## Security Considerations

1. **Admin-Only Operations**: All benefit processing requires admin privileges
2. **Audit Trail**: All operations logged with user ID and timestamp
3. **Transaction Safety**: Bulk operations use database transactions
4. **Input Validation**: Comprehensive validation prevents invalid data
5. **Foreign Key Constraints**: Ensures data integrity with employee records

## Performance Optimizations

### Database Indexes
```sql
CREATE INDEX idx_comp_benefit_employee ON comp_benefit_records(employee_id);
CREATE INDEX idx_comp_benefit_type ON comp_benefit_records(benefit_type);
CREATE INDEX idx_comp_benefit_processed ON comp_benefit_records(processed_at);
CREATE INDEX idx_comp_benefit_year ON comp_benefit_records((YEAR(processed_at)));
```

### Query Optimization
- Uses prepared statements for all database operations
- Efficient JOIN operations with employee table
- Pagination implemented with LIMIT/OFFSET
- Filtered queries use appropriate indexes

## Integration Points

### Employee Model Integration
- Foreign key relationship with employees table
- Salary information retrieved from employee records
- Employee search functionality integrated

### Leave Balance Integration (Pending)
- Monetization validation against current leave balances
- Automatic leave balance updates for monetization
- Leave accrual calculations for terminal leave

### Audit System Integration
- All operations logged in audit_logs table
- User tracking for accountability
- Change history for compliance

## Testing

### API Testing Script

A comprehensive API testing script is available at `backend/test-compensation-api.js` that validates:

1. **Server Health**: Verifies the backend server is running and accessible
2. **Route Registration**: Confirms all compensation benefits endpoints are properly registered
3. **Authentication Middleware**: Tests that routes require proper authentication
4. **Model Validation**: Validates the CompensationBenefit model with both valid and invalid data
5. **Service Calculations**: Tests the CompensationBenefitService constants and functionality

#### Running the API Tests

```bash
# From the backend directory
node test-compensation-api.js

# Or from the project root
node backend/test-compensation-api.js
```

#### Test Coverage

The script tests the following endpoints:
- `GET /api/compensation-benefits` - Get all records
- `GET /api/compensation-benefits/statistics` - Get statistics
- `GET /api/compensation-benefits/eligible/PBB` - Get eligible employees
- `GET /api/compensation-benefits/calculate/PBB/1` - Calculate PBB for employee

#### Expected Output

```
🧪 Testing Compensation & Benefits API Endpoints
==================================================

1. Testing Health Endpoint...
✅ Health check passed: OK

2. Testing Compensation Benefits Routes...
   Testing GET /compensation-benefits - Get all records
   ✅ Route exists (401 Unauthorized - expected without auth)

3. Testing Route Registration...
✅ Compensation Benefits routes are properly registered

4. Testing Model Validation...
✅ Model validation works correctly for valid data
✅ Model validation correctly rejects invalid data

5. Testing Service Calculations...
✅ Service constants loaded:
   TLB_FACTOR: 1.0
   PBB_PERCENT: 1.0
   GSIS_PERCENT: 0.09
   LOYALTY_BASE_AMOUNT: 10000

🎉 API Testing Complete!
```

### Unit Testing

For comprehensive unit testing, see the Jest test suite in `backend/tests/compensationBenefits.test.js`.

## Frontend Integration

### TypeScript Types

The frontend includes comprehensive TypeScript definitions in `frontend/src/types/compensation.ts`:

#### Core Interfaces

```typescript
interface CompensationBenefit {
  id: number;
  employee_id: number;
  benefit_type: BenefitType;
  days_used?: number;
  amount: number;
  notes?: string;
  processed_at: string;
  processed_by: number;
  
  // Joined fields from API
  employee_name?: string;
  employee_number?: string;
  processed_by_name?: string;
}

type BenefitType = 
  | 'TERMINAL_LEAVE'
  | 'MONETIZATION'
  | 'PBB'
  | 'MID_YEAR_BONUS'
  | 'YEAR_END_BONUS'
  | 'EC'
  | 'GSIS'
  | 'LOYALTY';
```

#### API Response Types

```typescript
interface CompensationResponse {
  records: CompensationBenefit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BenefitStatistics {
  total_records: number;
  total_amount: number;
  by_benefit_type: Array<{
    benefit_type: BenefitType;
    count: number;
    total_amount: number;
  }>;
  monthly_summary: Array<{
    month: string;
    count: number;
    total_amount: number;
  }>;
  top_employees: Array<{
    employee_id: number;
    employee_name: string;
    total_benefits: number;
    total_amount: number;
  }>;
}
```

#### Request Types

```typescript
interface BulkProcessRequest {
  benefitType: BenefitType;
  employeeIds: number[];
  notes?: string;
}

interface MonetizationRequest {
  employee_id: number;
  days_to_monetize: number;
  notes?: string;
}
```

#### Constants and Labels

```typescript
const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
  TERMINAL_LEAVE: 'Terminal Leave Benefit',
  MONETIZATION: 'Leave Monetization',
  PBB: 'Performance-Based Bonus',
  MID_YEAR_BONUS: '13th Month Bonus',
  YEAR_END_BONUS: '14th Month Bonus',
  EC: 'Employee Compensation',
  GSIS: 'GSIS Contribution',
  LOYALTY: 'Loyalty Award'
};
```

### Type Safety Benefits

1. **Compile-time Validation**: TypeScript catches type mismatches during development
2. **IntelliSense Support**: Enhanced IDE support with autocomplete and documentation
3. **Refactoring Safety**: Type-safe refactoring across the frontend codebase
4. **API Contract Enforcement**: Ensures frontend-backend API compatibility
5. **Developer Experience**: Improved productivity with type hints and error detection

## Future Enhancements

1. **Automated Calculations**: Integration with payroll system for automatic benefit calculations
2. **Approval Workflow**: Multi-level approval process for high-value benefits
3. **Notification System**: Email notifications for processed benefits
4. **Report Generation**: PDF reports for benefit summaries and certificates
5. **Dashboard Analytics**: Real-time benefit statistics and trends
6. **Export Functionality**: CSV/Excel export for accounting integration
7. **Frontend Components**: React components for benefit management UI
8. **Real-time Updates**: WebSocket integration for live benefit processing updates