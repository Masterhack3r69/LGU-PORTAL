# Frontend Components Documentation

## Overview

This document provides comprehensive documentation for the React/TypeScript frontend components in the Employee Management System, with a focus on the Compensation & Benefits module components.

## Architecture

### Technology Stack
- **React**: 19.1.1 with TypeScript for type safety
- **UI Library**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks with TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React icon library

### Component Structure
```
frontend/src/components/
├── ui/                     # shadcn/ui base components
│   ├── card.tsx           # Card component
│   ├── button.tsx         # Button component
│   ├── input.tsx          # Input component
│   ├── select.tsx         # Select dropdown component
│   ├── textarea.tsx       # Textarea component
│   ├── badge.tsx          # Badge component
│   ├── checkbox.tsx       # Checkbox component
│   ├── table.tsx          # Table components
│   └── alert.tsx          # Alert component
└── benefits/              # Compensation & Benefits components
    ├── MonetizationPanel.tsx    # Leave monetization interface
    └── BulkProcessingPanel.tsx  # Bulk benefit processing interface
```

## Compensation & Benefits Components

### BulkProcessingPanel

**Location**: `frontend/src/components/benefits/BulkProcessingPanel.tsx`

**Purpose**: Provides a comprehensive interface for processing benefits for multiple employees simultaneously, supporting bulk calculations and processing for various benefit types.

#### Props Interface
```typescript
interface BulkProcessingPanelProps {
  onSuccess: () => void;  // Callback function called after successful processing
}
```

#### Key Features

1. **Benefit Type Selection**
   - Dropdown with bulk-eligible benefit types (PBB, Mid-Year Bonus, Year-End Bonus, GSIS, Loyalty)
   - Dynamic description display for selected benefit type
   - Contextual help text for each benefit type

2. **Employee Management**
   - Loads eligible employees based on selected benefit type
   - Checkbox selection for individual employees
   - Select all/deselect all functionality
   - Employee information display with salary and service years

3. **Bulk Calculations**
   - Calculate benefits for selected employees
   - Real-time total amount calculation
   - Individual calculation results display
   - Calculation status indicators

4. **Bulk Processing**
   - Process multiple benefit records simultaneously
   - Transaction safety for database operations
   - Comprehensive validation before processing
   - Progress indicators and loading states

5. **Professional UI**
   - Table-based employee list with sorting capabilities
   - Card layout for organized information display
   - Badge indicators for calculation status
   - Responsive design for various screen sizes

#### Code Quality Standards
- **Consistent Formatting**: Follows standardized code formatting with proper indentation
- **Import Organization**: Clean import statements with trailing commas for maintainability
- **TypeScript Integration**: Full type safety with proper interface definitions
- **Error Handling**: Comprehensive error handling with user-friendly messages

#### State Management
```typescript
const [selectedBenefitType, setSelectedBenefitType] = useState<BenefitType | "">("");
const [eligibleEmployees, setEligibleEmployees] = useState<EligibleEmployee[]>([]);
const [calculations, setCalculations] = useState<BenefitCalculation[]>([]);
const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());
const [notes, setNotes] = useState("");
const [loading, setLoading] = useState(false);
const [calculating, setCalculating] = useState(false);
const [processing, setProcessing] = useState(false);
```

#### API Integration
- **Eligible Employees**: `compensationService.getEligibleEmployees()`
- **Bulk Calculations**: `compensationService.bulkCalculate()`
- **Bulk Processing**: `compensationService.bulkProcess()`

### MonetizationPanel

**Location**: `frontend/src/components/benefits/MonetizationPanel.tsx`

**Purpose**: Provides a comprehensive interface for processing leave monetization, allowing administrators to convert unused leave days to cash compensation.

#### Props Interface
```typescript
interface MonetizationPanelProps {
  onSuccess: () => void;  // Callback function called after successful processing
}
```

#### Key Features

1. **Employee Selection**
   - Dropdown with all active employees
   - Displays employee name and number for easy identification
   - Loads employees dynamically from the API

2. **Leave Balance Integration**
   - Shows vacation leave, sick leave, and total available balance
   - Validates monetization days against available balance
   - Prevents over-monetization with real-time validation

3. **Real-time Calculations**
   - Calculates monetization amount based on employee's daily rate
   - Updates calculation dynamically as user inputs days
   - Shows detailed breakdown of calculation components

4. **Form Validation**
   - Prevents submission with invalid data
   - Shows validation errors with clear messaging
   - Disables form submission until all requirements are met

5. **Professional UI**
   - Card-based layout for organized information display
   - Loading states for all async operations
   - Progress indicators during processing
   - Success/error toast notifications

#### State Management
```typescript
const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
const [employees, setEmployees] = useState<Employee[]>([]);
const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
const [daysToMonetize, setDaysToMonetize] = useState('');
const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
const [notes, setNotes] = useState('');
const [loading, setLoading] = useState(false);
const [calculating, setCalculating] = useState(false);
const [processing, setProcessing] = useState(false);
```

#### API Integration
- **Employee Loading**: `employeeService.getEmployees()`
- **Benefit Calculation**: `compensationService.calculateBenefit()`
- **Monetization Processing**: `compensationService.processMonetization()`

#### Usage Example
```typescript
import { MonetizationPanel } from '@/components/benefits/MonetizationPanel';

function BenefitsManagementPage() {
  const handleMonetizationSuccess = () => {
    // Refresh benefits list or navigate to success page
    toast.success('Monetization processed successfully');
    // Additional success handling...
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Leave Monetization</h1>
      <MonetizationPanel onSuccess={handleMonetizationSuccess} />
    </div>
  );
}
```

#### Component Sections

