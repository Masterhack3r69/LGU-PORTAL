# Breadcrumb Navigation System

This document describes the dynamic breadcrumb navigation system implemented for the EMS (Employee Management System).

## Overview

The breadcrumb system provides contextual navigation that shows users their current location within the application hierarchy and allows them to navigate back to parent pages.

## Components

### 1. `useBreadcrumbs` Hook (`/src/hooks/useBreadcrumbs.ts`)

A custom React hook that generates breadcrumb items based on the current route and user role.

**Features:**
- **Dynamic Route Parsing**: Automatically generates breadcrumbs from the current URL path
- **Role-based Labels**: Adjusts breadcrumb labels based on user role (admin/employee)
- **Smart Path Handling**: Handles special cases like numeric IDs, edit routes, and nested paths
- **Context Awareness**: Different breadcrumb behavior for different sections

**Route Mappings:**
```typescript
const routeLabels = {
  // Main sections
  'employees': 'Employee Management',
  'leaves': 'Leave Management', 
  'training': 'Training Management',
  'payroll': 'Payroll Management',
  'my-payroll': 'My Payroll',
  'benefits': 'Benefits',
  'compensation': 'Compensation',
  'tlb': 'Terminal Leave Benefits',
  'profile': 'Profile',
  'admin': 'Administration',
  'settings': 'Settings',
  'reports': 'Reports',
  'documents': 'Documents',
  
  // Sub-sections
  'new': 'Add New',
  'edit': 'Edit',
  'employee': 'Employee View',
  'applications': 'Applications',
  'balances': 'Leave Balances',
  'approvals': 'Leave Approvals',
  'types': 'Leave Types',
  'audit': 'Audit Logs',
  'document-types': 'Document Types',
};\n```

### 2. `DynamicBreadcrumb` Component (`/src/components/DynamicBreadcrumb.tsx`)

A React component that renders the breadcrumb navigation using shadcn/ui components.

**Features:**
- **Responsive Design**: Shows full breadcrumbs on desktop, truncated on mobile
- **Smart Truncation**: Uses dropdown menu for middle items when breadcrumb trail is long
- **Accessible Navigation**: Proper ARIA labels and keyboard navigation
- **Visual Hierarchy**: Clear visual distinction between clickable links and current page

**Responsive Behavior:**
- **Desktop**: Shows full breadcrumb trail with all intermediate steps
- **Mobile**: Shows first item (Dashboard) and current page, with dropdown for middle items
- **Truncation**: When more than 3 items, middle items are collapsed into a dropdown menu

### 3. Integration in `DashboardLayout`

The breadcrumb system is integrated into the main dashboard layout, appearing in the header below the sidebar trigger.

## Usage Examples

### Basic Navigation
```
Dashboard > Employee Management
Dashboard > Leave Management > Applications
Dashboard > Training Management > Employee View
```

### Edit Routes
```
Dashboard > Employee Management > Edit
Dashboard > Leave Management > Leave Types > Edit
```

### Admin vs Employee Views
**Admin:**
```
Dashboard > Employee Management > All Employees
Dashboard > Administration > Audit Logs
```

**Employee:**
```
Dashboard > Employees > All Employees
Dashboard > My Payroll
```

## Route Handling Patterns

### 1. Main Section Routes
- `/employees` → Dashboard > Employee Management
- `/leaves` → Dashboard > Leave Management
- `/training` → Dashboard > Training Management

### 2. Nested Routes
- `/employees/new` → Dashboard > Employee Management > Add New
- `/leaves/applications` → Dashboard > Leave Management > Applications
- `/admin/audit` → Dashboard > Administration > Audit Logs

### 3. Dynamic Routes with IDs
- `/employees/123/edit` → Dashboard > Employee Management > Edit
- Numeric IDs are automatically filtered out of breadcrumbs

### 4. Role-specific Routes
- **Employee accessing `/leaves/employee`**: Dashboard > Leave Management > Employee View
- **Admin accessing `/leaves`**: Dashboard > Leave Management

## Technical Implementation

### Hook Architecture
```typescript
export interface BreadcrumbItem {
  label: string;      // Display text
  href?: string;      // Navigation link (undefined for current page)
  current?: boolean;  // Whether this is the current page
}

export function useBreadcrumbs(): BreadcrumbItem[]
```

### Key Features

1. **Path Segmentation**: Splits URL path and processes each segment
2. **Conditional Logic**: Different handling for different route patterns
3. **Role Awareness**: Uses `useAuth` to adjust labels based on user role
4. **Memoization**: Uses `useMemo` to prevent unnecessary recalculations

### Component Architecture

The `DynamicBreadcrumb` component handles:
- **Single Item**: Special case for dashboard-only breadcrumb
- **Multiple Items**: Full breadcrumb trail with responsive behavior
- **Truncation**: Dropdown menu for long breadcrumb trails
- **Accessibility**: Proper ARIA labels and screen reader support

## Styling

The breadcrumb uses shadcn/ui components with consistent styling:
- **Text Color**: Muted foreground for links, foreground for current page
- **Hover Effects**: Smooth transitions on link hover
- **Responsive Design**: Hidden/visible classes for different screen sizes
- **Icon Integration**: ChevronRight separators and ellipsis for dropdown

## Accessibility Features

- **ARIA Labels**: Proper `aria-label` for navigation landmark
- **Current Page**: `aria-current=\"page\"` for current breadcrumb item
- **Screen Reader**: Hidden text for better screen reader experience
- **Keyboard Navigation**: Full keyboard support for all interactive elements

## Future Enhancements

Potential improvements for the breadcrumb system:

1. **Custom Labels**: Support for page-specific custom breadcrumb labels
2. **Query Parameter Handling**: Include relevant query parameters in breadcrumbs
3. **Breadcrumb Actions**: Support for actions like \"Back\" or \"Home\"
4. **Theme Integration**: Better integration with system theme and dark mode
5. **Performance**: Further optimization for large applications

## Testing

To test the breadcrumb system:

1. Navigate to different pages in the application
2. Verify breadcrumbs update correctly for each route
3. Test responsive behavior on mobile devices
4. Verify role-based label changes
5. Test accessibility with screen readers and keyboard navigation

The breadcrumb system should provide intuitive navigation that helps users understand their location in the application hierarchy and easily navigate to parent sections.