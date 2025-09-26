// components/admin/ExcelImport.tsx - Excel import component for employees
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  Key,
  FileText,
  Eye,
} from "lucide-react";
import { importService } from "@/services/importService";
import type {
  ImportPreviewData,
  ImportExecutionResult,
  ImportOptions,
  PasswordStrategy,
} from "@/types/import";
import { showToast } from "@/lib/toast";
import ImportPreview from "./ImportPreview";
import ImportResults from "./ImportResults";
import ImportOptionsComponent from "./ImportOptions";

interface ExcelImportProps {
  onImportComplete?: (result: ImportExecutionResult) => void;
}

const ExcelImport: React.FC<ExcelImportProps> = ({ onImportComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(
    null
  );
  const [importResult, setImportResult] =
    useState<ImportExecutionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "upload" | "preview" | "options" | "results"
  >("upload");
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    password_strategy: "custom_pattern" as PasswordStrategy,
    create_user_accounts: true,
    skip_invalid_rows: true,
    initialize_leave_balances: true,
  });

  // File drop zone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const validation = importService.validateFile(file);
      if (!validation.isValid) {
        showToast.error(validation.error || "Invalid file selected");
        return;
      }

      setSelectedFile(file);
      setPreviewData(null);
      setImportResult(null);
      setCurrentStep("upload");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      setIsLoading(true);
      const blob = await importService.downloadTemplate();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "employee_import_template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error downloading template:", error);
      showToast.error("Failed to download template");
    } finally {
      setIsLoading(false);
    }
  };

  // Preview import
  const handlePreviewImport = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      const preview = await importService.previewImport(selectedFile);
      setPreviewData(preview);
      setCurrentStep("preview");

      if (preview.validationErrors.length > 0) {
        showToast.warning(
          `Found ${preview.validationErrors.length} validation errors. Review before proceeding.`
        );
      } else {
        showToast.success(
          `Preview generated: ${preview.validRows} valid rows ready for import`
        );
      }
    } catch (error) {
      console.error("Error previewing import:", error);
      showToast.error("Failed to preview import file");
    } finally {
      setIsLoading(false);
    }
  };

  // Execute import
  const handleExecuteImport = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      const result = await importService.executeImport(
        selectedFile,
        importOptions
      );
      setImportResult(result);
      setCurrentStep("results");

      if (result.summary.successful_imports > 0) {
        showToast.success(
          `Import completed! ${result.summary.successful_imports} employees imported successfully.`
        );
        onImportComplete?.(result);
      } else {
        showToast.error("Import failed. No employees were imported.");
      }
    } catch (error) {
      console.error("Error executing import:", error);
      showToast.error("Failed to execute import");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset import process
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setCurrentStep("upload");
  };

  // Render upload area
  const renderUploadArea = () => (
    <div className="space-y-6">
      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Template
          </CardTitle>
          <CardDescription>
            Download the Excel template with sample data and instructions for
            importing employees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleDownloadTemplate}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Excel Template
          </Button>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Excel File
          </CardTitle>
          <CardDescription>
            Upload your completed Excel file to import employee data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25"
              }
              ${selectedFile ? "border-green-500 bg-green-50" : ""}
            `}
          >
            <input {...getInputProps()} />

            {selectedFile ? (
              <div className="space-y-2">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  File Ready
                </Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium">
                  {isDragActive
                    ? "Drop the file here"
                    : "Drag & drop your Excel file here"}
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to select a file (.xlsx, .xls, .csv)
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 10MB
                </p>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handlePreviewImport}
                disabled={isLoading}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Import
              </Button>
              <Button onClick={handleReset} variant="outline">
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Before importing:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Download and fill out the Excel template</li>
            <li>• Ensure all required fields are completed</li>
            <li>• Verify employee numbers are unique</li>
            <li>• Check email addresses for user account creation</li>
            <li>• Review date formats (YYYY-MM-DD or Excel dates)</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Excel Import</h2>
          <p className="text-muted-foreground">
            Import employee data from Excel files with automatic user account
            creation
          </p>
        </div>

        {currentStep !== "upload" && (
          <Button onClick={handleReset} variant="outline">
            Start Over
          </Button>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center space-x-4  px-5">
        {[
          { key: "upload", label: "Upload", icon: Upload },
          { key: "preview", label: "Preview", icon: Eye },
          { key: "options", label: "Options", icon: Key },
          { key: "results", label: "Results", icon: CheckCircle },
        ].map(({ key, label, icon: Icon }, index) => (
          <React.Fragment key={key}>
            <div
              className={`flex items-center space-x-2 ${
                currentStep === key
                  ? "text-primary"
                  : ["upload", "preview", "options", "results"].indexOf(
                      currentStep
                    ) > index
                  ? "text-green-600"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{label}</span>
            </div>
            {index < 3 && <div className="h-px bg-border flex-1" />}
          </React.Fragment>
        ))}
      </div>

      {/* Loading Progress */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <span>Please wait</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content based on current step */}
      {currentStep === "upload" && renderUploadArea()}

      {currentStep === "preview" && previewData && (
        <ImportPreview
          data={previewData}
          onProceed={() => setCurrentStep("options")}
          onBack={() => setCurrentStep("upload")}
        />
      )}

      {currentStep === "options" && (
        <ImportOptionsComponent
          options={importOptions}
          onChange={setImportOptions}
          previewData={previewData}
          onExecute={handleExecuteImport}
          onBack={() => setCurrentStep("preview")}
          isLoading={isLoading}
        />
      )}

      {currentStep === "results" && importResult && (
        <ImportResults result={importResult} onStartOver={handleReset} />
      )}
    </div>
  );
};

export default ExcelImport;