1. **Form Section**
   - Employee selection dropdown
   - Days to monetize input field
   - Optional notes textarea
   - Information alert about the process

2. **Employee Information Card**
   - Employee name and number
   - Current monthly salary
   - Calculated daily rate
   - Only shown when employee is selected

3. **Leave Balance Card**
   - Vacation leave balance
   - Sick leave balance
   - Total available balance
   - Only shown when employee is selected

4. **Validation Alert**
   - Shows when days exceed available balance
   - Destructive styling to indicate error
   - Clear error message

5. **Calculation Results Card**
   - Monetization amount prominently displayed
   - Detailed calculation breakdown
   - Remaining balance after monetization
   - Only shown when calculation is valid

6. **Process Button**
   - Large, prominent button for final action
   - Loading state during processing
   - Disabled when form is invalid
   - Success icon when ready

#### Validation Rules

1. **Employee Selection**: Must select a valid employee
2. **Days Input**: Must be greater than 0
3. **Balance Check**: Cannot exceed available leave balance
4. **Calculation**: Must have valid calculated amount before processing

#### Error Handling

- **Network Errors**: Toast notifications for API failures
- **Validation Errors**: Inline validation with clear messages
- **Processing Errors**: User-friendly error messages
- **Loading States**: Proper loading indicators for all async operations

#### Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and focus indicators
- **Color Contrast**: Meets WCAG guidelines for text and background colors

#### Responsive Design

- **Mobile First**: Designed for mobile devices first
- **Breakpoint Adaptation**: Uses Tailwind's responsive utilities
- **Grid Layout**: Responsive grid for cards and form elements
- **Touch Friendly**: Appropriate touch targets for mobile devices

## Type Definitions

### LeaveBalance Interface
```typescript
interface LeaveBalance {
  employee_id: number;
  vacation_balance: number;
  sick_balance: number;
  total_balance: number;
}
```

### Employee Interface (from types/employee.ts)
```typescript
interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  current_monthly_salary?: number;
  // ... other employee properties
}
```

## Service Integration

### CompensationService Methods Used
- `calculateBenefit(type, employeeId)`: Calculate benefit amounts
- `processMonetization(data)`: Process leave monetization
- `formatCurrency(amount)`: Format currency display

### EmployeeService Methods Used
- `getEmployees(options)`: Load employee list with filtering

## Future Enhancements

### Planned Features
1. **Bulk Monetization**: Process multiple employees at once
2. **History View**: Show previous monetization records
3. **Print Support**: Generate printable monetization reports
4. **Advanced Filters**: Filter employees by department, status, etc.
5. **Approval Workflow**: Multi-step approval process for monetization

### Technical Improvements
1. **Caching**: Implement query caching for employee data
2. **Optimistic Updates**: Update UI before API confirmation
3. **Offline Support**: Handle offline scenarios gracefully
4. **Performance**: Virtualization for large employee lists

## Testing

### Component Testing
```typescript
// Example test structure
describe('MonetizationPanel', () => {
  it('should load employees on mount', () => {
    // Test employee loading
  });

  it('should calculate monetization amount correctly', () => {
    // Test calculation logic
  });

  it('should validate days against leave balance', () => {
    // Test validation rules
  });

  it('should process monetization successfully', () => {
    // Test successful processing
  });
});
```

### Integration Testing
- Test with real API endpoints
- Verify data flow between components
- Test error scenarios and edge cases

## Code Quality Standards

### Formatting Consistency
- **Import Statements**: Use trailing commas in import lists for better maintainability
- **Indentation**: Consistent 2-space indentation throughout all components
- **Quote Style**: Standardized double quotes for string literals
- **Line Endings**: Consistent line ending handling across all files

### Recent Improvements
- **BulkProcessingPanel**: Applied consistent formatting standards with proper import organization
- **BenefitStatisticsCards**: Updated console.log formatting to use double quotes for consistency
- **Syntax Standardization**: Fixed import statement formatting with trailing commas
- **Code Readability**: Enhanced code structure with proper spacing and organization
- **Maintainability**: Improved code consistency for easier maintenance and collaboration

## Maintenance

### Code Quality
- Follow TypeScript strict mode guidelines
- Use ESLint and Prettier for consistent formatting
- Implement comprehensive error boundaries
- Maintain proper component documentation
- Apply consistent import statement formatting with trailing commas
- Ensure proper indentation and spacing throughout all components

### Performance Monitoring
- Monitor component render performance
- Track API response times
- Optimize re-renders with React.memo when needed
- Use React DevTools for performance profiling

## Component Testing

### BulkProcessingPanel Testing
```typescript
describe('BulkProcessingPanel', () => {
  it('should load eligible employees when benefit type is selected', () => {
    // Test employee loading based on benefit type
  });

  it('should calculate benefits for selected employees', () => {
    // Test bulk calculation functionality
  });

  it('should process benefits for multiple employees', () => {
    // Test bulk processing workflow
  });

  it('should validate employee selection before processing', () => {
    // Test validation rules
  });
});
```

### MonetizationPanel Testing
```typescript
describe('MonetizationPanel', () => {
  it('should load employees on mount', () => {
    // Test employee loading
  });

  it('should calculate monetization amount correctly', () => {
    // Test calculation logic
  });

  it('should validate days against leave balance', () => {
    // Test validation rules
  });

  it('should process monetization successfully', () => {
    // Test successful processing
  });
});
```

---

**Last Updated**: December 2024  
**Version**: 1.1.0  
**Maintainer**: Development Team

### Recent Updates
- Added BulkProcessingPanel component documentation
- Updated code quality standards and formatting guidelines
- Enhanced component structure documentation
- Improved testing documentation with examples