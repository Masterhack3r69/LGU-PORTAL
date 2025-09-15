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
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {training.training_title}
            </CardTitle>
            {training.program_title && training.program_title !== training.training_title && (
              <p className="text-sm text-muted-foreground mt-1">
                {training.program_title}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <Badge className={status.color} variant="secondary">
              {status.label}
            </Badge>
            {training.training_type && (
              <Badge className={typeColor} variant="outline">
                {training.training_type}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(training.start_date)}</span>
          </div>
          {training.start_date !== training.end_date && (
            <>
              <span className="text-muted-foreground">to</span>
              <span>{formatDate(training.end_date)}</span>
            </>
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{calculateDuration()} hours</span>
        </div>

        {/* Venue */}
        {training.venue && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{training.venue}</span>
          </div>
        )}

        {/* Organizer */}
        {training.organizer && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="line-clamp-1">{training.organizer}</span>
          </div>
        )}

        {/* Certificate Badge */}
        {training.certificate_issued && (
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
              Certified
            </Badge>
            {training.certificate_number && (
              <span className="text-xs text-muted-foreground">
                #{training.certificate_number}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        {!readOnly && (onEdit || onDelete || onView) && (
          <div className="flex gap-2 pt-2 border-t">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
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