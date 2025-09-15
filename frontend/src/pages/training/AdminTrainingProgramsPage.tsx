import React from 'react';
import AdminTrainingPrograms from '@/components/training/AdminTrainingPrograms';

const AdminTrainingProgramsPage: React.FC = () => {
  return (
    <div className="container mx-auto space-y-6">

      {/* Content */}
      <AdminTrainingPrograms />
    </div>
  );
};

export default AdminTrainingProgramsPage;