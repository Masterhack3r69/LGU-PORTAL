import React from 'react';
import TrainingStatistics from '@/components/training/TrainingStatistics';

const AdminTrainingAnalyticsPage: React.FC = () => {
  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">Training Analytics</h1>
          <p className="text-muted-foreground text-sm">
          Analyze training effectiveness and performance metrics
          </p>
        </div>
      </div>

      {/* Content */}
      <TrainingStatistics />
    </div>
  );
};

export default AdminTrainingAnalyticsPage;