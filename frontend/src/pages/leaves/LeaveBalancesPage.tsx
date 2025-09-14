import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLeaveBalances from '@/components/leaves/AdminLeaveBalances';
import EmployeeLeaveBalance from '@/components/leaves/EmployeeLeaveBalance';

export const LeaveBalancesPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminLeaveBalances />;
  }

  return <EmployeeLeaveBalance employeeId={user?.employee_id || 0} />;
};