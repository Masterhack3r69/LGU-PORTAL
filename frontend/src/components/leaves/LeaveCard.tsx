import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, User, FileText } from 'lucide-react';
import type { LeaveApplication } from '@/types/leave';

interface LeaveCardProps {
  leave: LeaveApplication;
  showEmployee?: boolean;
  onEdit?: (leave: LeaveApplication) => void;
  onCancel?: (leave: LeaveApplication) => void;
  onApprove?: (leave: LeaveApplication) => void;
  onReject?: (leave: LeaveApplication) => void;
  actions?: React.ReactNode;
}

const statusConfig = {
  Pending: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  Approved: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-100 text-green-800 border-green-200',
    icon: CalendarIcon,
  },
  Rejected: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-800 border-red-200',
    icon: FileText,
  },
  Cancelled: {
    bg: 'bg-gray-50 dark:bg-gray-950/20',
    text: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-800',
    badge: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: FileText,
  },
};

const LeaveCard: React.FC<LeaveCardProps> = ({
  leave,
  showEmployee = false,
  actions
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const config = statusConfig[leave.status];
  const StatusIcon = config.icon;

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 ${config.border} ${config.bg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${config.bg} border ${config.border}`}>
              <StatusIcon className={`h-5 w-5 ${config.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg font-semibold">{leave.leave_type_name}</CardTitle>
                <Badge className={`${config.badge} border text-xs`}>
                  {leave.status}
                </Badge>
              </div>
              {showEmployee && leave.employee_name && (
                <CardDescription className="flex items-center gap-1.5 mt-1.5">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate text-sm">{leave.employee_name} ({leave.employee_number})</span>
                </CardDescription>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Date and Duration Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-background/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-sm font-medium truncate">{formatDate(leave.start_date)} - {formatDate(leave.end_date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Days</p>
              <p className="text-sm font-medium">{leave.days_requested} day(s)</p>
            </div>
          </div>
        </div>
        
        {/* Reason */}
        {leave.reason && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</p>
            <p className="text-sm leading-relaxed p-2 bg-background/50 rounded border">{leave.reason}</p>
          </div>
        )}

        {/* Review Notes */}
        {leave.review_notes && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Review Notes</p>
            <p className="text-sm leading-relaxed p-2 bg-background/50 rounded border">{leave.review_notes}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <span className="font-medium">Applied:</span>
            <span>{formatDate(leave.applied_at)}</span>
          </div>
          {leave.reviewed_at && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span className="font-medium">Reviewed:</span>
                <span>{formatDate(leave.reviewed_at)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveCard;