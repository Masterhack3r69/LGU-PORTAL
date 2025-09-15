# Training System Live Tests

## Quick Start

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Validate system is ready:**
   ```bash
   npm run validate:training
   ```

3. **Run quick test (recommended first):**
   ```bash
   npm run test:training-quick
   ```

4. **Run comprehensive tests:**
   ```bash
   npm run test:training-live
   ```

## Test Files Created

### 1. `validate-training-system.js`
Pre-test validation script that checks:
- ✅ Server health and connectivity  
- ✅ Admin account authentication (deckson/admin123)
- ✅ Employee account authentication (dave/emp123)
- ✅ Training system endpoints accessibility

### 2. `quick-training-test.js`
Fast workflow test (10 steps) that verifies:
- Admin login and authentication
- Training program creation and management
- Training record creation and management  
- Employee training history tracking
- Training statistics generation
- Data filtering and retrieval
- Cleanup and data integrity

### 3. `test-training-live.js`
Comprehensive test suite covering:
- **Training Programs**: Full CRUD operations
- **Training Records**: Complete lifecycle testing
- **Statistics & Reporting**: Data analytics verification
- **Access Control**: Role-based permission testing
- **Validation**: Input validation and error handling
- **Employee Access**: Employee-specific functionality

### 4. `TRAINING_TESTING_GUIDE.md`
Detailed documentation with:
- Complete API endpoint reference
- Database schema information
- Validation rules and constraints
- Access control specifications
- Troubleshooting guide

## Test Accounts

| Role     | Username | Password | Purpose |
|----------|----------|----------|---------|
| Admin    | deckson  | admin123 | Full system access, program management |
| Employee | dave     | emp123   | Employee-level access testing |

## What Gets Tested

### ✅ Training Program Management
- Create, read, update, delete training programs
- Admin-only access control
- Validation of training types and data

### ✅ Training Record Management  
- Employee training record lifecycle
- Role-based data access (employees see only their records)
- Certificate tracking and management

### ✅ Advanced Features
- Training statistics and analytics
- Employee training history
- Search and filtering capabilities
- Pagination and sorting

### ✅ Security & Validation
- Authentication and authorization
- Input validation and sanitization
- Error handling and edge cases

## Expected Output

```
🚀 QUICK TRAINING SYSTEM TEST

📋 STEP 1: Admin Authentication
✅ Admin logged in: Deckson

📋 STEP 2: Create Training Program  
✅ Created program ID: 123

📋 STEP 3: Get Employee for Training
✅ Found employee: Dave Johnson (ID: 456)

📋 STEP 4: Create Training Record
✅ Created training record ID: 789

📋 STEP 5: Verify Training Record
✅ Retrieved: Leadership Skills Development
ℹ️ Employee: Dave Johnson
ℹ️ Program: Quick Test Leadership Program
ℹ️ Certificate: Yes

📋 STEP 6: Check Training Statistics
✅ Total trainings: 1
✅ Total hours: 24
✅ Certificates issued: 1

📋 STEP 7: Employee Training History
✅ Employee has 1 training records
✅ Total training hours: 24.00

📋 STEP 8: Update Training Record
✅ Training record updated successfully

📋 STEP 9: Test Training Filters
✅ Found 1 certified trainings in 2024

📋 STEP 10: Cleanup Test Data
✅ Training record deleted
✅ Training program deleted

🎉 ALL TESTS PASSED! Training system is working correctly.
```

## Troubleshooting

### Server Not Running
```bash
# Make sure server is started
npm run dev
```

### Authentication Errors
- Check that test accounts exist in database
- Verify credentials: deckson/admin123 and dave/emp123

### Database Errors
- Ensure MySQL is running
- Check database schema is up to date
- Run setup scripts if needed: `npm run setup`

### Permission Errors
- Verify admin account has admin role
- Check employee account has employee role

## Integration

These tests can be added to CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Test Training System
  run: |
    npm run validate:training
    npm run test:training-quick
    npm run test:training-live
```

## Manual Testing

For manual API testing, use these endpoints:

**Training Programs:**
- GET `/api/training-programs` - List programs
- POST `/api/training-programs` - Create program (admin)

**Training Records:**  
- GET `/api/trainings` - List trainings with filters
- POST `/api/trainings` - Create training record
- GET `/api/trainings/statistics` - View statistics

All requests require authentication via session cookies.