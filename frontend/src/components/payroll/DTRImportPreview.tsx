import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Users,
  Calendar,
  DollarSign,
} from "lucide-react";
import type { DTRPreviewData } from "./DTRFileUpload";

interface DTRImportPreviewProps {
  previewData: DTRPreviewData;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

export function DTRImportPreview({
  previewData,
  onConfirm,
  onCancel,
  isConfirming = false,
}: DTRImportPreviewProps) {
  const [activeTab, setActiveTab] = useState("summary");

  // Debug logging
  console.log('DTRImportPreview - previewData:', previewData);
  console.log('DTRImportPreview - invalidRecords:', previewData.invalidRecords);

  // Transform invalid records to flatten errors array
  const flattenedInvalidRecords = previewData.invalidRecords.flatMap((record: any) => {
    if (record.errors && Array.isArray(record.errors)) {
      return record.errors.map((error: any) => ({
        row: record.rowNumber || record.row,
        employeeNumber: record.employeeNumber,
        field: error.field || "-",
        message: error.message || "Unknown error",
        value: error.value
      }));
    }
    // Fallback for old format
    return [{
      row: record.rowNumber || record.row,
      employeeNumber: record.employeeNumber,
      field: record.field || "-",
      message: record.message || "Unknown error",
      value: record.value
    }];
  });

  const hasInvalidRecords = flattenedInvalidRecords.length > 0;
  const hasWarnings = previewData.warningRecords?.length > 0;
  const hasValidRecords = previewData.validRecords.length > 0;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Alert */}
      {hasInvalidRecords && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Import cannot proceed.</strong> There are{" "}
            {flattenedInvalidRecords.length} invalid record(s) that must be
            corrected before importing.
          </AlertDescription>
        </Alert>
      )}

      {!hasInvalidRecords && hasWarnings && (
        <Alert className="border-yellow-500 bg-yellow-50 text-yellow-900">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <strong>Warning:</strong> There are{" "}
            {previewData.warningRecords.length} record(s) with warnings. Review
            them before proceeding.
          </AlertDescription>
        </Alert>
      )}

      {!hasInvalidRecords && !hasWarnings && hasValidRecords && (
        <Alert className="border-green-500 bg-green-50 text-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>All records are valid!</strong> You can proceed with the
            import.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="valid" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Valid ({previewData.validRecords.length})
          </TabsTrigger>
          <TabsTrigger value="invalid" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Invalid ({flattenedInvalidRecords.length})
          </TabsTrigger>
          <TabsTrigger value="warnings" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Warnings ({previewData.warningRecords.length})
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Total Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {previewData.totalRecords}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {previewData.validRecords.length} valid,{" "}
                  {previewData.invalidRecords.length} invalid
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {previewData.summary.totalEmployees}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Active employees
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Total Working Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {previewData.summary.totalWorkingDays.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Across all employees
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Estimated Basic Pay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(previewData.summary.estimatedBasicPay)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Before deductions
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Import Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">
                        Valid Records
                      </p>
                      <p className="text-sm text-green-700">Ready to import</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white">
                    {previewData.validRecords.length}
                  </Badge>
                </div>

                {hasInvalidRecords && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">
                          Invalid Records
                        </p>
                        <p className="text-sm text-red-700">
                          Must be corrected
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-red-600 text-white">
                      {flattenedInvalidRecords.length}
                    </Badge>
                  </div>
                )}

                {hasWarnings && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-900">Warnings</p>
                        <p className="text-sm text-yellow-700">
                          Review recommended
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-600 text-white">
                      {previewData.warningRecords.length}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Valid Records Tab */}
        <TabsContent value="valid">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                Valid Records ({previewData.validRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewData.validRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No valid records found</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-green-50">
                        <TableHead>Employee Number</TableHead>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">
                          Working Days
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.validRecords.map((record, index) => (
                        <TableRow key={index} className="hover:bg-green-50/50">
                          <TableCell className="font-medium">
                            {record.employeeNumber}
                          </TableCell>
                          <TableCell>{record.employeeName}</TableCell>
                          <TableCell className="text-gray-600">
                            {record.position}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(record.startDate)} -{" "}
                            {formatDate(record.endDate)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {record.workingDays.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invalid Records Tab */}
        <TabsContent value="invalid">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                Invalid Records ({flattenedInvalidRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {flattenedInvalidRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-400" />
                  <p>No invalid records - all records passed validation!</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-50">
                        <TableHead>Row</TableHead>
                        <TableHead>Employee Number</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Error Message</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flattenedInvalidRecords.map((error, index) => (
                        <TableRow key={index} className="hover:bg-red-50/50">
                          <TableCell className="font-medium">
                            {error.row || "-"}
                          </TableCell>
                          <TableCell>{error.employeeNumber || "-"}</TableCell>
                          <TableCell>
                            {error.field && error.field !== "-" ? (
                              <Badge
                                variant="outline"
                                className="border-red-300 text-red-700"
                              >
                                {error.field}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-red-700">
                            {error.message}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {error.value !== undefined && error.value !== null
                              ? String(error.value)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warnings Tab */}
        <TabsContent value="warnings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-5 w-5" />
                Warnings ({previewData.warningRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {previewData.warningRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-400" />
                  <p>No warnings - all records look good!</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-yellow-50">
                        <TableHead>Row</TableHead>
                        <TableHead>Employee Number</TableHead>
                        <TableHead>Warning Message</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.warningRecords.map((warning, index) => (
                        <TableRow key={index} className="hover:bg-yellow-50/50">
                          <TableCell className="font-medium">
                            {warning.row}
                          </TableCell>
                          <TableCell>{warning.employeeNumber || "-"}</TableCell>
                          <TableCell className="text-yellow-700">
                            {warning.message}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {warning.value !== undefined &&
                            warning.value !== null
                              ? String(warning.value)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={hasInvalidRecords || isConfirming}
          className="min-w-[140px]"
        >
          {isConfirming ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Confirming...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Import
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
