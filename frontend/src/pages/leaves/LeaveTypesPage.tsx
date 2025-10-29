import React from 'react';
import AdminLeaveTypes from '@/components/leaves/AdminLeaveTypes';

export const LeaveTypesPage: React.FC = () => {
  return (
    <div className="container mx-auto space-y-4 px-2 sm:px-4">
      <div className="sticky top-0 z-10 bg-background pb-3 pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Leave Types</h1>
        <p className="text-muted-foreground text-sm">Manage leave types and policies</p>
      </div>
      <AdminLeaveTypes />
    </div>
  );
};