// pages/admin/EmployeeImportPage.tsx - Employee Import Management Page
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Upload, 
  Shield, 
  FileSpreadsheet,
  Info
} from 'lucide-react';
import ExcelImport from '@/components/admin/ExcelImport';
import type { ImportExecutionResult } from '@/types/import';
import { toast } from 'sonner';

const EmployeeImportPage: React.FC = () => {
  const handleImportComplete = (result: ImportExecutionResult) => {
    // Handle successful import
    console.log('Import completed:', result);
    
    // Show success notification
    if (result.summary.successful_imports > 0) {
      toast.success(
        `Successfully imported ${result.summary.successful_imports} employees!`,
        {
          description: `${result.summary.user_accounts_created} user accounts created`
        }
      );
    }
    
    // You can add additional logic here, such as:
    // - Refreshing employee lists
    // - Updating dashboard statistics
    // - Sending notifications to other admins
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Import</h1>
          <p className="text-muted-foreground mt-2">
            Bulk import employee data from Excel files with automatic user account creation
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Admin Only
        </Badge>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Supported Formats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">• Excel (.xlsx, .xls)</div>
              <div className="text-sm">• CSV files</div>
              <div className="text-xs text-muted-foreground">Max size: 10MB</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">• User account creation</div>
              <div className="text-sm">• Leave balance setup</div>
              <div className="text-sm">• Data validation</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">1. Download template</div>
              <div className="text-sm">2. Fill employee data</div>
              <div className="text-sm">3. Upload & import</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Before importing:</strong> Ensure all employee numbers are unique and email addresses are valid. 
          The system will automatically create user accounts for employees with email addresses and initialize their leave balances.
        </AlertDescription>
      </Alert>

      {/* Main Import Component */}
      <ExcelImport onImportComplete={handleImportComplete} />

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Import Guidelines</CardTitle>
          <CardDescription>
            Follow these guidelines for successful employee imports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Required Fields</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>• Employee Number</div>
              <div>• First Name</div>
              <div>• Last Name</div>
              <div>• Sex/Gender</div>
              <div>• Birth Date</div>
              <div>• Appointment Date</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Optional Fields</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div>• Middle Name</div>
              <div>• Email Address</div>
              <div>• Contact Number</div>
              <div>• Position</div>
              <div>• Salary Information</div>
              <div>• Government IDs</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Password Generation</h4>
            <div className="text-sm space-y-1">
              <div>• <strong>Custom Pattern (Default):</strong> Employee number + birth day/month</div>
              <div>• <strong>Employee Number:</strong> Uses employee number as password</div>
              <div>• <strong>Birth Date:</strong> Uses birth date (DDMMYYYY) format</div>
              <div>• <strong>Random:</strong> Generates secure random passwords</div>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Security Note:</strong> All employees should change their passwords on first login. 
              Temporary passwords will be provided in the import results for secure distribution.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeImportPage;