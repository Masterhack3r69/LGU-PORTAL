# Training and Development System Testing Guide

## Overview
This document describes the live testing scripts for the Training and Development System in the Employee Management System (EMS).

## Test Scripts

### 1. Comprehensive Live Test (`test-training-live.js`)
A complete end-to-end test suite that verifies all training system functionality.

**Features Tested:**
- Training Program Management (CRUD operations)
- Training Record Management (CRUD operations)
- Employee Training History
- Training Statistics and Reporting
- Role-based Access Control
- Data Validation and Error Handling
- Pagination and Filtering

**Test Accounts:**
- **Admin**: username=`deckson`, password=`admin123`
- **Employee**: username=`dave`, password=`emp123`

**Usage:**
```bash
# Run comprehensive tests
npm run test:training-live

# Or directly
node test-training-live.js
```

### 2. Quick Workflow Test (`quick-training-test.js`)
A focused test that verifies the core training workflow in 10 simple steps.

**Workflow Tested:**
1. Admin Authentication
2. Create Training Program
3. Get Employee for Training
4. Create Training Record
5. Verify Training Record
6. Check Training Statistics
7. Employee Training History
8. Update Training Record
9. Test Training Filters
10. Cleanup Test Data

**Usage:**
```bash
# Run quick test
npm run test:training-quick

# Or directly
node quick-training-test.js
```

## System Components Tested

### Training Programs (`/api/training-programs`)
- **GET** `/api/training-programs` - List all training programs
- **GET** `/api/training-programs/:id` - Get specific program
- **POST** `/api/training-programs` - Create new program (admin only)
- **PUT** `/api/training-programs/:id` - Update program (admin only)
- **DELETE** `/api/training-programs/:id` - Delete program (admin only)

### Training Records (`/api/trainings`)
- **GET** `/api/trainings` - List training records with filtering
- **GET** `/api/trainings/:id` - Get specific training record
- **POST** `/api/trainings` - Create new training record
- **PUT** `/api/trainings/:id` - Update training record
- **DELETE** `/api/trainings/:id` - Delete training record
- **GET** `/api/trainings/employee/:employeeId` - Get employee training history
- **GET** `/api/trainings/statistics` - Get training statistics

### Filtering Options
The system supports advanced filtering:
- `employee_id` - Filter by employee
- `training_program_id` - Filter by training program
- `training_type` - Filter by type (Internal, External, Online, Seminar, Workshop)
- `start_date` / `end_date` - Date range filtering
- `year` - Filter by year
- `search` - Search in titles and employee names
- `certificate_issued` - Filter by certification status
- `page` / `limit` - Pagination
- `sort_by` / `sort_order` - Sorting

## Database Schema

### Training Programs Table (`training_programs`)
```sql
CREATE TABLE training_programs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_hours INT,
    training_type ENUM('Internal', 'External', 'Online', 'Seminar', 'Workshop') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Employee Trainings Table (`employee_trainings`)
```sql
CREATE TABLE employee_trainings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    training_program_id INT,
    training_title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_hours DECIMAL(5,2),
    venue VARCHAR(255),
    organizer VARCHAR(255),
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (training_program_id) REFERENCES training_programs(id)
);
```

## Validation Rules

### Training Programs
- `title`: Required, max 255 characters
- `training_type`: Required, must be one of: Internal, External, Online, Seminar, Workshop
- `duration_hours`: Optional, 0-999 hours
- `description`: Optional, max 1000 characters

### Training Records
- `employee_id`: Required, valid employee ID
- `training_title`: Required, max 255 characters
- `start_date`: Required, valid ISO date
- `end_date`: Required, valid ISO date, must be >= start_date
- `duration_hours`: Optional, 0-999.99 hours
- `venue`: Optional, max 255 characters
- `organizer`: Optional, max 255 characters
- `certificate_number`: Optional, max 100 characters

## Access Control

### Admin Users
- Full CRUD access to training programs
- Full CRUD access to all training records
- Can view all employees' training data
- Can view system-wide training statistics

### Employee Users
- Read-only access to training programs
- Can create/update/delete their own training records only
- Can view their own training history and statistics
- Cannot access other employees' training data

## Error Handling

The system includes comprehensive error handling:
- **400 Bad Request**: Validation errors, invalid data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: System errors

## Testing Prerequisites

1. **Database Setup**: Ensure MySQL database is running with proper schema
2. **Server Running**: Backend server must be running on `http://localhost:3000`
3. **Test Accounts**: Both admin and employee test accounts must exist
4. **Dependencies**: Ensure `axios` and `colors` packages are installed

## Running the Tests

### Start the Backend Server
```bash
cd backend
npm install
npm run dev
```

### Run Comprehensive Tests
```bash
npm run test:training-live
```

### Run Quick Test
```bash
npm run test:training-quick
```

## Expected Test Output

### Successful Test Run
```
🧪 TRAINING AND DEVELOPMENT SYSTEM LIVE TESTS 🧪
Testing against: http://localhost:3000/api
Timestamp: 2024-01-15T10:30:00.000Z

============================================================
ADMIN LOGIN TEST
============================================================
ℹ️ POST /auth/login
✅ 200 OK
✅ Admin login successful

============================================================
TRAINING PROGRAMS MANAGEMENT TESTS
============================================================
ℹ️ Creating training programs...
✅ Created program: Leadership Development Program
✅ Created program: Technical Skills Workshop
...

🎉 All training system tests completed successfully!
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure backend server is running
2. **Authentication Failed**: Check test account credentials
3. **Database Errors**: Verify database schema and connections
4. **Permission Denied**: Ensure test accounts have correct roles

### Debug Mode
Add debug logging to see detailed request/response data:
```bash
DEBUG=* node test-training-live.js
```

## Test Data Cleanup

Both test scripts automatically clean up test data created during execution. If tests are interrupted, you may need to manually clean up:

```sql
-- Remove test training records
DELETE FROM employee_trainings WHERE training_title LIKE '%Test%';

-- Remove test training programs  
DELETE FROM training_programs WHERE title LIKE '%Test%';
```

## Integration with CI/CD

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Training System Tests
  run: |
    npm run test:training-quick
    npm run test:training-live
```

## Conclusion

These test scripts provide comprehensive verification of the Training and Development System functionality, ensuring all components work correctly and securely. The tests cover both happy path scenarios and error conditions, providing confidence in the system's reliability.