import React from 'react';
import { EmployeePayrollHistory } from '@/components/payroll/EmployeePayrollHistory';

export const EmployeePayrollPage: React.FC = () => {
  return (
    <div className="max-w-7xl space-y-4">
      <EmployeePayrollHistory />
    </div>
  );
};