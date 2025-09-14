# Leave Management System - Frontend Implementation

## Overview

This document provides a comprehensive overview of the newly implemented Leave Management System frontend for the Employee Management System (EMS). The system follows Role-Based Access Control (RBAC) principles and provides different functionality for administrators and employees.

## Features Implemented

### 🔐 Role-Based Access Control (RBAC)

#### For Employees:
- **View Personal Leave Balance**: See their current leave balances by type
- **Request Leave**: Submit new leave applications with validation
- **Manage Applications**: Edit or delete pending leave requests
- **Calendar View**: Visual calendar for leave planning
- **Application History**: View all past and current leave applications

#### For Administrators:
- **View All Applications**: See all employee leave applications
- **Approve/Reject Requests**: Process pending leave applications
- **Manage Leave Balances**: View and manage employee leave balances
- **Leave Types Management**: Create and configure different leave types
- **Employee Balance Management**: Initialize and adjust employee balances
- **Analytics Dashboard**: View leave statistics and reports

## Architecture

### Component Structure

```
frontend/src/
├── components/
│   ├── leaves/
│   │   ├── AdminLeaveManagement.tsx          # Main admin interface
│   │   ├── AdminLeaveApplications.tsx        # Admin application view
│   │   ├── AdminLeaveApprovals.tsx          # Pending approvals
│   │   ├── AdminLeaveBalances.tsx           # Balance management
│   │   ├── AdminLeaveTypes.tsx              # Leave type configuration
│   │   ├── EmployeeLeaveManagement.tsx      # Main employee interface
│   │   ├── EmployeeLeaveApplications.tsx    # Employee applications
│   │   ├── EmployeeLeaveBalance.tsx         # Employee balance view
│   │   ├── LeaveApplicationForm.tsx         # New application form
│   │   ├── LeaveCard.tsx                    # Application display card
│   │   └── LeaveBalanceCard.tsx             # Balance display card
│   └── ui/
│       ├── date-picker.tsx                  # Custom date picker component
│       ├── calendar.tsx                     # Calendar component (shadcn/ui)
│       ├── popover.tsx                      # Popover component (shadcn/ui)
│       ├── progress.tsx                     # Progress bar component (shadcn/ui)
│       └── switch.tsx                       # Toggle switch component (shadcn/ui)
├── pages/
│   └── leaves/
│       ├── LeaveManagementPage.tsx          # Main leave page router
│       ├── LeaveApplicationsPage.tsx        # Applications page
│       ├── LeaveBalancesPage.tsx            # Balances page
│       ├── LeaveApprovalsPage.tsx           # Approvals page (admin-only)
│       └── LeaveTypesPage.tsx               # Leave types page (admin-only)
├── services/
│   └── leaveService.ts                      # API service layer
└── types/
    └── leave.ts                             # TypeScript type definitions
```

### Routing Structure

```
/leaves
├── /                                        # Main leave management (role-based)
├── /applications                            # Leave applications list
├── /balances                                # Leave balances view
├── /approvals                               # Pending approvals (admin-only)
└── /types                                   # Leave types management (admin-only)
```

## Key Components

### 1. Leave Application Form (`LeaveApplicationForm.tsx`)

Features:
- **Real-time Validation**: Validates leave requests against business rules
- **Date Picker Integration**: Custom date picker with working days calculation
- **Leave Type Selection**: Dropdown with available leave types
- **Working Days Calculation**: Automatically calculates working days excluding weekends and holidays
- **Balance Checking**: Warns users about insufficient balance

### 2. Admin Leave Management (`AdminLeaveManagement.tsx`)

Provides tabbed interface with:
- **Applications Tab**: View all leave applications with filters
- **Approvals Tab**: Quick approval/rejection of pending requests
- **Balances Tab**: Employee balance management and adjustment
- **Types Tab**: Leave type configuration and policy management

### 3. Employee Leave Management (`EmployeeLeaveManagement.tsx`)

Features:
- **Dashboard Stats**: Personal leave statistics
- **Application Management**: Create, edit, delete personal applications
- **Balance Overview**: Current balance with utilization tracking
- **Calendar Integration**: Visual leave calendar for planning

### 4. Custom Date Picker (`date-picker.tsx`)

Enhanced date picker with:
- **Popover Interface**: Clean, accessible date selection
- **Custom Validation**: Disable past dates, weekends, holidays
- **Flexible Configuration**: Customizable placeholders and validation
- **Accessibility**: Full keyboard navigation support

## API Integration

### Service Layer (`leaveService.ts`)

Comprehensive API integration including:

#### Leave Types
- `getLeaveTypes()`: Fetch all leave types
- `createLeaveType()`: Create new leave type
- `updateLeaveType()`: Update existing leave type

#### Leave Applications
- `getLeaveApplications()`: Fetch applications with filtering
- `createLeaveApplication()`: Submit new application
- `updateLeaveApplication()`: Edit existing application
- `approveLeaveApplication()`: Approve application (admin)
- `rejectLeaveApplication()`: Reject application (admin)
- `cancelLeaveApplication()`: Cancel application (employee)

