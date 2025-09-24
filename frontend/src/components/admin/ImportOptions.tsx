// components/admin/ImportOptions.tsx - Import configuration options
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { 
  Key, 
  Users, 
  Shield, 
  ArrowLeft,
  Play,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import type { ImportOptions, ImportPreviewData } from '@/types/import';
import { importService } from '@/services/importService';

interface ImportOptionsProps {
  options: ImportOptions;
  onChange: (options: ImportOptions) => void;
  previewData: ImportPreviewData | null;
  onExecute: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const ImportOptionsComponent: React.FC<ImportOptionsProps> = ({
  options,
  onChange,
  previewData,
  onExecute,
  onBack,
  isLoading
}) => {
  const passwordStrategies = importService.getPasswordStrategies();

  const handleOptionChange = (key: keyof ImportOptions, value: any) => {
    onChange({
      ...options,
      [key]: value
    });
  };

  const getPasswordStrategyInfo = (strategy: string) => {
    return importService.getPasswordStrategyDescription(strategy);
  };

  const emailCount = previewData?.previewData.filter(row => 
    !row.hasErrors && row.data.email_address
  ).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Import Configuration</h3>
        <p className="text-muted-foreground">
          Configure how the employee data should be imported and user accounts created.
        </p>
      </div>

      {/* Summary */}
      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Import Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{previewData.validRows}</div>
                <div className="text-sm text-muted-foreground">Valid Employees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{emailCount}</div>
                <div className="text-sm text-muted-foreground">With Email</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{previewData.invalidRows}</div>
                <div className="text-sm text-muted-foreground">Invalid Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{previewData.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Account Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            User Account Creation
          </CardTitle>
          <CardDescription>
            Configure automatic user account creation for employees with email addresses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create User Accounts Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="create-accounts">Create User Accounts</Label>
              <div className="text-sm text-muted-foreground">
                Automatically create login accounts for employees with email addresses
              </div>
            </div>
            <Switch
              id="create-accounts"
              checked={options.create_user_accounts}
              onCheckedChange={(checked) => handleOptionChange('create_user_accounts', checked)}
            />
          </div>

          {options.create_user_accounts && (
            <>
              <Separator />
              
              {/* Password Strategy */}
              <div className="space-y-4">
                <Label>Password Generation Strategy</Label>
                <RadioGroup
                  value={options.password_strategy}
                  onValueChange={(value) => handleOptionChange('password_strategy', value)}
                >
                  {Object.entries(passwordStrategies).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={key} id={key} />
                        <Label htmlFor={key} className="font-medium">{label}</Label>
                        {key === 'custom_pattern' && (
                          <Badge variant="secondary">Recommended</Badge>
                        )}
                      </div>
                      <div className="ml-6 text-sm text-muted-foreground">
                        {getPasswordStrategyInfo(key)}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Password Security Alert */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong> All generated passwords are temporary. 
                  Employees must change their passwords on first login. A password report 
                  will be generated for secure distribution to employees.
                </AlertDescription>
              </Alert>

              {/* Account Creation Summary */}
              {emailCount > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{emailCount} user accounts</strong> will be created for employees with email addresses.
                    Employees without email addresses will be imported without user accounts.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Import Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Behavior
          </CardTitle>
          <CardDescription>
            Configure how the import process should handle errors and data initialization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skip Invalid Rows */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="skip-invalid">Skip Invalid Rows</Label>
              <div className="text-sm text-muted-foreground">
                Continue importing valid rows even if some rows have validation errors
              </div>
            </div>
            <Switch
              id="skip-invalid"
              checked={options.skip_invalid_rows}
              onCheckedChange={(checked) => handleOptionChange('skip_invalid_rows', checked)}
            />
          </div>

          <Separator />

          {/* Initialize Leave Balances */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="init-leave">Initialize Leave Balances</Label>
              <div className="text-sm text-muted-foreground">
                Automatically set up leave balances for the current year based on appointment date
              </div>
            </div>
            <Switch
              id="init-leave"
              checked={options.initialize_leave_balances}
              onCheckedChange={(checked) => handleOptionChange('initialize_leave_balances', checked)}
            />
          </div>

          {/* Error Handling Alert */}
          {previewData && previewData.invalidRows > 0 && (
            <Alert variant={options.skip_invalid_rows ? "default" : "destructive"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {options.skip_invalid_rows ? (
                  <>
                    <strong>{previewData.invalidRows} invalid rows</strong> will be skipped during import. 
                    Only {previewData.validRows} valid rows will be processed.
                  </>
                ) : (
                  <>
                    <strong>Import will fail</strong> if any of the {previewData.invalidRows} invalid rows 
                    are encountered. Consider enabling "Skip Invalid Rows" or fix the errors in your Excel file.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Final Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Ready to Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="font-medium">Import Configuration:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• {previewData?.validRows || 0} employees will be imported</li>
                  <li>• {options.create_user_accounts ? `${emailCount} user accounts will be created` : 'No user accounts will be created'}</li>
                  <li>• {options.skip_invalid_rows ? 'Invalid rows will be skipped' : 'Import will stop on first error'}</li>
                  <li>• {options.initialize_leave_balances ? 'Leave balances will be initialized' : 'Leave balances will not be initialized'}</li>
                </ul>
              </div>
              
              {options.create_user_accounts && (
                <div className="space-y-2">
                  <div className="font-medium">Password Strategy:</div>
                  <div className="text-muted-foreground">
                    {passwordStrategies[options.password_strategy || 'custom_pattern']}
                  </div>
                </div>
              )}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. Make sure you have reviewed the preview data 
                and configured the options correctly before proceeding.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Preview
        </Button>

        <Button 
          onClick={onExecute} 
          disabled={isLoading || !previewData || previewData.validRows === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          <Play className="h-4 w-4 mr-2" />
          {isLoading ? 'Importing...' : `Import ${previewData?.validRows || 0} Employees`}
        </Button>
      </div>
    </div>
  );
};

export default ImportOptionsComponent;