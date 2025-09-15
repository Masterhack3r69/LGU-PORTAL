import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const { user } = useAuth();

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Dashboard for non-dashboard routes
    const shouldShowDashboard = location.pathname !== '/dashboard' && location.pathname !== '/';
    if (shouldShowDashboard) {
      breadcrumbs.push({
        label: 'Dashboard',
        href: '/dashboard',
      });
    }

    // Helper function to get route labels
    const getRouteLabel = (segment: string): string => {
      const routeLabels: Record<string, string> = {
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
      };

      return routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    };

    // Special case: if we're on dashboard, just show Dashboard as current
    if (location.pathname === '/dashboard' || location.pathname === '/') {
      return [{
        label: 'Dashboard',
        current: true,
      }];
    }

    // Build breadcrumbs based on path segments
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip dashboard as it's already handled
      if (segment === 'dashboard') {
        return;
      }

      const isLast = index === pathSegments.length - 1;
      const previousSegment = index > 0 ? pathSegments[index - 1] : '';
      const nextSegment = index < pathSegments.length - 1 ? pathSegments[index + 1] : '';
      
      // Handle special route patterns
      
      // Skip numeric IDs in breadcrumbs but handle edit routes
      if (!isNaN(Number(segment))) {
        if (nextSegment === 'edit') {
          // We'll handle this in the next iteration
          return;
        }
        // Skip numeric segments
        return;
      }
      
      // Handle edit routes with IDs
      if (segment === 'edit' && previousSegment && !isNaN(Number(previousSegment))) {
        breadcrumbs.push({
          label: 'Edit',
          current: isLast,
        });
        return;
      }

      // Handle employee views in different contexts
      if (segment === 'employee') {
        if (previousSegment === 'leaves') {
          breadcrumbs.push({
            label: 'Employee View',
            current: isLast,
          });
          return;
        }
        if (previousSegment === 'training') {
          breadcrumbs.push({
            label: 'Employee View',
            current: isLast,
          });
          return;
        }
      }

      const label = getRouteLabel(segment);
      
      // Determine if this should be a link or current page
      let href = undefined;
      if (!isLast) {
        // Make parent sections clickable
        if (['employees', 'leaves', 'training', 'payroll', 'admin'].includes(segment)) {
          href = currentPath;
        }
      }
      
      breadcrumbs.push({
        label,
        href,
        current: isLast,
      });
    });

    // Role-specific adjustments
    if (user?.role === 'employee') {
      // For employees, adjust some labels
      breadcrumbs.forEach(breadcrumb => {
        if (breadcrumb.label === 'Employee Management') {
          breadcrumb.label = 'Employees';
        }
      });
    }

    return breadcrumbs;
  }, [location.pathname, user?.role]);
}