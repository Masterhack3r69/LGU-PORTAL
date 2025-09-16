import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { 
  TrainingProgram, 
  CreateTrainingProgramDTO, 
  UpdateTrainingProgramDTO,
  TrainingType 
} from '@/types/training';

const trainingProgramSchema = z.object({
  title: z.string().min(1, 'Training title is required'),
  description: z.string().optional(),
  duration_hours: z.number().min(0.5, 'Duration must be at least 0.5 hours').optional(),
  training_type: z.enum(['Internal', 'External', 'Online', 'Seminar', 'Workshop'], {
    message: 'Please select a training type',
  }),
});

type TrainingProgramFormData = z.infer<typeof trainingProgramSchema>;

interface TrainingProgramFormProps {
  program?: TrainingProgram;
  onSubmit: (data: CreateTrainingProgramDTO | UpdateTrainingProgramDTO) => void;
  onCancel: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

const trainingTypes: { value: TrainingType; label: string; description: string }[] = [
  {
    value: 'Internal',
    label: 'Internal Training',
    description: 'Training conducted within the organization'
  },
  {
    value: 'External',
    label: 'External Training',
    description: 'Training conducted by external providers'
  },
  {
    value: 'Online',
    label: 'Online Training',
    description: 'Digital or web-based training programs'
  },
  {
    value: 'Seminar',
    label: 'Seminar',
    description: 'Educational seminars and workshops'
  },
  {
    value: 'Workshop',
    label: 'Workshop',
    description: 'Hands-on workshop sessions'
  }
];

const getTrainingTypeColor = (type: TrainingType): string => {
  switch (type) {
    case 'Internal':
      return 'bg-blue-100 text-blue-800';
    case 'External':
      return 'bg-green-100 text-green-800';
    case 'Online':
      return 'bg-purple-100 text-purple-800';
    case 'Seminar':
      return 'bg-orange-100 text-orange-800';
    case 'Workshop':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const TrainingProgramForm: React.FC<TrainingProgramFormProps> = ({
  program,
  onSubmit,
  onCancel,
  isLoading = false,
  readOnly = false
}) => {
  const isEditing = !!program;

  const form = useForm<TrainingProgramFormData>({
    resolver: zodResolver(trainingProgramSchema),
    defaultValues: {
      title: program?.title || '',
      description: program?.description || '',
      duration_hours: program?.duration_hours || undefined,
      training_type: program?.training_type || undefined,
    }
  });

  const { watch } = form;
  const selectedType = watch('training_type');

  const handleSubmit = async (data: TrainingProgramFormData) => {
    try {
      const submissionData = {
        title: data.title,
        description: data.description || undefined,
        duration_hours: data.duration_hours || undefined,
        training_type: data.training_type,
      };

      onSubmit(submissionData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 animate-spin text-primary" />
            <span className="text-muted-foreground">
              {isEditing ? 'Updating training program...' : 'Creating training program...'}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Training Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Training Title *</Label>
          <Input
            {...form.register('title')}
            placeholder="Enter training program title"
            disabled={readOnly}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
          )}
        </div>

        {/* Training Type */}
        <div className="space-y-2">
          <Label htmlFor="training_type">Training Type *</Label>
          <Select
            value={selectedType}
            onValueChange={(value) => form.setValue('training_type', value as TrainingType)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select training type" />
            </SelectTrigger>
            <SelectContent>
              {trainingTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${getTrainingTypeColor(type.value)}`}
                    >
                      {type.value}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.training_type && (
            <p className="text-sm text-red-600">{form.formState.errors.training_type.message}</p>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration_hours">Default Duration (Hours)</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              step="0.5"
              min="0"
              {...form.register('duration_hours', { valueAsNumber: true })}
              placeholder="e.g., 8, 16, 40"
              className="pl-10"
              disabled={readOnly}
            />
          </div>
          {form.formState.errors.duration_hours && (
            <p className="text-sm text-red-600">{form.formState.errors.duration_hours.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Optional: Default duration that will be suggested when creating training records
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            {...form.register('description')}
            placeholder="Enter detailed description of the training program..."
            rows={4}
            disabled={readOnly}
          />
          <p className="text-xs text-muted-foreground">
            Optional: Provide details about the training content, objectives, and target audience
          </p>
        </div>

        {/* Preview Section */}
        {selectedType && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Preview</h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getTrainingTypeColor(selectedType)}>
                {selectedType}
              </Badge>
              {form.watch('duration_hours') && (
                <Badge variant="outline">
                  {form.watch('duration_hours')} hours
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {form.watch('title') || 'Training program title will appear here'}
            </p>
            {form.watch('description') && (
              <p className="text-xs text-muted-foreground mt-1">
                {form.watch('description')}
              </p>
            )}
          </div>
        )}

        {/* Form Actions */}
        {!readOnly && (
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-initial">
              {isLoading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditing ? 'Update Program' : 'Create Program'}</>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default TrainingProgramForm;