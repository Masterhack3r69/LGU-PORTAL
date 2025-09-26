import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import leaveService from '@/services/leaveService';
import LeaveCard from './LeaveCard';
import { showToast} from "@/lib/toast"
import type { LeaveApplication } from '@/types/leave';

const AdminLeaveApprovals: React.FC = () => {
  const [pendingApplications, setPendingApplications] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingApplications();
  }, []);

  const loadPendingApplications = async () => {
    try {
      setIsLoading(true);
      const response = await leaveService.getLeaveApplications({
        status: 'Pending',
        page: 1,
        limit: 50
      });
      setPendingApplications(response.applications);
    } catch (error) {
      showToast.error('Failed to load pending applications');
      console.error('Error loading pending applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (application: LeaveApplication) => {
    try {
      await leaveService.approveLeaveApplication(application.id, { review_notes: 'Approved' });
      showToast.success('Leave application approved successfully');
      loadPendingApplications();
    } catch {
      showToast.error('Failed to approve leave application');
    }
  };

  const handleReject = async (application: LeaveApplication) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await leaveService.rejectLeaveApplication(application.id, {
        review_notes: reason
      });
      showToast.success('Leave application rejected');
      loadPendingApplications();
    } catch {
      showToast.error('Failed to reject leave application');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading pending applications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Pending Approvals</span>
            <Badge variant={pendingApplications.length > 0 ? "default" : "secondary"}>
              {pendingApplications.length} pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Review and approve or reject pending leave applications.
          </p>
        </CardContent>
      </Card>

      {/* Pending Applications */}
      {pendingApplications.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p>No pending leave applications require your attention.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingApplications.map((application) => (
            <LeaveCard
              key={application.id}
              leave={application}
              showEmployee={true}
              actions={
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(application)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(application)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLeaveApprovals;