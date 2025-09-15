import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Award } from 'lucide-react';
import TrainingForm from '@/components/training/TrainingForm';
import TrainingCard from '@/components/training/TrainingCard';
import trainingService from '@/services/trainingService';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  Training
} from '@/types/training';

const EmployeeCertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch my training records to filter certificates
  const { 
    data: myTrainingData
  } = useQuery({
    queryKey: ['my-trainings', { employee_id: user?.employee_id }],
    queryFn: () => trainingService.getTrainings({
      employee_id: user?.employee_id,
      page: 1,
      limit: 100, // Get all trainings to filter certificates
      sort_by: 'start_date',
      sort_order: 'desc'
    }),
    enabled: !!user?.employee_id,
    staleTime: 5 * 60 * 1000,
  });

  const openViewForm = (training: Training) => {
    setSelectedTraining(training);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setSelectedTraining(null);
    setIsFormOpen(false);
  };

  const myTrainings = myTrainingData?.trainings || [];
  const certificatedTrainings = myTrainings.filter(t => t.certificate_issued);

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <h1 className="text-3xl font-bold">My Certificates</h1>
        <p className="text-muted-foreground">
          View all your earned training certificates
        </p>
      </div>

      {/* Content */}
      {certificatedTrainings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificatedTrainings.map((training) => (
            <TrainingCard
              key={training.id}
              training={training}
              onView={() => openViewForm(training)}
              showEmployeeInfo={false}
              readOnly={true}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No certificates yet</h3>
            <p className="text-muted-foreground">
              Complete training programs to earn certificates
            </p>
          </CardContent>
        </Card>
      )}

      {/* Training Details Dialog */}
      <Dialog open={isFormOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Certificate Details</DialogTitle>
            <DialogDescription>
              View detailed information about this certified training.
            </DialogDescription>
          </DialogHeader>
          <TrainingForm
            training={selectedTraining || undefined}
            employeeId={user?.employee_id}
            onSubmit={() => {}} // No submission needed for view-only
            onCancel={closeForm}
            isLoading={false}
            readOnly={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeCertificatesPage;