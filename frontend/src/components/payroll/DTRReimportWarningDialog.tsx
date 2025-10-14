import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

interface ReimportInfo {
  isReimport: boolean;
  requiresWarning: boolean;
  warningMessage?: string;
  additionalWarning?: string;
  lastImport?: {
    id: number;
    file_name: string;
    imported_at: string;
    valid_records: number;
    imported_by_username: string;
  };
  payrollStatus?: string;
  canReimport?: boolean;
  preventionReason?: string;
  message?: string;
}

interface DTRReimportWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reimportInfo: ReimportInfo;
  onContinue: () => void;
  onCancel: () => void;
}

export function DTRReimportWarningDialog({
  open,
  onOpenChange,
  reimportInfo,
  onContinue,
  onCancel,
}: DTRReimportWarningDialogProps) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // If re-import is not allowed (payroll finalized)
  if (!reimportInfo.canReimport && reimportInfo.preventionReason === 'payroll_finalized') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-red-700">
                  Re-import Not Allowed
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Payroll has been finalized for this period
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Error Message */}
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {reimportInfo.message || 'Cannot re-import DTR. Payroll has been finalized for this period.'}
              </AlertDescription>
            </Alert>

            {/* Existing Import Information */}
            {reimportInfo.lastImport && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Existing Import Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Import Date:</span>
                    <span className="font-medium text-gray-900">
                      {formatDateTime(reimportInfo.lastImport.imported_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Imported By:</span>
                    <span className="font-medium text-gray-900">
                      {reimportInfo.lastImport.imported_by_username}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Name:</span>
                    <span className="font-medium text-gray-900 truncate max-w-xs">
                      {reimportInfo.lastImport.file_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Records Imported:</span>
                    <span className="font-medium text-gray-900">
                      {reimportInfo.lastImport.valid_records}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payroll Status:</span>
                    <span className="font-medium text-red-600">
                      {reimportInfo.payrollStatus}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Why can't I re-import?</p>
                  <p>
                    Once payroll has been finalized (status: Completed or Paid), DTR records cannot be modified
                    to maintain data integrity and audit compliance. If you need to make corrections, please
                    contact your system administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // If re-import is allowed but requires warning
  if (reimportInfo.requiresWarning) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-yellow-700">
                  Re-import DTR Data
                </AlertDialogTitle>
                <AlertDialogDescription>
                  DTR data already exists for this period
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning Message */}
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                {reimportInfo.warningMessage || 'DTR data already exists for this period. Re-importing will supersede existing records.'}
              </AlertDescription>
            </Alert>

            {/* Additional Warning (if payroll is processing) */}
            {reimportInfo.additionalWarning && (
              <Alert className="border-orange-500 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-900">
                  {reimportInfo.additionalWarning}
                </AlertDescription>
              </Alert>
            )}

            {/* Existing Import Information */}
            {reimportInfo.lastImport && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Existing Import Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Import Date:</span>
                    <span className="font-medium text-gray-900">
                      {formatDateTime(reimportInfo.lastImport.imported_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Imported By:</span>
                    <span className="font-medium text-gray-900">
                      {reimportInfo.lastImport.imported_by_username}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Name:</span>
                    <span className="font-medium text-gray-900 truncate max-w-xs">
                      {reimportInfo.lastImport.file_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Records Imported:</span>
                    <span className="font-medium text-gray-900">
                      {reimportInfo.lastImport.valid_records}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payroll Status:</span>
                    <span className="font-medium text-gray-900">
                      {reimportInfo.payrollStatus}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* What will happen */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-2">What will happen if you continue?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All existing DTR records for this period will be marked as "Superseded"</li>
                    <li>New DTR records from your uploaded file will be imported</li>
                    <li>The previous import will remain in the history for audit purposes</li>
                    {reimportInfo.payrollStatus === 'Processing' && (
                      <li className="text-orange-700 font-medium">
                        Payroll calculations will need to be recalculated
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onContinue}
              className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
            >
              Continue with Re-import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Default case - should not render if no warning needed
  return null;
}
