import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/lib/toast";
import {
  FileText,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Loader2,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import dtrService, { type DTRImportBatch } from "@/services/dtrService";

interface DTRImportHistoryProps {
  periodId: number;
}

export function DTRImportHistory({ periodId }: DTRImportHistoryProps) {
  const [imports, setImports] = useState<DTRImportBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<DTRImportBatch | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadImportHistory();
  }, [periodId]);

  const loadImportHistory = async () => {
    try {
      setIsLoading(true);
      const data = await dtrService.getImportHistory(periodId);
      setImports(data);
    } catch (error) {
      console.error("Failed to load import history:", error);
      showToast.error(
        "Failed to load import history",
        "Please try again or contact support if the problem persists."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (batch: DTRImportBatch) => {
    try {
      const details = await dtrService.getImportBatchDetails(batch.id);
      setSelectedBatch(details);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Failed to load batch details:", error);
      showToast.error(
        "Failed to load batch details",
        "Please try again or contact support if the problem persists."
      );
    }
  };

  const getStatusBadge = (status: DTRImportBatch["status"]) => {
    const variants = {
      Completed: {
        variant: "default" as const,
        icon: CheckCircle2,
        className: "bg-green-500 hover:bg-green-600",
      },
      Partial: {
        variant: "secondary" as const,
        icon: AlertCircle,
        className: "bg-yellow-500 hover:bg-yellow-600",
      },
      Failed: { variant: "destructive" as const, icon: XCircle, className: "" },
      Processing: { variant: "outline" as const, icon: Loader2, className: "" },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>Loading import history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (imports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>
            No DTR imports found for this period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No DTR data has been imported yet. Start by exporting a template
              and importing attendance data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>
            View all DTR imports for this payroll period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {imports.map((batch, index) => (
              <div key={batch.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Status and File Info */}
                    <div className="flex items-center gap-3">
                      {getStatusBadge(batch.status)}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{batch.file_name}</span>
                        <span className="text-xs">
                          ({formatFileSize(batch.file_size)})
                        </span>
                      </div>
                    </div>

                    {/* Import Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {dtrService.formatDateTime(batch.imported_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {batch.imported_by_username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {batch.total_records} records
                        </span>
                      </div>
                    </div>

                    {/* Record Counts */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">
                          {batch.valid_records} valid
                        </span>
                      </div>
                      {batch.invalid_records > 0 && (
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-muted-foreground">
                            {batch.invalid_records} invalid
                          </span>
                        </div>
                      )}
                      {batch.warning_records > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-muted-foreground">
                            {batch.warning_records} warnings
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(batch)}
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Import Details</DialogTitle>
            <DialogDescription>
              Detailed information about this DTR import
            </DialogDescription>
          </DialogHeader>

          {selectedBatch && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Import Summary */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Import Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">File Name:</span>
                      <p className="font-medium">{selectedBatch.file_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="mt-1">
                        {getStatusBadge(selectedBatch.status)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Imported By:
                      </span>
                      <p className="font-medium">
                        {selectedBatch.imported_by_username}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Imported At:
                      </span>
                      <p className="font-medium">
                        {dtrService.formatDateTime(selectedBatch.imported_at)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Records:
                      </span>
                      <p className="font-medium">
                        {selectedBatch.total_records}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Valid Records:
                      </span>
                      <p className="font-medium text-green-600">
                        {selectedBatch.valid_records}
                      </p>
                    </div>
                    {selectedBatch.invalid_records > 0 && (
                      <div>
                        <span className="text-muted-foreground">
                          Invalid Records:
                        </span>
                        <p className="font-medium text-red-600">
                          {selectedBatch.invalid_records}
                        </p>
                      </div>
                    )}
                    {selectedBatch.warning_records > 0 && (
                      <div>
                        <span className="text-muted-foreground">Warnings:</span>
                        <p className="font-medium text-yellow-600">
                          {selectedBatch.warning_records}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Errors Section */}
                {selectedBatch.error_log?.errors &&
                  selectedBatch.error_log.errors.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Errors ({selectedBatch.error_log.errors.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedBatch.error_log.errors.map(
                            (error, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
                              >
                                <div className="flex items-start gap-2">
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 text-sm">
                                    <p className="font-medium text-red-900 dark:text-red-100">
                                      Row {error.row}: {error.employeeNumber}
                                    </p>
                                    <p className="text-red-700 dark:text-red-300 mt-1">
                                      {error.message}
                                    </p>
                                    {error.field && (
                                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                        Field: {error.field}
                                        {error.value !== undefined &&
                                          ` | Value: ${error.value}`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}

                {/* Warnings Section */}
                {selectedBatch.error_log?.warnings &&
                  selectedBatch.error_log.warnings.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          Warnings ({selectedBatch.error_log.warnings.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedBatch.error_log.warnings.map(
                            (warning, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900"
                              >
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 text-sm">
                                    <p className="font-medium text-yellow-900 dark:text-yellow-100">
                                      Row {warning.row}:{" "}
                                      {warning.employeeNumber}
                                    </p>
                                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                                      {warning.message}
                                    </p>
                                    {warning.value !== undefined && (
                                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                        Value: {warning.value}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}

                {/* No Errors or Warnings */}
                {(!selectedBatch.error_log?.errors ||
                  selectedBatch.error_log.errors.length === 0) &&
                  (!selectedBatch.error_log?.warnings ||
                    selectedBatch.error_log.warnings.length === 0) && (
                    <>
                      <Separator />
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No errors or warnings for this import
                        </p>
                      </div>
                    </>
                  )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
