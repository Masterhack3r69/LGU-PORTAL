import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Award, 
  Edit, 
  Trash2, 
  Eye,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import type { Training, TrainingType } from '@/types/training';

interface TrainingCardProps {
  training: Training;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  showEmployeeInfo?: boolean;
  readOnly?: boolean;
  className?: string;
}

const getTrainingTypeColor = (type: TrainingType): string => {
  switch (type) {
    case 'Internal':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'External':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'Online':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'Seminar':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case 'Workshop':
      return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getStatusColor = (startDate: string, endDate: string): { color: string; label: string } => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return { color: 'bg-yellow-100 text-yellow-800', label: 'Scheduled' };
  } else if (now >= start && now <= end) {
    return { color: 'bg-blue-100 text-blue-800', label: 'In Progress' };
  } else {
    return { color: 'bg-green-100 text-green-800', label: 'Completed' };
  }
};

const TrainingCard: React.FC<TrainingCardProps> = ({
  training,
  onEdit,
  onDelete,
  onView,
  showEmployeeInfo = false,
  readOnly = false,
  className = ''
}) => {
  const status = getStatusColor(training.start_date, training.end_date);
  const typeColor = training.training_type ? getTrainingTypeColor(training.training_type) : '';

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const calculateDuration = () => {
    if (training.duration_hours) {
      return training.duration_hours;
    }
    
    const start = new Date(training.start_date);
    const end = new Date(training.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays * 8; // Assume 8 hours per day
  };

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-l-4 ${
      status.label === 'Completed' ? 'border-l-green-500' : 
      status.label === 'In Progress' ? 'border-l-blue-500' : 
      'border-l-yellow-500'
    } ${className}`}>
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {training.training_title}
            </CardTitle>
            {training.program_title && training.program_title !== training.training_title && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1 flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50" />
                {training.program_title}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Badge className={`${status.color} font-medium shadow-sm`} variant="secondary">
              {status.label}
            </Badge>
            {training.training_type && (
              <Badge className={`${typeColor} font-medium`} variant="outline">
                {training.training_type}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 relative">
        {/* Employee Info (shown for admin view) */}
        {showEmployeeInfo && training.employee_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{training.employee_name}</span>
            {training.employee_number && (
              <Badge variant="outline" className="text-xs">
                {training.employee_number}
              </Badge>
            )}
          </div>
        )}

        {/* Date Information */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-foreground">{formatDate(training.start_date)}</span>
            {training.start_date !== training.end_date && (
              <>
                <span className="text-muted-foreground">→</span>
                <span className="text-foreground">{formatDate(training.end_date)}</span>
              </>
            )}
          </div>
          
          {/* Duration */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{calculateDuration()} hours</span>
          </div>
        </div>

        {/* Venue & Organizer */}
        {(training.venue || training.organizer) && (
          <div className="space-y-2">
            {training.venue && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-2">{training.venue}</span>
              </div>
            )}
            {training.organizer && (
              <div className="flex items-start gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-2">{training.organizer}</span>
              </div>
            )}
          </div>
        )}

        {/* Certificate Badge */}
        {training.certificate_issued && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <div className="flex-1">
                <Badge variant="outline" className="text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 font-semibold">
                  Certificate Issued
                </Badge>
                {training.certificate_number && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1 font-medium">
                    Certificate #{training.certificate_number}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {(onEdit || onDelete || onView) && (
          <div className="flex gap-2 pt-3 mt-1">
            {onView && (
              <Button
                variant={readOnly ? "default" : "outline"}
                size="sm"
                onClick={onView}
                className={`flex-1 items-center gap-2 font-medium transition-all ${
                  readOnly ? 'shadow-sm hover:shadow-md' : ''
                }`}
              >
                <Eye className="h-4 w-4" />
                View Details
              </Button>
            )}
            {!readOnly && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1 items-center gap-2 font-medium hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            {!readOnly && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="flex-1 items-center gap-2 font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingCard;