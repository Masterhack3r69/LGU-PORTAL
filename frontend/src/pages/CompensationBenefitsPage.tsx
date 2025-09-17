import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Gift, User, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { employeeService } from '@/services/employeeService';
import type { Employee } from '@/types/employee';
import { BenefitsWorkflow } from '@/components/BenefitsWorkflow';

export const CompensationBenefitsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';
  
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Load employees
  const loadEmployees = useCallback(async () => {
    try {
      const response = await employeeService.getEmployees({});
      setEmployees(response.employees);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Access control
  if (!isAdmin && !isEmployee) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Please log in to access the compensation and benefits system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Gift className="mr-2 h-6 w-6" />
            Compensation & Benefits
          </h1>
          <p className="text-gray-600">
            {isAdmin 
              ? "Manage employee compensation benefits selection and approval" 
              : "Select and manage your compensation benefits"}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">User Role</div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
          }`}>
            <User className="mr-1 h-3 w-3" />
            {isAdmin ? "Administrator" : "Employee"}
          </div>
        </div>
      </div>

      {/* Benefits Workflow Component */}
      <BenefitsWorkflow 
        employees={employees}
        isAdmin={isAdmin}
        user={user}
      />

      {/* Information Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>How Benefits System Works</AlertTitle>
        <AlertDescription>
          {isAdmin 
            ? "As an administrator, you can select employees and manage their benefit selections. You can review, approve, and process benefit selections for all employees."
            : "You can select and manage your annual compensation benefits. Submit your selections for administrative review and approval."}
        </AlertDescription>
      </Alert>
    </div>
  );
};