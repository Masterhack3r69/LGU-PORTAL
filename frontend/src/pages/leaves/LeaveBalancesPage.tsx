import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLeaveBalances from '@/components/leaves/AdminLeaveBalances';
import EmployeeLeaveBalance from '@/components/leaves/EmployeeLeaveBalance';

export const LeaveBalancesPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return (
      <div className="container mx-auto space-y-4 px-2 sm:px-4">
        <div className="sticky top-0 z-10 bg-background pb-3 pt-2">
          <h1 className="text-2xl font-bold tracking-tight">Leave Balances</h1>
          <p className="text-muted-foreground text-sm">View and manage employee leave balances</p>
        </div>
        <AdminLeaveBalances />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border w-full">
        <h1 className="text-xl font-semibold tracking-tight">My Leave Balances</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          View your available leave balances
        </p>
      </div>
      <EmployeeLeaveBalance employeeId={user?.employee_id || 0} />
    </div>
  );
};