#### Leave Balances
- `getLeaveBalances()`: Fetch employee balances
- `initializeBalances()`: Initialize balances for new employee
- `updateLeaveBalance()`: Adjust employee balances

#### Validation & Analytics
- `validateLeaveApplication()`: Validate application before submission
- `calculateWorkingDays()`: Calculate working days between dates
- `getDashboardStats()`: Get leave statistics
- `getLeaveStatistics()`: Get comprehensive leave analytics

## TypeScript Types

Comprehensive type definitions in `leave.ts`:

### Core Types
- `LeaveType`: Leave type configuration
- `LeaveBalance`: Employee leave balance tracking
- `LeaveApplication`: Leave request data
- `LeaveValidationResult`: Validation response

### Form DTOs
- `CreateLeaveApplicationDTO`: New application data
- `UpdateLeaveApplicationDTO`: Application updates
- `ApproveLeaveDTO`: Approval data
- `RejectLeaveDTO`: Rejection with notes

### Analytics Types
- `DashboardStats`: Dashboard statistics
- `LeaveStatistics`: Comprehensive analytics
- `UsageAnalytics`: Usage patterns
- `BalanceUtilization`: Balance utilization data

## UI/UX Features

### Design System
- **Consistent Components**: Uses shadcn/ui design system
- **Responsive Design**: Mobile-first responsive layout
- **Accessibility**: WCAG compliant components
- **Dark Mode Support**: Built-in theme switching

### User Experience
- **Progressive Enhancement**: Works without JavaScript
- **Real-time Feedback**: Instant validation and feedback
- **Loading States**: Proper loading indicators
- **Error Handling**: Comprehensive error messaging
- **Success Feedback**: Toast notifications for actions

### Visual Elements
- **Status Badges**: Color-coded application statuses
- **Progress Bars**: Visual balance utilization
- **Statistics Cards**: Dashboard metrics display
- **Calendar Integration**: Visual leave planning

## Installation & Setup

### Prerequisites
- Node.js 18+
- React 19+
- TypeScript 5+

### Dependencies Added
```bash
npm install @radix-ui/react-popover @radix-ui/react-calendar react-day-picker
npx shadcn@latest add calendar popover progress switch
```

### Key Dependencies
- **@radix-ui/react-***: Accessible component primitives
- **react-day-picker**: Advanced calendar functionality
- **date-fns**: Date manipulation utilities
- **zod**: Runtime type validation
- **react-hook-form**: Form state management

## Configuration

### Date Picker Configuration
The date picker supports various configuration options:
```typescript
<DatePicker
  value={date}
  onChange={setDate}
  disabled={(date) => date < new Date()}
  placeholder="Select date"
  label="Start Date"
  required
/>
```

### Leave Validation
Applications are validated in real-time:
- **Balance Checking**: Ensures sufficient leave balance
- **Business Rules**: Validates against leave policies
- **Date Validation**: Prevents invalid date selections
- **Working Days**: Calculates excluding weekends/holidays

## Security Considerations

### Role-Based Access
- **Route Protection**: Protected routes based on user role
- **Component-Level Security**: Role-based component rendering
- **API Authorization**: Backend API authorization
- **Data Isolation**: Users see only authorized data

### Input Validation
- **Client-Side Validation**: Immediate feedback
- **Server-Side Validation**: Backend validation
- **Type Safety**: TypeScript compile-time checks
- **Sanitization**: Input sanitization

## Future Enhancements

### Planned Features
1. **Email Notifications**: Automated leave notifications
2. **Mobile App**: React Native mobile application
3. **Advanced Analytics**: Predictive leave analytics
4. **Integration**: Calendar system integration
5. **Workflow**: Advanced approval workflows

### Technical Improvements
1. **Caching**: Implement API response caching
2. **Offline Support**: PWA with offline capabilities
3. **Real-time Updates**: WebSocket integration
4. **Performance**: Code splitting and lazy loading

## Testing

### Test Coverage
- Unit tests for components
- Integration tests for API services
- E2E tests for user workflows
- Accessibility testing

### Testing Framework
```bash
npm test                # Run unit tests
npm run test:e2e       # Run E2E tests
npm run test:coverage  # Generate coverage report
```

## Deployment

### Build Process
```bash
npm run build          # Production build
npm run preview        # Preview production build
```

### Environment Configuration
- Development: `http://localhost:5173`
- Staging: Configure staging environment
- Production: Configure production environment

## Support

For technical support or questions about the leave management system:

1. **Documentation**: Refer to component JSDoc comments
2. **API Documentation**: Backend API documentation
3. **Type Definitions**: TypeScript types in `src/types/`
4. **Component Examples**: Example usage in component files

## Conclusion

The Leave Management System provides a comprehensive, user-friendly interface for managing employee leave requests. With its role-based access control, real-time validation, and responsive design, it offers a modern solution for leave management needs.

The system is built with scalability and maintainability in mind, using industry-standard practices and technologies. The component-based architecture allows for easy extension and customization to meet specific organizational requirements.