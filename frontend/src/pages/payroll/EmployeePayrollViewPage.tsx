import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Download, Eye, Calendar, DollarSign } from "lucide-react";
import payrollService from "@/services/payrollService";
import type { PayrollPeriod, PayrollItem, PayslipData } from "@/types/payroll";

export function EmployeePayrollViewPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(
    null
  );
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [payslipLoading, setPayslipLoading] = useState(false);

  useEffect(() => {
    loadEmployeePayrollData();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadPayrollItems(selectedPeriod.id);
    }
  }, [selectedPeriod]);

  const loadEmployeePayrollData = async () => {
    try {
      const response = await payrollService.getEmployeePayrollPeriods();

      if (response.success) {
        const periodsData = Array.isArray(response.data) ? response.data : [];

        // Filter periods to only show those with finalized payroll items
        const periodsWithFinalizedPayroll = [];

        for (const period of periodsData) {
          try {
            const itemsResponse = await payrollService.getEmployeePayrollItems({
              period_id: period.id,
            });

            if (itemsResponse.success) {
              const items = Array.isArray(itemsResponse.data)
                ? itemsResponse.data
                : [];

              const hasFinalizedItems = items.some((item) => {
                const status = item.status?.toLowerCase();
                return (
                  status === "processed" ||
                  status === "finalized" ||
                  status === "paid"
                );
              });

              if (hasFinalizedItems) {
                periodsWithFinalizedPayroll.push(period);
              }
            }
          } catch (error) {
            console.error(
              `Failed to check payroll items for period ${period.id}:`,
              error
            );
          }
        }

        setPeriods(periodsWithFinalizedPayroll);
        if (periodsWithFinalizedPayroll.length > 0) {
          setSelectedPeriod(periodsWithFinalizedPayroll[0]);
        }
      } else {
        toast.error("Failed to load payroll periods");
      }
    } catch (error) {
      console.error("Failed to load payroll periods:", error);
      toast.error("Failed to load payroll periods");
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollItems = async (periodId: number) => {
    try {
      const response = await payrollService.getEmployeePayrollItems({
        period_id: periodId,
      });

      if (response.success) {
        const itemsData = Array.isArray(response.data) ? response.data : [];

        // Filter to only show Processed, Finalized or Paid payroll items
        const finalizedItems = itemsData.filter((item) => {
          const status = item.status?.toLowerCase();
          return (
            status === "processed" ||
            status === "finalized" ||
            status === "paid"
          );
        });
        setPayrollItems(finalizedItems);
      }
    } catch (error) {
      console.error("Failed to load payroll items:", error);
      toast.error("Failed to load payroll items");
    }
  };

  const viewPayslip = async (periodId: number) => {
    setPayslipLoading(true);
    try {
      const response = await payrollService.getEmployeePayslip(periodId);
      if (response.success) {
        setSelectedPayslip(response.data);
      } else {
        toast.error("Failed to load payslip");
      }
    } catch (error) {
      console.error("Failed to load payslip:", error);
      toast.error("Failed to load payslip");
    } finally {
      setPayslipLoading(false);
    }
  };

  const downloadPayslip = async (periodId: number) => {
    try {
      const blob = await payrollService.downloadPayslip(periodId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${selectedPeriod?.year}-${selectedPeriod?.month}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Payslip downloaded successfully");
    } catch (error) {
      console.error("Failed to download payslip:", error);
      toast.error("Failed to download payslip");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const variants = {
      draft: "secondary",
      processed: "default",
      finalized: "outline",
      paid: "destructive",
    } as const;

    const variant = variants[statusLower as keyof typeof variants] || "default";
    return (
      <Badge variant={variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
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
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border w-full">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            My Payroll
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            View your processed and finalized payroll history and download payslips
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Payroll Periods */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Payroll Periods
            </CardTitle>
            <CardDescription>Select a period to view details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {periods.length > 0 ? (
              periods.map((period) => (
                <div
                  key={period.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPeriod?.id === period.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPeriod(period)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">
                      {new Date(period.year, period.month - 1).toLocaleString(
                        "default",
                        { month: "long" }
                      )}{" "}
                      {period.year}
                    </div>
                    {getStatusBadge(period.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Period {period.period_number}
                  </div>
                  {period.start_date && period.end_date && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(period.start_date)} -{" "}
                      {formatDate(period.end_date)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div className="space-y-2">
                  <p className="font-medium">No payroll periods available</p>
                  <p className="text-sm">
                    Your payroll information will appear here once processed by
                    HR.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payroll Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payroll Details
            </CardTitle>
            <CardDescription>
              {selectedPeriod
                ? `Details for ${new Date(
                    selectedPeriod.year,
                    selectedPeriod.month - 1
                  ).toLocaleString("default", { month: "long" })} ${
                    selectedPeriod.year
                  }`
                : "Select a period to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPeriod && payrollItems.length > 0 ? (
              <div className="space-y-6">
                {payrollItems.map((item) => (
                  <div key={item.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Payroll Summary</h3>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewPayslip(selectedPeriod.id)}
                          disabled={
                            payslipLoading ||
                            (item.status?.toLowerCase() !== "processed" &&
                              item.status?.toLowerCase() !== "finalized" &&
                              item.status?.toLowerCase() !== "paid")
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Payslip
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPayslip(selectedPeriod.id)}
                          disabled={
                            item.status?.toLowerCase() !== "processed" &&
                            item.status?.toLowerCase() !== "finalized" &&
                            item.status?.toLowerCase() !== "paid"
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <h4 className="font-medium text-green-600">Earnings</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Basic Pay</span>
                            <span className="font-medium">
                              {formatCurrency(item.basic_pay)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Total Allowances</span>
                            <span className="font-medium">
                              {formatCurrency(item.total_allowances)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Gross Pay</span>
                            <span>{formatCurrency(item.gross_pay)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-red-600">Deductions</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Total Deductions</span>
                            <span className="font-medium">
                              {formatCurrency(item.total_deductions)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Total Taxes</span>
                            <span className="font-medium">
                              {formatCurrency(item.total_taxes)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium text-lg">
                            <span>Net Pay</span>
                            <span className="text-green-600">
                              {formatCurrency(item.net_pay)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {item.working_days && (
                      <div className="text-sm text-muted-foreground">
                        Working Days: {item.working_days} days
                        {item.daily_rate &&
                          ` • Daily Rate: ${formatCurrency(item.daily_rate)}`}
                      </div>
                    )}

                    {item.notes && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : selectedPeriod ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    No processed payroll data available
                  </p>
                  <p className="text-sm">
                    Your payroll for this period is still being prepared.
                    Payroll details will be available once processed by HR.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Please select a payroll period to view details.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payslip Modal/Details */}
      {selectedPayslip && (
        <Card>
          <CardHeader>
            <CardTitle>Payslip Details</CardTitle>
            <CardDescription>
              Detailed breakdown of your payslip for{" "}
              {selectedPayslip.period &&
                `${new Date(
                  selectedPayslip.period.year,
                  selectedPayslip.period.month - 1
                ).toLocaleString("default", { month: "long" })} ${
                  selectedPayslip.period.year
                }`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Allowances */}
              <div>
                <h4 className="font-medium text-green-600 mb-3">Allowances</h4>
                <div className="space-y-2">
                  {selectedPayslip.allowances?.map((allowance) => (
                    <div
                      key={allowance.id}
                      className="flex justify-between text-sm"
                    >
                      <span>{allowance.allowance_type?.name}</span>
                      <span>{formatCurrency(allowance.amount)}</span>
                    </div>
                  ))}
                  {(!selectedPayslip.allowances ||
                    selectedPayslip.allowances.length === 0) && (
                    <div className="text-sm text-muted-foreground">
                      No allowances
                    </div>
                  )}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-medium text-red-600 mb-3">Deductions</h4>
                <div className="space-y-2">
                  {selectedPayslip.deductions?.map((deduction) => (
                    <div
                      key={deduction.id}
                      className="flex justify-between text-sm"
                    >
                      <span>{deduction.deduction_type?.name}</span>
                      <span>{formatCurrency(deduction.amount)}</span>
                    </div>
                  ))}
                  {(!selectedPayslip.deductions ||
                    selectedPayslip.deductions.length === 0) && (
                    <div className="text-sm text-muted-foreground">
                      No deductions
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}