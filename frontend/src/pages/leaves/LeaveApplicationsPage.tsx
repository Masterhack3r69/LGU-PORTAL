import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminLeaveApplications from "@/components/leaves/AdminLeaveApplications";
import EmployeeLeaveApplications from "@/components/leaves/EmployeeLeaveApplications";
import LeaveApplicationForm from "@/components/leaves/LeaveApplicationForm";

export const LeaveApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [showNewApplicationDialog, setShowNewApplicationDialog] = useState(false);

  const handleNewApplicationSuccess = () => {
    setShowNewApplicationDialog(false);
  };

  if (user?.role === "admin") {
    return (
      <div className="container mx-auto space-y-4 px-2 sm:px-4">
        <div className="sticky top-0 z-10 bg-background pb-3 pt-2">
          <h1 className="text-2xl font-bold tracking-tight">Leave Applications</h1>
          <p className="text-muted-foreground text-sm">View and manage all employee leave applications</p>
        </div>
        <AdminLeaveApplications />
      </div>
    );
  }

  if (!user?.employee_id) {
    return (
      <div className="container mx-auto">
        <div className="text-center text-muted-foreground">
          Employee information not found. Please contact your administrator.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
      
      <EmployeeLeaveApplications employeeId={user.employee_id} />

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
