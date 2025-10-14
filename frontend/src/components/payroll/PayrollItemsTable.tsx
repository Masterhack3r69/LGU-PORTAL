import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, CheckCircle2, DollarSign } from "lucide-react";
import { showToast } from "@/lib/toast";
import payrollService from "@/services/payrollService";
import type { PayrollItem } from "@/types/payroll";

interface PayrollItemsTableProps {
  items: PayrollItem[];
  loading?: boolean;
  onItemUpdate?: () => void;
}

export function PayrollItemsTable({ items, loading, onItemUpdate }: PayrollItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [processingItems, setProcessingItems] = useState<Set<number>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "draft";
    const variants = {
      draft: "secondary",
      calculated: "default",
      processed: "default",
      finalized: "outline",
      paid: "destructive",
    } as const;

    return (
      <Badge variant={variants[statusLower as keyof typeof variants] || "default"}>
        {status}
      </Badge>
    );
  };

  const handleFinalizeItem = async (itemId: number) => {
    setProcessingItems(prev => new Set(prev).add(itemId));
    try {
      const response = await payrollService.approvePayrollItem(itemId);
      if (response.success) {
        showToast.success("Payroll item finalized successfully");
        onItemUpdate?.();
      } else {
        showToast.error("Failed to finalize payroll item");
      }
    } catch (error: any) {
      console.error("Failed to finalize payroll item:", error);
      showToast.error(error.response?.data?.error?.message || "Failed to finalize payroll item");
    } finally {
      setProcessingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleMarkAsPaid = async (itemId: number) => {
    setProcessingItems(prev => new Set(prev).add(itemId));
    try {
      const response = await payrollService.markAsPaid(itemId);
      if (response.success) {
        showToast.success("Payroll item marked as paid successfully");
        onItemUpdate?.();
      } else {
        showToast.error("Failed to mark payroll item as paid");
      }
    } catch (error: any) {
      console.error("Failed to mark payroll item as paid:", error);
      showToast.error(error.response?.data?.error?.message || "Failed to mark payroll item as paid");
    } finally {
      setProcessingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const filteredItems = items.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.employee_name?.toLowerCase().includes(search) ||
      item.employee_number?.toLowerCase().includes(search) ||
      item.position?.toLowerCase().includes(search)
    );
  });

  const totals = filteredItems.reduce(
    (acc, item) => ({
      basicPay: acc.basicPay + (Number(item.basic_pay) || 0),
      allowances: acc.allowances + (Number(item.total_allowances) || 0),
      deductions: acc.deductions + (Number(item.total_deductions) || 0),
      netPay: acc.netPay + (Number(item.net_pay) || 0),
    }),
    { basicPay: 0, allowances: 0, deductions: 0, netPay: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No payroll items found. Process payroll to generate items.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name, number, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <div className="text-xs text-muted-foreground">Total Basic Pay</div>
          <div className="text-lg font-semibold">{formatCurrency(totals.basicPay)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Total Allowances</div>
          <div className="text-lg font-semibold text-green-600">
            {formatCurrency(totals.allowances)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Total Deductions</div>
          <div className="text-lg font-semibold text-red-600">
            {formatCurrency(totals.deductions)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Total Net Pay</div>
          <div className="text-lg font-semibold text-primary">
            {formatCurrency(totals.netPay)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Employee #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="text-right">Basic Pay</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const isProcessing = processingItems.has(item.id);
                const statusLower = item.status?.toLowerCase() || "";
                const canFinalize = statusLower === "processed";
                const canMarkPaid = statusLower === "finalized";
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.employee_number}
                    </TableCell>
                    <TableCell>{item.employee_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.position}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(item.basic_pay) || 0)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(Number(item.total_allowances) || 0)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(Number(item.total_deductions) || 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(item.net_pay) || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canFinalize && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFinalizeItem(item.id)}
                            disabled={isProcessing}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Finalize
                          </Button>
                        )}
                        {canMarkPaid && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleMarkAsPaid(item.id)}
                            disabled={isProcessing}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {filteredItems.length} of {items.length} employees
      </div>
    </div>
  );
}
