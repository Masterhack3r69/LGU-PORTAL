// pages/admin/EmployeeImportPage.tsx - Employee Import Management Page
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Upload, FileSpreadsheet, Info } from "lucide-react";
import ExcelImport from "@/components/admin/ExcelImport";
import type { ImportExecutionResult } from "@/types/import";
import { showToast } from "@/lib/toast";

const EmployeeImportPage: React.FC = () => {
  const handleImportComplete = (result: ImportExecutionResult) => {
    // Handle successful import
    console.log("Import completed:", result);

    // Show success notification
    if (result.summary.successful_imports > 0) {
      showToast.success(
        `Successfully imported ${result.summary.successful_imports} employees!`,
        `${result.summary.user_accounts_created} user accounts created`
      );
    }

    // You can add additional logic here, such as:
    // - Refreshing employee lists
    // - Updating dashboard statistics
    // - Sending notifications to other admins
  };

  return (
    <div className="container space-y-6">
      {/* Page Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Employee Import
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Bulk import employee data from Excel files with automatic user
              account creation
            </p>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Supported Formats
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Excel (.xlsx, .xls)
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                CSV files
              </div>
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-gray-50 rounded">
                Max size: 10MB
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Features</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                User account creation
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Leave balance setup
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Data validation
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Process</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </div>
                Download template
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </div>
                Fill employee data
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </div>
                Upload & import
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Information */}
      <Alert className="border-l-4 border-l-amber-500 bg-amber-50">
        <AlertDescription className="text-amber-800">
          <strong>Before importing:</strong> Ensure all employee numbers are
          unique and email addresses are valid. The system will automatically
          create user accounts for employees with email addresses and initialize
          their leave balances.
        </AlertDescription>
      </Alert>

      {/* Main Import Component */}
      <ExcelImport onImportComplete={handleImportComplete} />

      {/* Additional Information */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            Import Guidelines
          </CardTitle>
          <CardDescription>
            Follow these guidelines for successful employee imports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Required Fields
              </h4>
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-1 gap-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                    Employee Number
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                    First Name
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                    Last Name
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                    Sex/Gender
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                    Birth Date
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                    Appointment Date
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Optional Fields
              </h4>
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-1 gap-1 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    Middle Name
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    Email Address
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    Contact Number
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    Position
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    Salary Information
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    Government IDs
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-purple-700">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Password Generation Options
            </h4>
            <div className="bg-purple-50 p-4 rounded-lg space-y-3">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-purple-800">
                      Custom Pattern (Default):
                    </strong>
                    <p className="text-purple-700">
                      Employee number + birth day/month
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-purple-800">
                      Employee Number:
                    </strong>
                    <p className="text-purple-700">
                      Uses employee number as password
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-purple-800">Birth Date:</strong>
                    <p className="text-purple-700">
                      Uses birth date (DDMMYYYY) format
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                    4
                  </div>
                  <div>
                    <strong className="text-purple-800">Random:</strong>
                    <p className="text-purple-700">
                      Generates secure random passwords
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Alert className="border-l-4 border-l-red-500 bg-red-50">
            <AlertDescription className="text-red-800">
              <strong>Security Note:</strong> All employees should change their
              passwords on first login. Temporary passwords will be provided in
              the import results for secure distribution.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeImportPage;
