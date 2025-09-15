import React from 'react';
import AdminTrainingRecords from '@/components/training/AdminTrainingRecords';

const AdminTrainingRecordsPage: React.FC = () => {
  return (
    <div className="container mx-auto space-y-6">
     
      {/* Content */}
      <AdminTrainingRecords />
    </div>
  );
};

export default AdminTrainingRecordsPage;