import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Building2,
  Award,
  BookOpen,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import type { Training, TrainingType } from '@/types/training';

interface TrainingDetailViewProps {
  training: Training;
}

const getTrainingTypeColor = (type: TrainingType): string => {
  switch (type) {
    case 'Internal':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'External':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'Online':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'Seminar':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'Workshop':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

const getStatusColor = (startDate: string, endDate: string): { color: string; label: string } => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return { 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', 
      label: 'Scheduled' 
    };
  } else if (now >= start && now <= end) {
    return { 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', 
      label: 'In Progress' 
    };
  } else {
    return { 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 
      label: 'Completed' 
    };
  }
};

const TrainingDetailView: React.FC<TrainingDetailViewProps> = ({ training }) => {
  const status = getStatusColor(training.start_date, training.end_date);
  const typeColor = training.training_type ? getTrainingTypeColor(training.training_type) : '';

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
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
    return diffDays * 8;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {training.training_title}
          </h2>
          {training.program_title && training.program_title !== training.training_title && (
            <p className="text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {training.program_title}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge className={`${status.color} font-semibold px-3 py-1`} variant="secondary">
            {status.label}
          </Badge>
          {training.training_type && (
            <Badge className={`${typeColor} font-semibold px-3 py-1`} variant="outline">
              {training.training_type}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Date & Duration Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Training Period
              </p>
              <p className="text-sm font-semibold text-foreground">
                {formatDate(training.start_date)}
              </p>
              {training.start_date !== training.end_date && (
                <>
                  <p className="text-xs text-muted-foreground my-1">to</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatDate(training.end_date)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Duration
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {calculateDuration()}
              </p>
              <p className="text-xs text-muted-foreground">hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Location & Organizer Section */}
      {(training.venue || training.organizer) && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Training Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {training.venue && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Venue</p>
                    <p className="text-sm font-medium text-foreground">{training.venue}</p>
                  </div>
                </div>
              )}
              {training.organizer && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Organizer</p>
                    <p className="text-sm font-medium text-foreground">{training.organizer}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Certificate Section */}
      {training.certificate_issued && (
        <>
          <Separator />
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 rounded-lg p-6 border-2 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Award className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-400 mb-1">
                  Certificate Awarded
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-500 mb-3">
                  You have successfully completed this training and earned a certificate
                </p>
                {training.certificate_number && (
                  <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/50 px-4 py-2 rounded-lg border border-yellow-300 dark:border-yellow-700">
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                      Certificate Number:
                    </span>
                    <span className="text-sm font-bold text-yellow-900 dark:text-yellow-300">
                      {training.certificate_number}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Employee Info (if available) */}
      {training.employee_name && (
        <>
          <Separator />
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Participant</p>
              <p className="text-sm font-semibold text-foreground">
                {training.employee_name}
                {training.employee_number && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {training.employee_number}
                  </Badge>
                )}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrainingDetailView;
