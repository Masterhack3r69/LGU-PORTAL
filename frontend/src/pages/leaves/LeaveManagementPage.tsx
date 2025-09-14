import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLeaveManagement from '@/components/leaves/AdminLeaveManagement';
import EmployeeLeaveManagement from '@/components/leaves/EmployeeLeaveManagement';

export const LeaveManagementPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminLeaveManagement />;
  }

  return <EmployeeLeaveManagement />;
};