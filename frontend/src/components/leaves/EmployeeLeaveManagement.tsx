import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LeaveApplicationForm from './LeaveApplicationForm';
import EmployeeLeaveApplications from './EmployeeLeaveApplications';
import EmployeeLeaveBalance from './EmployeeLeaveBalance';

const EmployeeLeaveManagement: React.FC = () => {
  const { user } = useAuth();
  const [showNewApplicationDialog, setShowNewApplicationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('applications');

  const handleNewApplicationSuccess = () => {
    setShowNewApplicationDialog(false);
    setActiveTab('applications');
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
            <h1 className="text-xl font-semibold tracking-tight">Leave Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your leave applications and view balances
            </p>
          </div>
          <Button onClick={() => setShowNewApplicationDialog(true)} className="w-full md:w-auto h-9">
            <Plus className="h-4 w-4 mr-1" />
            New Leave
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="applications" className="flex items-center space-x-1 text-sm hover:bg-muted/50 hover:text-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" />
            <span>Applications</span>
          </TabsTrigger>
          <TabsTrigger value="balances" className="flex items-center space-x-1 text-sm hover:bg-muted/50 hover:text-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4" />
            <span>Balances</span>
          </TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <EmployeeLeaveApplications employeeId={user.employee_id!} />
        </TabsContent>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
          <EmployeeLeaveBalance employeeId={user.employee_id!} />
        </TabsContent>
      </Tabs>

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