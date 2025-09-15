import React from 'react';
import AdminTrainingRecords from '@/components/training/AdminTrainingRecords';

const AdminEmployeeTrainingPage: React.FC = () => {
  return (
    <div className="container mx-auto space-y-6">
      {/* Content */}
      <AdminTrainingRecords showEmployeeView={true} />
    </div>
  );
};

export default AdminEmployeeTrainingPage;