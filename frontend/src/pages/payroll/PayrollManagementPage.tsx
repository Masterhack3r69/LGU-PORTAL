import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showToast } from "@/lib/toast";
import {
  Calculator,
  Settings,
  Calendar,
  DollarSign,
  Upload,
  FileSpreadsheet,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  Lock,
} from "lucide-react";
import payrollService from "@/services/payrollService";
import dtrService, { type DTRStats } from "@/services/dtrService";
import { PayrollAdjustments } from "@/components/payroll/PayrollAdjustments";
import { DTRRecordsTable } from "@/components/payroll/DTRRecordsTable";
import { PayrollItemsTable } from "@/components/payroll/PayrollItemsTable";
import type {
  PayrollPeriod,
  PayrollSummary,
  PayrollItem,
} from "@/types/payroll";

export function PayrollManagementPage() {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(
    null
  );
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("processing");

  // DTR-related state
  const [dtrStats, setDtrStats] = useState<DTRStats | null>(null);
  const [loadingDtrStats, setLoadingDtrStats] = useState(false);
  const [showDtrRecordsDialog, setShowDtrRecordsDialog] = useState(false);

  // Payroll processing state
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [processingLoading, setProcessingLoading] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadSummary(selectedPeriod.id);
      loadDTRStats(selectedPeriod.id);
      loadPayrollItems(selectedPeriod.id);
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const response = await payrollService.getPeriods();
      if (response.success) {
        const responseData = response.data as
          | { periods?: PayrollPeriod[] }
          | PayrollPeriod[];
        const periodsData = Array.isArray(responseData)
          ? responseData
          : responseData.periods || [];
        setPeriods(Array.isArray(periodsData) ? periodsData : []);
        if (periodsData.length > 0 && !selectedPeriod) {
          setSelectedPeriod(periodsData[0]);
        }
      } else {
        showToast.error("Failed to load payroll periods");
      }
    } catch (error) {
      console.error("Failed to load payroll periods:", error);
      showToast.error("Failed to load payroll periods");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (periodId: number) => {
    try {
      const response = await payrollService.getPayrollSummary(periodId);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error("Failed to load summary:", error);
    }
  };

  const loadDTRStats = async (periodId: number) => {
    try {
      setLoadingDtrStats(true);
      const stats = await dtrService.getDTRStats(periodId);
      setDtrStats(stats);
    } catch (error) {
      console.error("Failed to load DTR stats:", error);
      setDtrStats(null);
    } finally {
      setLoadingDtrStats(false);
    }
  };

  const loadPayrollItems = async (periodId: number) => {
    try {
      const response = await payrollService.getPayrollItems({
        period_id: periodId,
      });
      if (response.success) {
        setPayrollItems(response.data);
      }
    } catch (error) {
      console.error("Failed to load payroll items:", error);
    }
  };

  const handleCalculatePayroll = async () => {
    if (!selectedPeriod) return;

    // Check if DTR data exists
    if (!dtrStats?.hasImport) {
      showToast.error(
        "No DTR Data",
        "Please import DTR data before processing payroll"
      );
      return;
    }

    setProcessingLoading(true);
    try {
      const response = await payrollService.calculatePayroll({
        period_id: selectedPeriod.id,
      });

      if (response.success) {
        const processedCount = response.data.processed_count;
        showToast.success(
          "Payroll Processed",
          `Successfully processed ${processedCount} employees`
        );
        await loadPayrollItems(selectedPeriod.id);
        await handlePeriodUpdate();
      }
    } catch (error: any) {
      console.error("Failed to calculate payroll:", error);
      showToast.error(
        "Processing Failed",
        error.response?.data?.error?.message || "Failed to calculate payroll"
      );
    } finally {
      setProcessingLoading(false);
    }
  };

  const handlePeriodUpdate = async () => {
    // Reload periods to get updated status
    const response = await payrollService.getPeriods();
    if (response.success) {
      const responseData = response.data as
        | { periods?: PayrollPeriod[] }
        | PayrollPeriod[];
      const periodsData = Array.isArray(responseData)
        ? responseData
        : responseData.periods || [];
      setPeriods(Array.isArray(periodsData) ? periodsData : []);

      // Update the selected period with fresh data
      if (selectedPeriod) {
        const updatedPeriod = periodsData.find(
          (p: PayrollPeriod) => p.id === selectedPeriod.id
        );
        if (updatedPeriod) {
          setSelectedPeriod(updatedPeriod);
        }
        await loadSummary(selectedPeriod.id);
        await loadDTRStats(selectedPeriod.id);
      }
    }
  };

  const handleImportDTR = () => {
    if (selectedPeriod) {
      navigate(`/payroll/dtr-import?periodId=${selectedPeriod.id}`);
    }
  };

  const handleViewDTRRecords = () => {
    setShowDtrRecordsDialog(true);
  };

  const handleCompletePeriod = async () => {
    if (!selectedPeriod) return;

    // Verify all payroll items are paid
    const allPaid = payrollItems.every(item => item.status?.toLowerCase() === "paid");
    if (!allPaid) {
      showToast.error(
        "Cannot Complete Period",
        "All payroll items must be marked as paid before completing the period"
      );
      return;
    }

    setProcessingLoading(true);
    try {
      const response = await payrollService.finalizePeriod(selectedPeriod.id);
      
      if (response.success) {
        showToast.success(
          "Period Completed",
          "Payroll period has been completed and locked successfully"
        );
        // Refresh all data to show updated status
        await loadPayrollItems(selectedPeriod.id);
        await handlePeriodUpdate();
      } else {
        showToast.error(
          "Failed to Complete Period",
          response.message || "Could not complete the payroll period"
        );
      }
    } catch (error: any) {
      console.error("Failed to complete period:", error);
      showToast.error(
        "Failed to Complete Period",
        error.response?.data?.error?.message || "Could not complete the payroll period"
      );
    } finally {
      setProcessingLoading(false);
    }
  };

  const handleBulkFinalize = async () => {
    if (!selectedPeriod) return;

    const processedItems = payrollItems.filter(
      (item) => item.status?.toLowerCase() === "processed"
    );

    if (processedItems.length === 0) {
      showToast.error("No processed items to finalize");
      return;
    }

    setProcessingLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const item of processedItems) {
        try {
          const response = await payrollService.approvePayrollItem(item.id);
          if (response.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error(`Failed to finalize item ${item.id}:`, error);
        }
      }

      if (successCount > 0) {
        showToast.success(
          `Finalized ${successCount} payroll item${successCount > 1 ? "s" : ""}${
            failCount > 0 ? `, ${failCount} failed` : ""
          }`
        );
        await loadPayrollItems(selectedPeriod.id);
        await loadSummary(selectedPeriod.id);
        await handlePeriodUpdate();
      } else {
        showToast.error("Failed to finalize payroll items");
      }
    } catch (error) {
      console.error("Failed to bulk finalize:", error);
      showToast.error("Failed to finalize payroll items");
    } finally {
      setProcessingLoading(false);
    }
  };

  const handleBulkMarkPaid = async () => {
    if (!selectedPeriod) return;

    const finalizedItems = payrollItems.filter(
      (item) => item.status?.toLowerCase() === "finalized"
    );

    if (finalizedItems.length === 0) {
      showToast.error("No finalized items to mark as paid");
      return;
    }

    setProcessingLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const item of finalizedItems) {
        try {
          const response = await payrollService.markAsPaid(item.id);
          if (response.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error(`Failed to mark item ${item.id} as paid:`, error);
        }
      }

      if (successCount > 0) {
        showToast.success(
          `Marked ${successCount} payroll item${successCount > 1 ? "s" : ""} as paid${
            failCount > 0 ? `, ${failCount} failed` : ""
          }`
        );
        await loadPayrollItems(selectedPeriod.id);
        await loadSummary(selectedPeriod.id);
        await handlePeriodUpdate();
      } else {
        showToast.error("Failed to mark payroll items as paid");
      }
    } catch (error) {
      console.error("Failed to bulk mark as paid:", error);
      showToast.error("Failed to mark payroll items as paid");
    } finally {
      setProcessingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const variants = {
      draft: "secondary",
      processing: "default",
      completed: "outline",
      finalized: "outline",
      paid: "destructive",
      open: "secondary",
      calculating: "default",
      locked: "destructive",
    } as const;

    const displayNames: { [key: string]: string } = {
      draft: "Draft",
      processing: "Processing",
      completed: "Completed",
      finalized: "Finalized",
      paid: "Paid",
      open: "Open",
      calculating: "Calculating",
      locked: "Locked",
    };

    const displayName = displayNames[statusLower] || status;
    const variant = variants[statusLower as keyof typeof variants] || "default";

    return <Badge variant={variant}>{displayName}</Badge>;
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date =
        typeof dateString === "string" ? new Date(dateString) : dateString;
      return date.toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const getMonthName = (year: number, month: number) => {
    return new Date(year, month - 1).toLocaleString("default", {
      month: "long",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Payroll Management
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Process payroll calculations and make adjustments
            </p>
          </div>
          {selectedPeriod && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {getMonthName(selectedPeriod.year, selectedPeriod.month)}{" "}
                {selectedPeriod.year} - Period {selectedPeriod.period_number}
              </span>
              {getStatusBadge(selectedPeriod.status)}
            </div>
          )}
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payroll Periods
          </CardTitle>
          <CardDescription>
            Select a payroll period to process or make adjustments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {periods.map((period) => (
              <div
                key={period.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedPeriod?.id === period.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedPeriod(period)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-sm">
                    Period {period.period_number}
                  </div>
                  {getStatusBadge(period.status)}
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {getMonthName(period.year, period.month)} {period.year}
                  </div>

                  {period.start_date && period.end_date && (
                    <div className="text-xs text-muted-foreground">
                      {formatDate(period.start_date)} -{" "}
                      {formatDate(period.end_date)}
                    </div>
                  )}

                  {period.total_net_pay && (
                    <div className="flex items-center gap-1 text-xs">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium">
                        {formatCurrency(period.total_net_pay)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {periods.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payroll periods found</p>
              <Button variant="outline" size="sm" className="mt-2">
                Create New Period
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      {selectedPeriod ? (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="processing" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Processing
            </TabsTrigger>
            <TabsTrigger
              value="adjustments"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Adjustments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="processing" className="space-y-6">
            {/* DTR Import Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Daily Time Record (DTR)
                </CardTitle>
                <CardDescription>
                  Import and manage employee attendance data for payroll
                  processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* DTR Status Alert */}
                {!loadingDtrStats && (
                  <>
                    {dtrStats?.hasImport ? (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-900">
                          DTR Data Imported
                        </AlertTitle>
                        <AlertDescription className="text-green-800">
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span className="font-medium">
                                {dtrStats.totalEmployees} employees
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">
                                {dtrStats.totalWorkingDays.toFixed(2)} total
                                working days
                              </span>
                            </div>
                            {dtrStats.lastImportDate && (
                              <div className="text-sm">
                                Last imported:{" "}
                                {new Date(
                                  dtrStats.lastImportDate
                                ).toLocaleString()}
                                {dtrStats.lastImportBy &&
                                  ` by ${dtrStats.lastImportBy}`}
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No DTR Data</AlertTitle>
                        <AlertDescription>
                          DTR data has not been imported for this period. Please
                          import DTR before processing payroll.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                {/* DTR Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {/* Only show import button if period is Draft or Open */}
                  {(selectedPeriod.status?.toLowerCase() === "draft" ||
                    selectedPeriod.status?.toLowerCase() === "open") && (
                    <Button
                      onClick={handleImportDTR}
                      variant={dtrStats?.hasImport ? "outline" : "default"}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {dtrStats?.hasImport ? "Re-import DTR" : "Import DTR"}
                    </Button>
                  )}

                  {dtrStats?.hasImport && (
                    <Button onClick={handleViewDTRRecords} variant="outline">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      View DTR Records
                    </Button>
                  )}
                </div>

                {/* Warning when DTR import is locked */}
                {selectedPeriod.status?.toLowerCase() !== "draft" &&
                  selectedPeriod.status?.toLowerCase() !== "open" && (
                    <Alert>
                      <Lock className="h-4 w-4" />
                      <AlertTitle>DTR Import Locked</AlertTitle>
                      <AlertDescription>
                        DTR data cannot be modified because payroll has been{" "}
                        {selectedPeriod.status?.toLowerCase() === "processed"
                          ? "processed"
                          : selectedPeriod.status?.toLowerCase() === "finalized"
                          ? "finalized"
                          : "completed"}
                        . To make changes, you must reopen the payroll period first.
                      </AlertDescription>
                    </Alert>
                  )}

                {/* DTR Statistics */}
                {dtrStats?.hasImport && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Total Employees
                      </div>
                      <div className="text-2xl font-bold">
                        {dtrStats.totalEmployees}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Total Working Days
                      </div>
                      <div className="text-2xl font-bold">
                        {dtrStats.totalWorkingDays.toFixed(2)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Average Working Days
                      </div>
                      <div className="text-2xl font-bold">
                        {dtrStats.averageWorkingDays.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payroll Processing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Payroll Processing
                </CardTitle>
                <CardDescription>
                  Process payroll calculations using imported DTR data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Warning if no DTR data */}
                {!dtrStats?.hasImport && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Cannot Process Payroll</AlertTitle>
                    <AlertDescription>
                      You must import DTR data before processing payroll. Click
                      "Import DTR" above to get started.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Processing Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  {(selectedPeriod.status?.toLowerCase() === "draft" ||
                    selectedPeriod.status?.toLowerCase() === "open") && (
                    <Button
                      onClick={handleCalculatePayroll}
                      disabled={processingLoading || !dtrStats?.hasImport}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {processingLoading ? "Processing..." : "Process Payroll"}
                    </Button>
                  )}

                  {payrollItems.some(item => item.status?.toLowerCase() === "processed") && (
                    <Button
                      onClick={handleBulkFinalize}
                      disabled={processingLoading}
                      variant="outline"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Finalize All Processed
                    </Button>
                  )}

                  {payrollItems.some(item => item.status?.toLowerCase() === "finalized") && (
                    <Button
                      onClick={handleBulkMarkPaid}
                      disabled={processingLoading}
                      variant="default"
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Mark All Finalized as Paid
                    </Button>
                  )}

                  {payrollItems.length > 0 && 
                   payrollItems.every(item => item.status?.toLowerCase() === "paid") &&
                   (selectedPeriod.status?.toLowerCase() === "draft" || 
                    selectedPeriod.status?.toLowerCase() === "open" ||
                    selectedPeriod.status?.toLowerCase() === "processing") && (
                    <Button
                      onClick={handleCompletePeriod}
                      disabled={processingLoading}
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Complete Payroll Period
                    </Button>
                  )}
                </div>

                {/* Payroll Items Summary */}
                {payrollItems.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-3">
                      Payroll Items ({payrollItems.length})
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Processed
                        </div>
                        <div className="text-lg font-semibold">
                          {
                            payrollItems.filter(
                              (item) =>
                                item.status?.toLowerCase() === "processed"
                            ).length
                          }
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Finalized
                        </div>
                        <div className="text-lg font-semibold">
                          {
                            payrollItems.filter(
                              (item) =>
                                item.status?.toLowerCase() === "finalized"
                            ).length
                          }
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Paid
                        </div>
                        <div className="text-lg font-semibold">
                          {
                            payrollItems.filter(
                              (item) => item.status?.toLowerCase() === "paid"
                            ).length
                          }
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          Total Net Pay
                        </div>
                        <div className="text-lg font-semibold">
                          {formatCurrency(
                            payrollItems.reduce(
                              (sum, item) => sum + (Number(item.net_pay) || 0),
                              0
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employee Payroll Details Table */}
            {payrollItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Employee Payroll Details
                  </CardTitle>
                  <CardDescription>
                    View detailed breakdown of each employee's payroll including
                    basic pay, allowances, deductions, and net pay
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PayrollItemsTable 
                    items={payrollItems} 
                    onItemUpdate={() => {
                      loadPayrollItems(selectedPeriod.id);
                      loadSummary(selectedPeriod.id);
                      handlePeriodUpdate();
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="adjustments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Payroll Adjustments
                </CardTitle>
                <CardDescription>
                  Make adjustments to payroll items and calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PayrollAdjustments
                  selectedPeriod={selectedPeriod}
                  summary={summary}
                  onSummaryUpdate={setSummary}
                  onPayrollItemsUpdate={() => {}}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No Period Selected</h3>
            <p className="text-muted-foreground mb-4">
              Please select a payroll period above to begin processing or making
              adjustments.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Periods
            </Button>
          </CardContent>
        </Card>
      )}

      {/* DTR Records Dialog */}
      <Dialog
        open={showDtrRecordsDialog}
        onOpenChange={setShowDtrRecordsDialog}
      >
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DTR Records</DialogTitle>
            <DialogDescription>
              View and manage DTR records for{" "}
              {selectedPeriod &&
                `${getMonthName(selectedPeriod.year, selectedPeriod.month)} ${
                  selectedPeriod.year
                } - Period ${selectedPeriod.period_number}`}
            </DialogDescription>
          </DialogHeader>
          {selectedPeriod && (
            <DTRRecordsTable
              periodId={selectedPeriod.id}
              onRecordUpdate={() => {
                loadDTRStats(selectedPeriod.id);
                loadPayrollItems(selectedPeriod.id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
