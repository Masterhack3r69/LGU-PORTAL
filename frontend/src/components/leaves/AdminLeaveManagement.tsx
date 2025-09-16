import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Users, CheckSquare, BarChart3, Settings } from 'lucide-react';

const AdminLeaveManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('applications');

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <h1 className="text-xl font-semibold tracking-tight">Leave Management </h1>
        <p className="text-muted-foreground text-sm sm:text-base">Manage employee leave applications, balances, and policies</p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TooltipProvider>
          <TabsList className="grid w-full grid-cols-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="applications" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <Users className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Applications</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>Leave Applications</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="approvals" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <CheckSquare className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Approvals</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>Leave Approvals</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="balances" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <BarChart3 className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Balances</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>Leave Balances</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="types" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <Settings className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Leave Types</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>Leave Types Management</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>
        </TooltipProvider>

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