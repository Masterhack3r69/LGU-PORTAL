import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  Search,
  Download,
  RefreshCw,
  Calendar,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import TrainingForm from './TrainingForm';
import TrainingCard from './TrainingCard';
import TrainingFilters from './TrainingFilters';
import trainingService from '@/services/trainingService';
import type { 
  Training, 
  TrainingFilters as TrainingFiltersType, 
  CreateTrainingDTO, 
  UpdateTrainingDTO 
} from '@/types/training';

interface AdminTrainingRecordsProps {
  showEmployeeView?: boolean;
}

const AdminTrainingRecords: React.FC<AdminTrainingRecordsProps> = ({
  showEmployeeView = false
}) => {
  const [filters, setFilters] = useState<Partial<TrainingFiltersType>>({
    page: 1,
    limit: 12,
    sort_by: 'start_date',
    sort_order: 'desc'
  });
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

  const queryClient = useQueryClient();

  // Fetch training records
  const { 
    data: trainingData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['trainings', filters],
    queryFn: () => trainingService.getTrainings(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create training mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTrainingDTO) => trainingService.createTraining(data),
    onSuccess: () => {
      toast.success('Training record created successfully');
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      closeForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create training: ${error.message}`);
    },
  });

  // Update training mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTrainingDTO }) => 
      trainingService.updateTraining(id, data),
    onSuccess: () => {
      toast.success('Training record updated successfully');
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      closeForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update training: ${error.message}`);
    },
  });

  // Delete training mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => trainingService.deleteTraining(id),
    onSuccess: () => {
      toast.success('Training record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete training: ${error.message}`);
    },
  });

  const handleFiltersChange = (newFilters: Partial<TrainingFiltersType>) => {
    setFilters(newFilters);
  };

  const openCreateForm = () => {
    setSelectedTraining(null);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (training: Training) => {
    setSelectedTraining(training);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (training: Training) => {
    setSelectedTraining(training);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setSelectedTraining(null);
    setIsFormOpen(false);
    setIsViewMode(false);
  };

  const handleSubmit = (data: CreateTrainingDTO | UpdateTrainingDTO) => {
    if (selectedTraining) {
      updateMutation.mutate({ id: selectedTraining.id, data });
    } else {
      createMutation.mutate(data as CreateTrainingDTO);
    }
  };

  const handleDelete = (training: Training) => {
    if (window.confirm(`Are you sure you want to delete the training "${training.training_title}"?`)) {
      deleteMutation.mutate(training.id);
    }
  };

  const trainings = trainingData?.trainings || [];
  const pagination = trainingData?.pagination;

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleExport = async () => {
    try {
      toast.info('Export functionality will be implemented soon');
      // await trainingService.exportTrainingsToCSV(filters);
    } catch {
      toast.error('Failed to export training records');
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load training records</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div>
          <h2 className="text-3xl font-bold">
            {showEmployeeView ? 'Training Overview' : 'Training Records'}
          </h2>
          <p className="text-muted-foreground">
            {showEmployeeView 
              ? 'View training records by employee and track progress'
              : 'Manage all employee training records'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={openCreateForm} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Training
          </Button>
        </div>
      </div>
       

      <div className='grid grid-cols-2 gap-4'>
         {/* Filters */}
        <TrainingFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

          {/* Statistics Bar */}
          {pagination && (
            <Card>
              <CardContent>
                <div className="flex m-2 justify-between text-sm text-muted-foreground">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 " />
                      <span>Total: {pagination.totalCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      <span>
                        Certified: {trainings.filter(t => t.certificate_issued).length}
                      </span>
                    </div>
                  </div>
                  <div>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading training records...</span>
            </div>
          </CardContent>
        </Card> 
      )}

      {/* Training Records */}
      {!isLoading && (
        <>

          {/* Training Grid */}
          {trainings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainings.map((training) => (
                <TrainingCard
                  key={training.id}
                  training={training}
                  onEdit={() => openEditForm(training)}
                  onDelete={() => handleDelete(training)}
                  onView={() => openViewForm(training)}
                  showEmployeeInfo={!showEmployeeView}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No training records found</h3>
                <p className="text-muted-foreground mb-4">
                  {Object.keys(filters).some(key => key !== 'page' && key !== 'limit' && filters[key as keyof TrainingFiltersType])
                    ? 'Try adjusting your filters or search criteria'
                    : 'Get started by adding your first training record'
                  }
                </p>
                <Button onClick={openCreateForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Training Record
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = Math.max(1, pagination.currentPage - 2) + i;
                if (page <= pagination.totalPages) {
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                }
                return null;
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Training Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isViewMode 
                ? 'Training Record Details' 
                : selectedTraining 
                  ? 'Edit Training Record' 
                  : 'New Training Record'
              }
            </DialogTitle>
            <DialogDescription>
              {isViewMode 
                ? 'View detailed information about this training record.' 
                : selectedTraining 
                  ? 'Modify the training record details below.' 
                  : 'Create a new training record by filling out the form below.'
              }
            </DialogDescription>
          </DialogHeader>
          <TrainingForm
            training={selectedTraining || undefined}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            isLoading={createMutation.isPending || updateMutation.isPending}
            readOnly={isViewMode}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTrainingRecords;