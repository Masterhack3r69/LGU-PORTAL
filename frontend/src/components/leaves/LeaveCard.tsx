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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">{leave.leave_type_name}</CardTitle>
            <Badge className={statusColors[leave.status]}>
              {leave.status}
            </Badge>
          </div>
          {actions}
        </div>
        {showEmployee && leave.employee_name && (
          <CardDescription className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{leave.employee_name} ({leave.employee_number})</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(leave.start_date)} - {formatDate(leave.end_date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{leave.days_requested} day(s)</span>
          </div>
        </div>
        
        {leave.reason && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Reason:</p>
            <p className="text-sm">{leave.reason}</p>
          </div>
        )}

        {leave.review_notes && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Review Notes:</p>
            <p className="text-sm">{leave.review_notes}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Applied on: {formatDate(leave.applied_at)}
          {leave.reviewed_at && (
            <span> • Reviewed on: {formatDate(leave.reviewed_at)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveCard;