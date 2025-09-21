import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminBenefitsManagement from '@/components/benefits/AdminBenefitsManagement';

export const BenefitsManagementPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminBenefitsManagement />;
  }

  // For employee users, show a simple read-only view
  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Benefits</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View your benefit records and history
          </p>
        </div>
      </div>

      <div className="text-center py-8 text-muted-foreground">
        Employee benefits view will be implemented here.
      </div>
    </div>
  );
};