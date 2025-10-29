import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import LeaveApplicationForm from './LeaveApplicationForm';
import EmployeeLeaveApplications from './EmployeeLeaveApplications';

const EmployeeLeaveManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNewApplicationDialog, setShowNewApplicationDialog] = useState(false);

  const handleNewApplicationSuccess = () => {
    setShowNewApplicationDialog(false);
    // Optionally refresh the applications list
  };

  if (!user?.employee_id) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground text-sm">
            Please log in as an employee to access leave management.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">My Leave Applications</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              View and manage your leave applications
            </p>
          </div>
          <Button onClick={() => setShowNewApplicationDialog(true)} className="w-full md:w-auto h-9">
            <Plus className="h-4 w-4 mr-1" />
            New Leave
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <EmployeeLeaveApplications employeeId={user.employee_id!} />

      {/* New Application Dialog */}
      <Dialog open={showNewApplicationDialog} onOpenChange={setShowNewApplicationDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Leave Application</DialogTitle>
          </DialogHeader>
          <LeaveApplicationForm 
            employeeId={user.employee_id!}
            onSuccess={handleNewApplicationSuccess}
            onCancel={() => setShowNewApplicationDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeLeaveManagement;