import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { showToast } from '@/lib/toast';
import { Upload, File, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import dtrService from '@/services/dtrService';

interface DTRFileUploadProps {
  periodId: number;
  onUploadSuccess: (previewData: DTRPreviewData) => void;
  onUploadError: (error: string) => void;
}

export interface DTRPreviewData {
  isValid: boolean;
  totalRecords: number;
  validRecords: DTRRecord[];
  invalidRecords: DTRValidationError[];
  warningRecords: DTRWarning[];
  canProceed: boolean;
  summary: {
    totalEmployees: number;
    totalWorkingDays: number;
    estimatedBasicPay: number;
  };
  reimportInfo?: {
    isReimport: boolean;
    requiresWarning: boolean;
    canReimport?: boolean;
  };
}

export interface DTRRecord {
  employeeNumber: string;
  employeeName: string;
  position: string;
  workingDays: number;
  startDate: string;
  endDate: string;
}

export interface DTRValidationError {
  row: number;
  employeeNumber: string;
  field: string;
  message: string;
  value?: any;
}

export interface DTRWarning {
  row: number;
  employeeNumber: string;
  message: string;
  value?: any;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
];

export function DTRFileUpload({ periodId, onUploadSuccess, onUploadError }: DTRFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return {
        valid: false,
        error: `Invalid file type. Please upload an Excel file (${ALLOWED_EXTENSIONS.join(', ')})`,
      };
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== '') {
      return {
        valid: false,
        error: 'Invalid file format. Please upload a valid Excel file.',
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit. Please upload a smaller file.`,
      };
    }

    return { valid: true };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    
    if (!validation.valid) {
      showToast.error('Invalid File', validation.error);
      onUploadError(validation.error || 'Invalid file');
      setValidationStatus('error');
      return;
    }

    setSelectedFile(file);
    setValidationStatus('success');
    showToast.success('File Selected', `${file.name} (${formatFileSize(file.size)})`);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationStatus('idle');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast.error('No File Selected', 'Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload and validate the file
      const previewData = await dtrService.uploadDTRFile(periodId, selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Show success message
      showToast.success(
        'File Uploaded Successfully',
        `${previewData?.validRecords?.length || 0} valid records found`
      );

      // Call success callback with preview data
      onUploadSuccess(previewData);
    } catch (error: any) {
      console.error('Failed to upload DTR file:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Failed to upload file. Please try again.';
      
      showToast.error('Upload Failed', errorMessage);
      onUploadError(errorMessage);
      setValidationStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <Card>
        <CardContent className="pt-6">
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
              ${selectedFile ? 'bg-gray-50' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    {isDragging ? 'Drop file here' : 'Drag and drop your DTR file here'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBrowseClick}
                  disabled={isUploading}
                >
                  Browse Files
                </Button>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Supported formats: .xlsx, .xls</p>
                  <p>Maximum file size: 10MB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <File className="h-10 w-10 text-blue-500" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  {validationStatus === 'success' && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                  {validationStatus === 'error' && (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  )}
                  {!isUploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-gray-600">
                      {uploadProgress < 100 ? 'Uploading and validating...' : 'Processing complete'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Button */}
      {selectedFile && !isUploading && validationStatus === 'success' && (
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            size="lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload and Validate
          </Button>
        </div>
      )}
    </div>
  );
}
