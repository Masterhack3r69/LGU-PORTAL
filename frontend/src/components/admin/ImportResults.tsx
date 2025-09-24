// components/admin/ImportResults.tsx - Results display for Excel import
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  Key,
  Download,
  RefreshCw,
  FileText,
  Shield,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import type { ImportExecutionResult } from '@/types/import';
import { importService } from '@/services/importService';
import { toast } from 'sonner';

interface ImportResultsProps {
  result: ImportExecutionResult;
  onStartOver: () => void;
}

const ImportResults: React.FC<ImportResultsProps> = ({ result, onStartOver }) => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [selectedTab, setSelectedTab] = useState('summary');

  // Download password report as CSV
  const handleDownloadPasswordReport = () => {
    if (!result.userAccounts || result.userAccounts.length === 0) {
      toast.error('No user accounts were created');
      return;
    }

    try {
      const blob = importService.exportPasswordReport(result.userAccounts);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employee_passwords_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Password report downloaded successfully');
    } catch (error) {
      console.error('Error downloading password report:', error);
      toast.error('Failed to download password report');
    }
  };

  // Copy password report to clipboard
  const handleCopyPasswordReport = async () => {
    if (!result.userAccounts || result.userAccounts.length === 0) {
      toast.error('No user accounts were created');
      return;
    }

    try {
      const reportText = [
        'Employee Number\tUsername\tEmail\tTemporary Password',
        ...result.userAccounts.map(account => 
          `${account.employee_number}\t${account.username}\t${account.email}\t${account.temporary_password}`
        )
      ].join('\n');

      await navigator.clipboard.writeText(reportText);
      toast.success('Password report copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy password report');
    }
  };

  // Render summary cards
  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-600">{result.summary.successful_imports}</p>
              <p className="text-xs text-muted-foreground">Successful</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-600">{result.summary.failed_imports}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-yellow-600">{result.summary.skipped_rows}</p>
              <p className="text-xs text-muted-foreground">Skipped</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Key className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-blue-600">{result.summary.user_accounts_created}</p>
              <p className="text-xs text-muted-foreground">User Accounts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render import summary
  const renderImportSummary = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import Summary
        </CardTitle>
        <CardDescription>
          Detailed breakdown of the import process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Processing Results</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Processed:</span>
                  <Badge variant="outline">{result.summary.total_processed}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Successfully Imported:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {result.summary.successful_imports}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Failed Imports:</span>
                  <Badge variant="destructive">{result.summary.failed_imports}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Skipped Rows:</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {result.summary.skipped_rows}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <Badge variant="outline">{result.summary.success_rate}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">User Accounts</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Accounts Created:</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {result.summary.user_accounts_created}
                  </Badge>
                </div>
                {result.passwordReport && (
                  <>
                    <div className="flex justify-between">
                      <span>Password Strategy:</span>
                      <Badge variant="outline">
                        {result.passwordReport.strategy_used.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {result.summary.successful_imports > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Import Completed Successfully!</strong> {result.summary.successful_imports} employees 
                have been imported and are now available in the system.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render created employees
  const renderCreatedEmployees = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Created Employees ({result.createdEmployees.length})
        </CardTitle>
        <CardDescription>
          Employees successfully imported into the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result.createdEmployees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No employees were successfully imported
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {result.createdEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{employee.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {employee.employee_number}
                      {employee.email && ` • ${employee.email}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Imported
                    </Badge>
                    {employee.user_account_created && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Key className="h-3 w-3 mr-1" />
                        Account
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  // Render password report
  const renderPasswordReport = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Password Report ({result.userAccounts.length})
        </CardTitle>
        <CardDescription>
          Temporary passwords for created user accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result.userAccounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No user accounts were created
          </div>
        ) : (
          <div className="space-y-4">
            {/* Password Instructions */}
            {result.passwordReport && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Password Strategy:</strong> {result.passwordReport.instructions}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button onClick={handleDownloadPasswordReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
              <Button onClick={handleCopyPasswordReport} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button
                onClick={() => setShowPasswords(!showPasswords)}
                variant="outline"
                size="sm"
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Passwords
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Passwords
                  </>
                )}
              </Button>
            </div>

            {/* Password List */}
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {result.userAccounts.map((account) => (
                  <div
                    key={account.employee_number}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{account.employee_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {account.username} • {account.email}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">
                        {showPasswords ? account.temporary_password : '••••••••'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Security Recommendations */}
            {result.passwordReport && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Recommendations:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    {result.passwordReport.security_recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render errors
  const renderErrors = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-destructive" />
          Import Errors ({result.errors.length})
        </CardTitle>
        <CardDescription>
          Issues encountered during the import process
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result.errors.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>No errors encountered during import</span>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {result.errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Import Results</h3>
          <p className="text-muted-foreground">
            {result.summary.success_rate} success rate • {result.summary.successful_imports} employees imported
          </p>
        </div>
        <Button onClick={onStartOver} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Import More Employees
        </Button>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Detailed Results */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="employees">
            Employees
            {result.createdEmployees.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {result.createdEmployees.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="passwords">
            Passwords
            {result.userAccounts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {result.userAccounts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="errors">
            Errors
            {result.errors.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {result.errors.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {renderImportSummary()}
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          {renderCreatedEmployees()}
        </TabsContent>

        <TabsContent value="passwords" className="space-y-4">
          {renderPasswordReport()}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {renderErrors()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportResults;