# Compensation & Benefits API Documentation

## Overview

The Compensation & Benefits API provides a comprehensive system for managing employee benefits such as 13th Month Pay, Performance-Based Bonuses (PBB), Loyalty Awards, Terminal Benefits, and other compensation benefits as outlined in the government compensation framework.

## Architecture

### Database Schema

The system consists of four main tables:

1. **`benefit_types`** - Configuration for different types of benefits
2. **`benefit_cycles`** - Yearly or event-based benefit processing cycles
3. **`benefit_items`** - Individual employee benefit records
4. **`benefit_adjustments`** - Manual adjustments to benefit amounts

### Key Models

- **`BenefitType`** - Defines benefit types with calculation rules
- **`BenefitCycle`** - Manages benefit processing cycles
- **`BenefitItem`** - Individual employee benefit records
- **`BenefitsCalculationService`** - Core calculation engine
- **`BenefitSlipService`** - PDF slip generation

## Predefined Benefit Types

The system comes with the following predefined benefit types:

| Code | Name | Category | Calculation Type | Description |
|------|------|----------|------------------|-------------|
| `MID_YEAR` | 13th Month Pay (Mid-Year Bonus) | Annual | Formula | Mid-year bonus equivalent to 1/12 of annual basic salary |
| `YEAR_END` | 14th Month Pay (Year-End Bonus) | Annual | Formula | Year-end bonus equivalent to 1/12 of annual basic salary |
| `PBB` | Performance-Based Bonus | Performance | Manual | Performance-based bonus for eligible employees |
| `LOYALTY_10` | Loyalty Award - 10 Years | Loyalty | Fixed | ₱10,000 for 10 years of service |
| `LOYALTY_15` | Loyalty Award - 15 Years | Loyalty | Fixed | ₱15,000 for 15 years of service |
| `LOYALTY_20` | Loyalty Award - 20 Years | Loyalty | Fixed | ₱20,000 for 20 years of service |
| `LOYALTY_25` | Loyalty Award - 25 Years | Loyalty | Fixed | ₱25,000 for 25 years of service |
| `TERMINAL` | Terminal Benefit Claims | Terminal | Manual | Terminal benefits for retiring/separating employees |
| `LEAVE_MONETIZE` | Monetization of Leave Credits | Special | Formula | Monetization of accumulated leave credits |
| `EC` | Employee Compensation | Special | Manual | Employee compensation benefit |
| `GSIS_CLAIM` | GSIS Contributions/Claims | Special | Manual | GSIS-related contributions or claims |

## API Endpoints

### Benefit Types Management

```http
GET    /api/benefits/types                    # Get all benefit types
GET    /api/benefits/types/:id                # Get specific benefit type
POST   /api/benefits/types                    # Create benefit type (Admin)
PUT    /api/benefits/types/:id                # Update benefit type (Admin)
POST   /api/benefits/types/:id/toggle         # Toggle active status (Admin)
DELETE /api/benefits/types/:id                # Delete benefit type (Admin)
```

### Benefit Cycles Management

```http
GET    /api/benefits/cycles                   # Get all benefit cycles
GET    /api/benefits/cycles/:id               # Get specific benefit cycle
POST   /api/benefits/cycles                   # Create benefit cycle (Admin)
PUT    /api/benefits/cycles/:id               # Update benefit cycle (Admin)
POST   /api/benefits/cycles/:id/process       # Process benefit cycle (Admin)
POST   /api/benefits/cycles/:id/finalize      # Finalize benefit cycle (Admin)
POST   /api/benefits/cycles/:id/release       # Release benefit cycle (Admin)
POST   /api/benefits/cycles/:id/cancel        # Cancel benefit cycle (Admin)
DELETE /api/benefits/cycles/:id               # Delete benefit cycle (Admin)
```

### Benefit Cycle Processing

```http
GET    /api/benefits/cycles/:cycleId/items    # Get benefit items for cycle
POST   /api/benefits/cycles/:cycleId/calculate # Calculate benefits for cycle (Admin)
```

### Benefit Items Management

```http
GET    /api/benefits/items                    # Get all benefit items
GET    /api/benefits/items/:id                # Get specific benefit item
PUT    /api/benefits/items/:id                # Update benefit item (Admin)
POST   /api/benefits/items/:id/approve        # Approve benefit item (Admin)
POST   /api/benefits/items/:id/mark-paid      # Mark as paid (Admin)
POST   /api/benefits/items/:id/adjustment     # Add adjustment (Admin)
POST   /api/benefits/items/:id/generate-slip  # Generate benefit slip
```

### Bulk Operations

```http
POST   /api/benefits/items/bulk-approve       # Bulk approve items (Admin)
POST   /api/benefits/items/bulk-mark-paid     # Bulk mark as paid (Admin)
POST   /api/benefits/items/bulk-generate-slips # Bulk generate slips (Admin)
```

### Employee-Specific Routes

```http
GET    /api/benefits/employees/:employeeId/items # Get employee benefit items
```

### Utility Routes

```http
GET    /api/benefits/types/:benefitTypeId/eligible-employees # Get eligible employees (Admin)
POST   /api/benefits/types/:benefitTypeId/preview            # Preview calculation (Admin)
GET    /api/benefits/statistics                              # Get benefit statistics
```

## Workflow Implementation

### 1. Define Benefit Types (Admin)

Benefit types are pre-configured but can be modified:

```javascript
// Example: Update 13th Month Pay calculation
PUT /api/benefits/types/1
{
  "calculation_formula": "basic_salary / 12 * (service_months / 12)",
  "is_prorated": true,
  "minimum_service_months": 4
}
```

### 2. Create Benefit Cycle

```javascript
// Example: Create 2024 Mid-Year Bonus cycle
POST /api/benefits/cycles
{
  "benefit_type_id": 1,
  "cycle_year": 2024,
  "cycle_name": "2024 Mid-Year Bonus",
  "applicable_date": "2024-06-30",
  "payment_date": "2024-07-15",
  "cutoff_date": "2024-06-30"
}
```

### 3. Select Employees & Calculate

```javascript
// Calculate benefits for all eligible employees
POST /api/benefits/cycles/1/calculate
{
  // Optional: specify employee_ids for selective calculation
  "employee_ids": [1, 2, 3]
}
```

### 4. Review & Adjustments

```javascript
// Add manual adjustment to benefit item
POST /api/benefits/items/1/adjustment
{
  "adjustment_type": "Increase",
  "amount": 500.00,
  "reason": "Special recognition bonus",
  "description": "Additional amount for exceptional performance"
}
```

### 5. Finalization & Release

```javascript
// Process cycle (move to Processing status)
POST /api/benefits/cycles/1/process

// Finalize cycle (move to Completed status)
POST /api/benefits/cycles/1/finalize

// Release cycle (move to Released status)
POST /api/benefits/cycles/1/release
```

### 6. Bulk Operations

```javascript
// Bulk approve benefit items
POST /api/benefits/items/bulk-approve
{
  "item_ids": [1, 2, 3, 4, 5]
}

// Bulk mark as paid
POST /api/benefits/items/bulk-mark-paid
{
  "item_ids": [1, 2, 3, 4, 5],
  "payment_reference": "BATCH_2024_001"
}
```

### 7. Generate Benefit Slips

```javascript
// Generate individual benefit slip
POST /api/benefits/items/1/generate-slip
// Returns PDF file

// Bulk generate slips
POST /api/benefits/items/bulk-generate-slips
{
  "item_ids": [1, 2, 3, 4, 5]
}
```

## Calculation Formulas

### 13th Month Pay
```
Amount = (Basic Salary / 12) × (Service Months / 12)
```

### Loyalty Awards
- 10 Years: ₱10,000 (Fixed)
- 15 Years: ₱15,000 (Fixed)
- 20 Years: ₱20,000 (Fixed)
- 25 Years: ₱25,000 (Fixed)

### Leave Monetization
```
Amount = Daily Rate × Number of Leave Days
```

### Performance Bonus
```
Amount = Base Amount × Performance Rating
```

## Status Workflow

### Benefit Cycle Status Flow
```
Draft → Processing → Completed → Released
          ↓
      Cancelled
```

### Benefit Item Status Flow
```
Draft → Calculated → Approved → Paid
          ↓           ↓
      Cancelled   Cancelled
```

## Error Handling

All API endpoints return standardized error responses:

```javascript
{
  "success": false,
  "error": "Error message",
  "details": ["Detailed error information"],
  "timestamp": "2024-09-21T10:30:00.000Z"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Authentication & Authorization

### Required Permissions

- **Admin Users**: Full access to all benefit operations
- **Employee Users**: Read access to own benefit records only

### Middleware

- `requireAuth` - Authentication required for all routes
- `requireAdmin` - Admin privileges required for management operations
- `requireEmployeeAccess` - Allow employees to access their own records
- `auditLogger` - Comprehensive audit logging for all operations

## Database Setup

### Installation

1. Run the benefits setup script:
```bash
node scripts/benefits-setup.js
```

2. Verify installation:
```bash
node scripts/test-benefits-api.js
```

### Manual SQL Setup

Alternatively, execute the SQL schema:
```bash
mysql -u username -p database_name < scripts/benefits_schema.sql
```

## Integration with Existing Payroll

The Benefits system is designed to complement the existing payroll system:

- **Separate Cycles**: Benefits have their own cycles independent of payroll periods
- **Slip Generation**: Benefit slips are generated separately from payslips
- **Audit Integration**: All benefit operations are logged in the same audit system
- **Employee Integration**: Benefits use the same employee records as payroll

## Reporting & Analytics

### Available Statistics

```javascript
GET /api/benefits/statistics
{
  "total_items": 150,
  "eligible_count": 140,
  "ineligible_count": 10,
  "total_amount": 2500000.00,
  "average_benefit_amount": 17857.14,
  "draft_count": 0,
  "calculated_count": 5,
  "approved_count": 100,
  "paid_count": 45,
  "cancelled_count": 0
}
```

### Future Reporting Features

The following endpoints are placeholders for future implementation:
- `GET /api/benefits/reports/cycle/:id` - Cycle-specific reports
- `GET /api/benefits/reports/employee/:employeeId` - Employee benefit history
- `GET /api/benefits/reports/summary` - Comprehensive benefit summaries

## Security Features

### Audit Logging
- All CRUD operations are logged with user details
- Before/after values for updates
- IP address and user agent tracking
- Timestamp and action tracking

### Data Validation
- Comprehensive input validation
- Business rule enforcement
- Duplicate prevention
- Status transition validation

### Access Control
- Role-based permissions
- Employee data isolation
- Admin-only operations
- Session management

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried columns
- Efficient pagination implementation
- Query optimization for large datasets
- Connection pooling

### Caching Strategy
- Benefit type configurations can be cached
- Employee eligibility results cacheable
- Statistics can be cached with TTL

### Bulk Operations
- Optimized bulk processing for large employee sets
- Transaction management for data consistency
- Progress tracking for long-running operations

## Testing

### Test Coverage
- Model validation tests
- Calculation engine tests
- Database integration tests
- API endpoint tests
- End-to-end workflow tests

### Running Tests
```bash
# Run comprehensive API tests
node scripts/test-benefits-api.js

# Expected output: 100% success rate
```

## Deployment Notes

### Environment Variables
```bash
# Add to .env file
COMPANY_NAME="Your Organization Name"
COMPANY_ADDRESS="Organization Address"
COMPANY_CONTACT="Contact Information"
```

### Dependencies
- Express.js for routing
- MySQL for database
- PDFKit for slip generation
- Express-validator for validation

### Production Considerations
- Enable SSL/TLS for API endpoints
- Configure proper backup strategies
- Set up monitoring and alerting
- Implement rate limiting
- Configure log rotation

## Support & Maintenance

### Logs Location
- Application logs: `./logs/`
- Audit logs: Database `audit_logs` table
- Benefit slips: `./uploads/benefit-slips/`

### Common Maintenance Tasks
- Regular database backups
- Archive old benefit cycles
- Clean up generated slip files
- Monitor audit logs for anomalies
- Update benefit calculation formulas as needed

---

## Conclusion

The Compensation & Benefits API provides a complete solution for managing government employee benefits according to the specified workflow. The system is designed for scalability, auditability, and ease of use while maintaining strict data integrity and security standards.

For technical support or feature requests, please refer to the development team or create issues in the project repository.