# Terminal Leave Benefits (TLB) API Documentation

## Overview

The Terminal Leave Benefits (TLB) system automatically tracks total leave credits, highest salary during employment, and employment history to compute terminal leave benefits for employees upon separation from service.

### Formula
```
TLB = Total Leave Credits × Highest Monthly Salary × Constant Factor
```

## API Endpoints

### Base URL: `/api/tlb`

All endpoints require authentication. Admin-only endpoints are marked as such.

---

## Statistics and Calculation Routes

### 1. Get TLB Statistics
**GET** `/api/tlb/statistics`

Get aggregated statistics for TLB records.

**Query Parameters:**
- `year` (optional): Filter by claim date year

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_records": 10,
      "total_computed_amount": 500000.00,
      "total_paid_amount": 300000.00,
      "average_amount": 50000.00,
      "highest_amount": 75000.00,
      "lowest_amount": 25000.00
    },
    "status_breakdown": {
      "computed": 3,
      "approved": 2,
      "paid": 4,
      "cancelled": 1
    }
  }
}
```

### 2. Calculate TLB for Employee
**GET** `/api/tlb/employee/:employeeId/calculation`

Calculate TLB amount for an employee without saving the record.

**Path Parameters:**
- `employeeId`: Employee ID

**Query Parameters:**
- `separationDate` (required): Employee separation date (YYYY-MM-DD)
- `claimDate` (required): TLB claim date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": 1,
      "name": "Juan Dela Cruz",
      "employee_number": "EMP-001",
      "appointment_date": "2020-01-15",
      "plantilla_position": "Administrative Officer III",
      "years_of_service": 4.5
    },
    "calculation": {
      "total_leave_credits": 45.5,
      "highest_monthly_salary": 35000.00,
      "constant_factor": 1.0,
      "computed_amount": 1592500.00,
      "formatted_amount": "₱1,592,500.00"
    },
    "dates": {
      "claim_date": "2024-06-30",
      "separation_date": "2024-06-30"
    }
  }
}
```

### 3. Generate TLB Summary Report **(Admin Only)**
**GET** `/api/tlb/reports/summary`

Generate comprehensive TLB summary report.

**Query Parameters:**
- `year` (optional): Filter by claim date year
- `status` (optional): Filter by status (Computed, Approved, Paid, Cancelled)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": [
      {
        "status": "Paid",
        "record_count": 5,
        "total_amount": 250000.00,
        "average_amount": 50000.00,
        "min_amount": 30000.00,
        "max_amount": 75000.00
      }
    ],
    "details": [
      {
        "id": 1,
        "employee_name": "Juan Dela Cruz",
        "employee_number": "EMP-001",
        "computed_amount": 75000.00,
        "status": "Paid",
        "claim_date": "2024-01-15"
      }
    ],
    "totals": {
      "total_records": 5,
      "total_amount": 250000.00,
      "formatted_total_amount": "₱250,000.00"
    },
    "filters": {
      "year": 2024,
      "status": "Paid"
    }
  }
}
```

---

## CRUD Operations

### 4. Get All TLB Records
**GET** `/api/tlb`

Retrieve TLB records with filtering and pagination.

**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 10, max: 100): Records per page
- `status` (optional): Filter by status
- `employee_id` (optional, admin only): Filter by employee
- `year` (optional): Filter by claim date year
- `search` (optional): Search employee name or number
- `sort_by` (default: claim_date): Sort field
- `sort_order` (default: DESC): Sort direction (ASC/DESC)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employee_id": 1,
      "employee_name": "Juan Dela Cruz",
      "employee_number": "EMP-001",
      "total_leave_credits": 45.5,
      "highest_monthly_salary": 35000.00,
      "constant_factor": 1.0,
      "computed_amount": 1592500.00,
      "claim_date": "2024-06-30",
      "separation_date": "2024-06-30",
      "status": "Computed",
      "processed_by_name": "Admin User",
      "processed_at": "2024-01-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 1,
    "totalRecords": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

### 5. Create TLB Record **(Admin Only)**
**POST** `/api/tlb`

Create a new TLB record for an employee.

**Request Body:**
```json
{
  "employee_id": 1,
  "total_leave_credits": 45.5,
  "highest_monthly_salary": 35000.00,
  "constant_factor": 1.0,
  "claim_date": "2024-06-30",
  "separation_date": "2024-06-30",
  "notes": "Regular retirement"
}
```

**Validation Rules:**
- `employee_id`: Required, positive integer
- `total_leave_credits`: Required, positive number
- `highest_monthly_salary`: Required, positive number
- `constant_factor`: Optional, between 0.1 and 2.0 (default: 1.0)
- `claim_date`: Required, valid ISO date
- `separation_date`: Required, valid ISO date
- `notes`: Optional, max 1000 characters

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employee_id": 1,
    "computed_amount": 1592500.00,
    "status": "Computed",
    "employee_name": "Juan Dela Cruz",
    "employee_number": "EMP-001"
  },
  "message": "TLB record created successfully"
}
```

