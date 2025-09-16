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
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-600 space-y-3">
          <p className="text-base font-medium">Failed to load training records</p>
          <p className="text-sm text-muted-foreground">Please check your connection and try again</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
            {showEmployeeView ? 'Training Overview' : 'Training Records'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {showEmployeeView 
              ? 'View training records by employee and track progress'
              : 'Manage all employee training records'
            }
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={handleExport} variant="outline" size="sm" className="flex-1 sm:flex-initial">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button onClick={openCreateForm} size="sm" className="flex-1 sm:flex-initial">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Training</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>
       

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
         {/* Filters */}
        <TrainingFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

          {/* Statistics Bar */}
          {pagination && (
            <Card >
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Total: <span className="font-semibold text-blue-600">{pagination.totalCount}</span></span>
                    </div>
                    <div className="col-end-7 flex items-center gap-1 text-muted-foreground">
                      <Award className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        Certified: <span className="font-semibold text-green-600">{trainings.filter(t => t.certificate_issued).length}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-muted-foreground text-center sm:text-right">
                    <span className="font-medium">Page {pagination.currentPage} of {pagination.totalPages}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="text-base text-muted-foreground">Loading training records...</span>
          </div>
        </div>
      )}

      {/* Training Records */}
      {!isLoading && (
        <>

          {/* Training Grid */}
          {trainings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
            <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/25">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
              <h3 className="text-lg font-medium mb-2 text-foreground">No training records found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {Object.keys(filters).some(key => key !== 'page' && key !== 'limit' && filters[key as keyof TrainingFiltersType])
                  ? 'Try adjusting your filters or search criteria to find relevant training records'
                  : 'Get started by adding your first training record to begin tracking employee development'
                }
              </p>
              <Button onClick={openCreateForm} size="lg" className="px-6">
                <Plus className="h-4 w-4 mr-2" />
                Add Training Record
              </Button>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="w-full sm:w-auto"
              >
                Previous
              </Button>
              <div className="flex flex-wrap justify-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = Math.max(1, pagination.currentPage - 2) + i;
                  if (page <= pagination.totalPages) {
                    return (
                      <Button
                        key={page}
                        variant={page === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    );
                  }
                  return null;
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="w-full sm:w-auto"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Training Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={closeForm}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b bg-muted/20">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              {isViewMode 
                ? 'Training Record Details' 
                : selectedTraining 
                  ? 'Edit Training Record' 
                  : 'New Training Record'
              }
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {isViewMode 
                ? 'View detailed information about this training record.' 
                : selectedTraining 
                  ? 'Modify the training record details below.' 
                  : 'Create a new training record by filling out the form below.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TrainingForm
              training={selectedTraining || undefined}
              onSubmit={handleSubmit}
              onCancel={closeForm}
              isLoading={createMutation.isPending || updateMutation.isPending}
              readOnly={isViewMode}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTrainingRecords;