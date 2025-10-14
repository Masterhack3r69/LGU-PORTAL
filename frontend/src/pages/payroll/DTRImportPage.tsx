import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { showToast } from "@/lib/toast";
import {
  CheckCircle2,
  Upload,
  FileCheck,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { DTRTemplateExport } from "@/components/payroll/DTRTemplateExport";
import {
  DTRFileUpload,
  type DTRPreviewData,
} from "@/components/payroll/DTRFileUpload";
import { DTRImportPreview } from "@/components/payroll/DTRImportPreview";
import { DTRReimportWarningDialog } from "@/components/payroll/DTRReimportWarningDialog";
import { DTRImportHistory } from "@/components/payroll/DTRImportHistory";
import dtrService from "@/services/dtrService";
import payrollService from "@/services/payrollService";

type ImportStep = "upload" | "preview" | "complete";

interface PayrollPeriod {
  id: number;
  year: number;
  month: number;
  period_number: number;
  start_date: string;
  end_date: string;
  status: string;
}

export function DTRImportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const periodId = searchParams.get("periodId");

  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [previewData, setPreviewData] = useState<DTRPreviewData | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    batchId: number;
    recordsImported: number;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReimportDialog, setShowReimportDialog] = useState(false);
  const [reimportInfo, setReimportInfo] = useState<any>(null);

  useEffect(() => {
    if (!periodId) {
      setError("No payroll period specified");
      setLoading(false);
      return;
    }

    loadPeriod();
  }, [periodId]);

  const loadPeriod = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getPeriods();

      if (response.success) {
        const responseData = response.data as
          | { periods?: PayrollPeriod[] }
          | PayrollPeriod[];
        const periodsData = Array.isArray(responseData)
          ? responseData
          : responseData.periods || [];

        const foundPeriod = periodsData.find(
          (p: PayrollPeriod) => p.id === parseInt(periodId!)
        );

        if (foundPeriod) {
          // Check if period status allows DTR import
          const status = foundPeriod.status?.toLowerCase();
          if (status !== "draft" && status !== "open") {
            setError(
              `DTR import is not allowed for ${foundPeriod.status} periods. ` +
                `The payroll has already been processed. Please reopen the period if you need to make changes.`
            );
            setPeriod(foundPeriod); // Still set period for display purposes
          } else {
            setPeriod(foundPeriod);
          }
        } else {
          setError("Payroll period not found");
        }
      } else {
        setError("Failed to load payroll period");
      }
    } catch (err) {
      console.error("Failed to load period:", err);
      setError("Failed to load payroll period");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (data: any) => {
    // Check if there's re-import information
    if (data.reimportInfo && data.reimportInfo.requiresWarning) {
      setReimportInfo(data.reimportInfo);
      setPreviewData(data);
      setShowReimportDialog(true);
    } else if (data.reimportInfo && data.reimportInfo.canReimport === false) {
      // Show error dialog for finalized payroll (only if explicitly false)
      setReimportInfo(data.reimportInfo);
      setShowReimportDialog(true);
    } else {
      // No re-import warning needed, proceed to preview
      setPreviewData(data);
      setCurrentStep("preview");
    }
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleConfirmImport = async () => {
    if (!periodId || !previewData) return;

    try {
      setIsConfirming(true);

      const result = await dtrService.confirmImport(parseInt(periodId));

      setImportSummary(result);
      setCurrentStep("complete");

      showToast.success(
        "Import Completed Successfully",
        `${result.recordsImported} records imported`
      );
    } catch (err: any) {
      console.error("Failed to confirm import:", err);

      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        "Failed to complete import. Please try again.";

      showToast.error("Import Failed", errorMessage);
      setError(errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewData(null);
    setCurrentStep("upload");
  };

  const handleBackToPayroll = () => {
    navigate("/payroll/management");
  };

  const handleStartNewImport = () => {
    setPreviewData(null);
    setImportSummary(null);
    setCurrentStep("upload");
    setError(null);
  };

  const handleReimportContinue = () => {
    setShowReimportDialog(false);
    // Proceed to preview step
    if (previewData) {
      setCurrentStep("preview");
    }
  };

  const handleReimportCancel = () => {
    setShowReimportDialog(false);
    setPreviewData(null);
    setReimportInfo(null);
    setCurrentStep("upload");
  };

  const getPeriodName = () => {
    if (!period) return "";
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${monthNames[period.month - 1]} ${period.year} - Period ${
      period.period_number
    }`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleBackToPayroll}
              variant="ghost"
              size="sm"
              className="w-fit"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payroll Management
            </Button>

            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                DTR Import
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Import Daily Time Record data for payroll processing
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading payroll period...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - show error and prevent import
  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  DTR Import
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Import Daily Time Record data for payroll processing
                </p>
              </div>
              {period && (
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {getPeriodName()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(period.start_date)} -{" "}
                    {formatDate(period.end_date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            {!periodId && (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <Calendar className="h-16 w-16 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Select a Payroll Period</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    To import DTR data, you need to select a payroll period first. 
                    Go to Payroll Management and choose the period you want to import data for.
                  </p>
                </div>
                <Button onClick={handleBackToPayroll} size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to Payroll Management
                </Button>
              </div>
            )}
            
            {periodId && period && (
              <div className="flex justify-center pt-4">
                <Button onClick={handleBackToPayroll} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Payroll Management
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleBackToPayroll}
            variant="ghost"
            size="sm"
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payroll Management
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                DTR Import
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Import Daily Time Record data for payroll processing
              </p>
            </div>
            {period && (
              <div className="flex flex-col items-start sm:items-end gap-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{getPeriodName()}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(period.start_date)} -{" "}
                  {formatDate(period.end_date)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            {/* Step 1: Upload */}
            <div className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-colors
                  ${
                    currentStep === "upload"
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep === "preview" || currentStep === "complete"
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-muted bg-background text-muted-foreground"
                  }
                `}
              >
                {currentStep === "preview" || currentStep === "complete" ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </div>
              <span
                className={`ml-2 text-xs sm:text-sm font-medium ${
                  currentStep === "upload"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Upload
              </span>
            </div>

            {/* Connector */}
            <div
              className={`h-0.5 w-8 sm:w-16 transition-colors ${
                currentStep === "preview" || currentStep === "complete"
                  ? "bg-green-600"
                  : "bg-border"
              }`}
            />

            {/* Step 2: Preview */}
            <div className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-colors
                  ${
                    currentStep === "preview"
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep === "complete"
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-muted bg-background text-muted-foreground"
                  }
                `}
              >
                {currentStep === "complete" ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <FileCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </div>
              <span
                className={`ml-2 text-xs sm:text-sm font-medium ${
                  currentStep === "preview"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Preview
              </span>
            </div>

            {/* Connector */}
            <div
              className={`h-0.5 w-8 sm:w-16 transition-colors ${
                currentStep === "complete" ? "bg-green-600" : "bg-border"
              }`}
            />

            {/* Step 3: Complete */}
            <div className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-colors
                  ${
                    currentStep === "complete"
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-muted bg-background text-muted-foreground"
                  }
                `}
              >
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span
                className={`ml-2 text-xs sm:text-sm font-medium ${
                  currentStep === "complete"
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
              >
                Complete
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="space-y-6">
        {/* Upload Step */}
        {currentStep === "upload" && period && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Export Template (Optional)</CardTitle>
                <CardDescription>
                  Download a pre-filled template with employee information to
                  make data entry easier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DTRTemplateExport
                  periodId={period.id}
                  periodName={getPeriodName()}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Upload DTR File</CardTitle>
                <CardDescription>
                  Upload your completed DTR Excel file. The system will validate
                  the data and show you a preview.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DTRFileUpload
                  periodId={period.id}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                />
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Import History */}
            <DTRImportHistory periodId={period.id} />
          </>
        )}

        {/* Preview Step */}
        {currentStep === "preview" && previewData && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Review and Confirm</CardTitle>
              <CardDescription>
                Review the validation results and confirm the import if
                everything looks correct.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DTRImportPreview
                previewData={previewData}
                onConfirm={handleConfirmImport}
                onCancel={handleCancelPreview}
                isConfirming={isConfirming}
              />
            </CardContent>
          </Card>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && importSummary && (
          <>
            <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-green-700 dark:text-green-400">
                    Import Completed Successfully!
                  </CardTitle>
                  <CardDescription>
                    Your DTR data has been imported and is ready for payroll
                    processing.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      Batch ID
                    </p>
                    <p className="text-2xl font-bold">
                      #{importSummary.batchId}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-green-500/20 bg-green-50 dark:bg-green-900/10">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      Records Imported
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {importSummary.recordsImported}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-purple-500/20 bg-purple-50 dark:bg-purple-900/10">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      Period
                    </p>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                      {getPeriodName()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Success Message */}
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/10">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-900 dark:text-green-300">
                  {importSummary.message}
                </AlertDescription>
              </Alert>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>
                      Review the imported DTR records in the Payroll Management
                      page
                    </li>
                    <li>
                      Make any necessary adjustments to working days if needed
                    </li>
                    <li>Process payroll for this period when ready</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  onClick={handleBackToPayroll}
                  size="lg"
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Payroll Management
                </Button>
                <Button
                  onClick={handleStartNewImport}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Import Another File
                </Button>
              </div>
            </CardContent>
            </Card>

            {/* Import History */}
            {period && <DTRImportHistory periodId={period.id} />}
          </>
        )}
      </div>

      {/* Re-import Warning Dialog */}
      {reimportInfo && (
        <DTRReimportWarningDialog
          open={showReimportDialog}
          onOpenChange={setShowReimportDialog}
          reimportInfo={reimportInfo}
          onContinue={handleReimportContinue}
          onCancel={handleReimportCancel}
        />
      )}
    </div>
  );
}