### 6. Get TLB Record by ID
**GET** `/api/tlb/:id`

Retrieve a specific TLB record by ID.

**Path Parameters:**
- `id`: TLB record ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employee_id": 1,
    "employee_name": "Juan Dela Cruz",
    "employee_number": "EMP-001",
    "plantilla_position": "Administrative Officer III",
    "appointment_date": "2020-01-15",
    "total_leave_credits": 45.5,
    "highest_monthly_salary": 35000.00,
    "constant_factor": 1.0,
    "computed_amount": 1592500.00,
    "claim_date": "2024-06-30",
    "separation_date": "2024-06-30",
    "status": "Computed",
    "check_number": null,
    "payment_date": null,
    "notes": "Regular retirement",
    "processed_by_name": "Admin User",
    "processed_at": "2024-01-15T08:00:00.000Z"
  }
}
```

### 7. Update TLB Record **(Admin Only)**
**PUT** `/api/tlb/:id`

Update an existing TLB record. Typically used to update status, payment details, and notes.

**Path Parameters:**
- `id`: TLB record ID

**Request Body (all fields optional):**
```json
{
  "status": "Paid",
  "check_number": "CHK-2024-001",
  "payment_date": "2024-02-01",
  "notes": "Paid via check number CHK-2024-001"
}
```

**Validation Rules:**
- `status`: Must be one of: Computed, Approved, Paid, Cancelled
- `check_number`: Max 50 characters
- `payment_date`: Valid ISO date
- `notes`: Max 1000 characters

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "Paid",
    "check_number": "CHK-2024-001",
    "payment_date": "2024-02-01",
    "employee_name": "Juan Dela Cruz"
  },
  "message": "TLB record updated successfully"
}
```

### 8. Delete TLB Record **(Admin Only)**
**DELETE** `/api/tlb/:id`

Delete a TLB record. Records with status "Paid" cannot be deleted.

**Path Parameters:**
- `id`: TLB record ID

**Response:**
```json
{
  "success": true,
  "message": "TLB record deleted successfully"
}
```

---

## Status Workflow

TLB records follow this status workflow:

1. **Computed** - Initial status when TLB is calculated
2. **Approved** - Admin approves the computation
3. **Paid** - Payment has been processed
4. **Cancelled** - TLB claim was cancelled

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed: Employee ID is required",
  "timestamp": "2024-01-15T08:00:00.000Z"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "timestamp": "2024-01-15T08:00:00.000Z"
}
```

### 403 Forbidden
```json
{
  "error": "Only administrators can create TLB records",
  "timestamp": "2024-01-15T08:00:00.000Z"
}
```

### 404 Not Found
```json
{
  "error": "TLB record not found",
  "timestamp": "2024-01-15T08:00:00.000Z"
}
```

### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred",
  "timestamp": "2024-01-15T08:00:00.000Z"
}
```

---

## Access Control

- **Employees**: Can view and calculate TLB for their own records only
- **Admins**: Full access to all TLB operations including create, update, delete, and reports

---

## Business Rules

1. Only one TLB record per employee is allowed
2. TLB records with status "Paid" cannot be deleted
3. Total leave credits are calculated from employee leave balances
4. Highest monthly salary is determined from service records or current salary
5. Constant factor is configurable via system settings (default: 1.0)
6. Separation date cannot be before claim date
7. Large computed amounts (>₱1,000,000) generate warnings for verification

---

## Related System Settings

The following system settings affect TLB calculations:

- `tlb_constant_factor`: Multiplication factor for TLB calculation (default: 1.00)