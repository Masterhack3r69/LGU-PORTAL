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
import { Users, BarChart3, Settings } from 'lucide-react';

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
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger 
                  value="applications" 
                  className={`flex items-center gap-2 rounded-md transition-all ${
                    activeTab === "overview"
                      ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <Users className="h-4 w-4" />
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
                 className={`flex items-center gap-2 rounded-md transition-all ${
                    activeTab === "overview"
                      ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
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
                  className={`flex items-center gap-2 rounded-md transition-all ${
                    activeTab === "overview"
                      ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
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