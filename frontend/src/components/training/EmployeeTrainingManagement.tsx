import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  GraduationCap, 
  Calendar, 
  Award, 
  BarChart3,
  RefreshCw,
  Search,
  Clock,
  User
} from 'lucide-react';
import { showToast } from "@/lib/toast"
import TrainingForm from './TrainingForm';
import TrainingCard from './TrainingCard';
import TrainingFilters from './TrainingFilters';
import trainingService from '@/services/trainingService';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  Training, 
  TrainingFilters as TrainingFiltersType, 
  CreateTrainingDTO, 
  UpdateTrainingDTO 
} from '@/types/training';

const EmployeeTrainingManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-trainings');
  const [filters, setFilters] = useState<Partial<TrainingFiltersType>>({
    page: 1,
    limit: 12,
    sort_by: 'start_date',
    sort_order: 'desc',
    employee_id: user?.employee_id
  });
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

  const queryClient = useQueryClient();

  // Fetch my training records
  const { 
    data: myTrainingData, 
    isLoading: isLoadingTrainings, 
    error: trainingError,
    refetch: refetchTrainings 
  } = useQuery({
    queryKey: ['my-trainings', filters],
    queryFn: () => trainingService.getTrainings({
      ...filters,
      employee_id: user?.employee_id
    }),
    enabled: !!user?.employee_id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch my training history and stats
  const { 
    data: trainingHistory, 
    isLoading: isLoadingHistory 
  } = useQuery({
    queryKey: ['employee-training-history', user?.employee_id],
    queryFn: () => user?.employee_id ? trainingService.getEmployeeTrainingHistory(user.employee_id) : Promise.reject('No employee ID'),
    enabled: !!user?.employee_id,
    staleTime: 10 * 60 * 1000,
  });

  // Create training mutation (employee can create their own training records)
  const createMutation = useMutation({
    mutationFn: (data: CreateTrainingDTO) => trainingService.createTraining({
      ...data,
      employee_id: user?.employee_id || 0
    }),
    onSuccess: () => {
      showToast.success('Training record created successfully');
      queryClient.invalidateQueries({ queryKey: ['my-trainings'] });
      queryClient.invalidateQueries({ queryKey: ['employee-training-history'] });
      closeForm();
    },
    onError: (error: Error) => {
      showToast.error(`Failed to create training: ${error.message}`);
    },
  });

  // Update training mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTrainingDTO }) => 
      trainingService.updateTraining(id, data),
    onSuccess: () => {
      showToast.success('Training record updated successfully');
      queryClient.invalidateQueries({ queryKey: ['my-trainings'] });
      queryClient.invalidateQueries({ queryKey: ['employee-training-history'] });
      closeForm();
    },
    onError: (error: Error) => {
      showToast.error(`Failed to update training: ${error.message}`);
    },
  });

  // Delete training mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => trainingService.deleteTraining(id),
    onSuccess: () => {
      showToast.success('Training record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['my-trainings'] });
      queryClient.invalidateQueries({ queryKey: ['employee-training-history'] });
    },
    onError: (error: Error) => {
      showToast.error(`Failed to delete training: ${error.message}`);
    },
  });

  const handleFiltersChange = (newFilters: Partial<TrainingFiltersType>) => {
    setFilters({
      ...newFilters,
      employee_id: user?.employee_id // Always maintain employee filter
    });
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

  const myTrainings = myTrainingData?.trainings || [];
  const pagination = myTrainingData?.pagination;
  const stats = trainingHistory?.statistics;

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (trainingError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load your training records</p>
            <Button onClick={() => refetchTrainings()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Training</h1>
        <p className="text-muted-foreground">
          Track your training progress and manage your learning journey
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-trainings" className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4" />
            <span>My Trainings</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Certificates</span>
          </TabsTrigger>
        </TabsList>

        {/* My Trainings Tab */}
        <TabsContent value="my-trainings" className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold">My Training Records</h2>
              <p className="text-muted-foreground">
                View and manage your training history
              </p>
            </div>
            <Button onClick={openCreateForm} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Training
            </Button>
          </div>

          {/* Filters */}
          <TrainingFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Loading State */}
          {isLoadingTrainings && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading your training records...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training Records */}
          {!isLoadingTrainings && (
            <>
              {myTrainings.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myTrainings.map((training) => (
                      <TrainingCard
                        key={training.id}
                        training={training}
                        onEdit={() => openEditForm(training)}
                        onDelete={() => handleDelete(training)}
                        onView={() => openViewForm(training)}
                        showEmployeeInfo={false}
                      />
                    ))}
                  </div>

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
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No training records found</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your training portfolio by adding your first training record
                    </p>
                    <Button onClick={openCreateForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Training Record
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {isLoadingHistory ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading your training overview...</span>
                </div>
              </CardContent>
            </Card>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Trainings</p>
                      <p className="text-2xl font-bold">{stats.totalTrainings}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                      <p className="text-2xl font-bold">{stats.totalHours}h</p>
                    </div>
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Certificates</p>
                      <p className="text-2xl font-bold">{stats.certificatesEarned}</p>
                    </div>
                    <Award className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                      <p className="text-2xl font-bold">{stats.upcomingTrainings.length}</p>
                    </div>
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No training data available</h3>
                <p className="text-muted-foreground">
                  Your training overview will appear here once you have training records
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="space-y-4">
          <div>
            <h2 className="text-3xl font-bold">My Certificates</h2>
            <p className="text-muted-foreground">
              View all your earned training certificates
            </p>
          </div>

          {myTrainings.filter(t => t.certificate_issued).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTrainings
                .filter(training => training.certificate_issued)
                .map((training) => (
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
        </TabsContent>
      </Tabs>

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
            employeeId={user?.employee_id}
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

export default EmployeeTrainingManagement;