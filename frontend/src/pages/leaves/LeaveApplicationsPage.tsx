import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLeaveApplications from '@/components/leaves/AdminLeaveApplications';
import EmployeeLeaveApplications from '@/components/leaves/EmployeeLeaveApplications';

export const LeaveApplicationsPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminLeaveApplications />;
  }

  if (!user?.employee_id) {
    return (
      <div className="container mx-auto">
        <div className="text-center text-muted-foreground">
          Employee information not found. Please contact your administrator.
        </div>
      </div>
    );
  }

  return <EmployeeLeaveApplications employeeId={user.employee_id} />;
};