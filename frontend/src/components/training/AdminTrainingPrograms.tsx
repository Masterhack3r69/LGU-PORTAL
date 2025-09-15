import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  RefreshCw,
  BookOpen,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import TrainingProgramForm from './TrainingProgramForm';
import trainingService from '@/services/trainingService';
import type { 
  TrainingProgram, 
  CreateTrainingProgramDTO, 
  UpdateTrainingProgramDTO,
  TrainingType 
} from '@/types/training';

const getTrainingTypeColor = (type: TrainingType): string => {
  switch (type) {
    case 'Internal':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'External':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Online':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Seminar':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Workshop':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const AdminTrainingPrograms: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  // Fetch training programs
  const { 
    data: programs = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['training-programs'],
    queryFn: () => trainingService.getTrainingPrograms(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create program mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTrainingProgramDTO) => trainingService.createTrainingProgram(data),
    onSuccess: () => {
      toast.success('Training program created successfully');
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      closeForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create program: ${error.message}`);
    },
  });

  // Update program mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTrainingProgramDTO }) => 
      trainingService.updateTrainingProgram(id, data),
    onSuccess: () => {
      toast.success('Training program updated successfully');
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      closeForm();
    },
    onError: (error: Error) => {
      toast.error(`Failed to update program: ${error.message}`);
    },
  });

  // Delete program mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => trainingService.deleteTrainingProgram(id),
    onSuccess: () => {
      toast.success('Training program deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete program: ${error.message}`);
    },
  });

  const openCreateForm = () => {
    setSelectedProgram(null);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (program: TrainingProgram) => {
    setSelectedProgram(program);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (program: TrainingProgram) => {
    setSelectedProgram(program);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setSelectedProgram(null);
    setIsFormOpen(false);
    setIsViewMode(false);
  };

  const handleSubmit = (data: CreateTrainingProgramDTO | UpdateTrainingProgramDTO) => {
    if (selectedProgram) {
      updateMutation.mutate({ id: selectedProgram.id, data });
    } else {
      createMutation.mutate(data as CreateTrainingProgramDTO);
    }
  };

  const handleDelete = (program: TrainingProgram) => {
    if (window.confirm(`Are you sure you want to delete the training program "${program.title}"?\n\nThis action cannot be undone.`)) {
      deleteMutation.mutate(program.id);
    }
  };

  // Filter programs based on search query
  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.training_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load training programs</p>
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
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Training Programs</h2>
          <p className="text-muted-foreground">
            Manage training program templates and definitions
          </p>
        </div>
        <Button onClick={openCreateForm} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Program
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredPrograms.length} of {programs.length} programs
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading training programs...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Programs */}
      {!isLoading && (
        <>
          {filteredPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => (
                <Card key={program.id} className="transition-all duration-200 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold line-clamp-2">
                          {program.title}
                        </CardTitle>
                      </div>
                      <Badge className={getTrainingTypeColor(program.training_type)} variant="outline">
                        {program.training_type}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Description */}
                    {program.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {program.description}
                      </p>
                    )}

                    {/* Duration */}
                    {program.duration_hours && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{program.duration_hours} hours</span>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(program.created_at).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewForm(program)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditForm(program)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(program)}
                        className="flex items-center gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'No programs found' : 'No training programs yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create your first training program template to get started'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={openCreateForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Training Program
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Training Program Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isViewMode 
                ? 'Training Program Details' 
                : selectedProgram 
                  ? 'Edit Training Program' 
                  : 'New Training Program'
              }
            </DialogTitle>
            <DialogDescription>
              {isViewMode 
                ? 'View detailed information about this training program template.' 
                : selectedProgram 
                  ? 'Modify the training program template details below.' 
                  : 'Create a new training program template by filling out the form below.'
              }
            </DialogDescription>
          </DialogHeader>
          <TrainingProgramForm
            program={selectedProgram || undefined}
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

export default AdminTrainingPrograms;