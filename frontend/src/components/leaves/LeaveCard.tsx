import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';
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

const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Approved: 'bg-green-100 text-green-800 border-green-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
  Cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <CardTitle className="text-base sm:text-lg">{leave.leave_type_name}</CardTitle>
            <Badge className={statusColors[leave.status]}>
              {leave.status}
            </Badge>
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
        {showEmployee && leave.employee_name && (
          <CardDescription className="flex items-center space-x-1 mt-2">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{leave.employee_name} ({leave.employee_number})</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{formatDate(leave.start_date)} - {formatDate(leave.end_date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{leave.days_requested} day(s)</span>
          </div>
        </div>
        
        {leave.reason && (
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Reason:</p>
            <p className="text-xs sm:text-sm leading-relaxed">{leave.reason}</p>
          </div>
        )}

        {leave.review_notes && (
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Review Notes:</p>
            <p className="text-xs sm:text-sm leading-relaxed">{leave.review_notes}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-1 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
            <span>Applied: {formatDate(leave.applied_at)}</span>
            {leave.reviewed_at && (
              <span className="sm:before:content-['•'] sm:before:mx-2">Reviewed: {formatDate(leave.reviewed_at)}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveCard;