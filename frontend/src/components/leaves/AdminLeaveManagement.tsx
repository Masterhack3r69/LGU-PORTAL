import React, { useState } from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import AdminLeaveApplications from './AdminLeaveApplications';
import AdminLeaveApprovals from './AdminLeaveApprovals';
import AdminLeaveBalances from './AdminLeaveBalances';
import AdminLeaveTypes from './AdminLeaveTypes';
import { FileText, BarChart3, Settings } from 'lucide-react';

const AdminLeaveManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('applications');

  return (
    <div className="container mx-auto space-y-4 px-2 sm:px-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-3 pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
        <p className="text-muted-foreground text-sm">Manage employee leave applications, balances, and policies</p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TooltipProvider>
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger 
                  value="applications" 
                  className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Applications</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sm:hidden">
                <p>Leave Applications</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger 
                  value="balances" 
                  className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Balances</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sm:hidden">
                <p>Leave Balances</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger 
                  value="types" 
                  className="flex items-center gap-2 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Leave Types</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="sm:hidden">
                <p>Leave Types Management</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>
        </TooltipProvider>

        <TabsContent value="applications" className="space-y-4 mt-4">
          <AdminLeaveApplications />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4 mt-4">
          <AdminLeaveApprovals />
        </TabsContent>

        <TabsContent value="balances" className="space-y-4 mt-4">
          <AdminLeaveBalances />
        </TabsContent>

        <TabsContent value="types" className="space-y-4 mt-4">
          <AdminLeaveTypes />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLeaveManagement;