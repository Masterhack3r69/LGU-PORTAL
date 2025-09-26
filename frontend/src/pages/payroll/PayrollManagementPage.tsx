import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Calculator, Settings, Calendar, DollarSign } from "lucide-react";
import payrollService from "@/services/payrollService";
import { PayrollAdjustments } from "@/components/payroll/PayrollAdjustments";
import { EmployeeSelectionProcessing } from "@/components/payroll/EmployeeSelectionProcessing";
import type { PayrollPeriod, PayrollSummary } from "@/types/payroll";

export function PayrollManagementPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(
    null
  );
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("processing");

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadSummary(selectedPeriod.id);
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
        toast.error("Failed to load payroll periods");
      }
    } catch (error) {
      console.error("Failed to load payroll periods:", error);
      toast.error("Failed to load payroll periods");
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

  const handleCalculatePayroll = async () => {
    console.log("Calculate payroll called from main page");
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
                      {formatDate(period.start_date)} - {formatDate(period.end_date)}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="processing" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Processing
            </TabsTrigger>
            <TabsTrigger value="adjustments" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Adjustments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="processing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Payroll Processing
                </CardTitle>
                <CardDescription>
                  Calculate payroll for employees in the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeeSelectionProcessing
                  selectedPeriod={selectedPeriod}
                  onEmployeesSelected={() => {}}
                  onCalculatePayroll={handleCalculatePayroll}
                />
              </CardContent>
            </Card>
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
              Please select a payroll period above to begin processing or making adjustments.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Periods
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}