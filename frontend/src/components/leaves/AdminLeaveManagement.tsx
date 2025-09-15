import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLeaveApplications from './AdminLeaveApplications';
import AdminLeaveApprovals from './AdminLeaveApprovals';
import AdminLeaveBalances from './AdminLeaveBalances';
import AdminLeaveTypes from './AdminLeaveTypes';
import { Users, CheckSquare, BarChart3, Settings } from 'lucide-react';

const AdminLeaveManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('applications');

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <p className="text-muted-foreground">Manage employee leave applications, balances, and policies</p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="applications" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Applications</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center space-x-2">
            <CheckSquare className="h-4 w-4" />
            <span>Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="balances" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Balances</span>
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Leave Types</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <AdminLeaveApplications />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <AdminLeaveApprovals />
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <AdminLeaveBalances />
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <AdminLeaveTypes />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLeaveManagement;