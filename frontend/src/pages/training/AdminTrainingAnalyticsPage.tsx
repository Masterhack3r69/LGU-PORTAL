import React from 'react';
import TrainingStatistics from '@/components/training/TrainingStatistics';

const AdminTrainingAnalyticsPage: React.FC = () => {
  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Training Analytics</h1>
        <p className="text-muted-foreground">
          Analyze training effectiveness and performance metrics
        </p>
      </div>

      {/* Content */}
      <TrainingStatistics />
    </div>
  );
};

export default AdminTrainingAnalyticsPage;