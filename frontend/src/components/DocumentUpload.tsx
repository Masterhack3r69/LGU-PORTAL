import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import { documentService } from "@/services/documentService";
import type { Document, DocumentType } from "@/types/employee";

interface DocumentUploadProps {
  employeeId: number;
  documents: Document[];
  onDocumentUploaded: () => void;
}

export function DocumentUpload({
  employeeId,
  documents,
  onDocumentUploaded,
}: DocumentUploadProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load document types
  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const types = await documentService.getDocumentTypes();
        setDocumentTypes(types);
      } catch (error) {
        console.error("Failed to load document types:", error);
        setMessage({ type: "error", text: "Failed to load document types" });
      }
    };

    loadDocumentTypes();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Validate file if document type is selected
      if (selectedDocumentType) {
        const documentType = documentTypes.find(
          (dt) => dt.id.toString() === selectedDocumentType
        );
        if (documentType) {
          const validation = documentService.validateFile(file, documentType);
          if (!validation.isValid) {
            setMessage({
              type: "error",
              text: validation.error || "Invalid file",
            });
            setSelectedFile(null);
            event.target.value = "";
            return;
          }
        }
      }

      setMessage(null);
    }
  };

  const handleDocumentTypeChange = (value: string) => {
    setSelectedDocumentType(value);

    // Re-validate file if one is selected
    if (selectedFile) {
      const documentType = documentTypes.find(
        (dt) => dt.id.toString() === value
      );
      if (documentType) {
        const validation = documentService.validateFile(
          selectedFile,
          documentType
        );
        if (!validation.isValid) {
          setMessage({
            type: "error",
            text: validation.error || "Invalid file",
          });
          setSelectedFile(null);
          // Reset file input
          const fileInput = document.getElementById(
            "file-upload"
          ) as HTMLInputElement;
          if (fileInput) fileInput.value = "";
          return;
        }
      }
    }

    setMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocumentType) {
      setMessage({
        type: "error",
        text: "Please select a file and document type",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await documentService.uploadDocument({
        employee_id: employeeId,
        document_type_id: parseInt(selectedDocumentType),
        description: description || undefined,
        file: selectedFile,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Reset form
      setSelectedFile(null);
      setSelectedDocumentType("");
      setDescription("");
      setIsDialogOpen(false);

      // Reset file input
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      setMessage({
        type: "success",
        text: "Document uploaded successfully. It will be reviewed by an administrator.",
      });
      onDocumentUploaded();
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({ type: "error", text: "Failed to upload document" });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      await documentService.downloadDocument(document.id, document.file_name);
    } catch (error) {
      console.error("Download failed:", error);
      setMessage({ type: "error", text: "Failed to download document" });
    }
  };

  const handleDelete = async (document: Document) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await documentService.deleteDocument(document.id);
      setMessage({ type: "success", text: "Document deleted successfully" });
      onDocumentUploaded();
    } catch (error) {
      console.error("Delete failed:", error);
      setMessage({ type: "error", text: "Failed to delete document" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "Rejected":
        return (
          <Badge variant="destructive">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Documents
              </CardTitle>
              <CardDescription>
                Upload and manage your documents. All uploads require admin
                approval.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Select a document type and file to upload. All uploads
                    require admin approval.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="document-type">Document Type</Label>
                    <Select
                      value={selectedDocumentType}
                      onValueChange={handleDocumentTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                            {type.is_required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-upload">File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                    {selectedDocumentType && (
                      <div className="text-sm text-muted-foreground">
                        {(() => {
                          const docType = documentTypes.find(
                            (dt) => dt.id.toString() === selectedDocumentType
                          );
                          if (docType) {
                            return (
                              <div>
                                Max size:{" "}
                                {formatFileSize(docType.max_file_size)}
                                {docType.allowed_extensions.length > 0 && (
                                  <span>
                                    {" "}
                                    • Allowed:{" "}
                                    {docType.allowed_extensions.join(", ")}
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add any notes about this document..."
                      disabled={isUploading}
                      rows={3}
                    />
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={
                        !selectedFile || !selectedDocumentType || isUploading
                      }
                    >
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert
              className={`mb-4 ${
                message.type === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={
                  message.type === "error" ? "text-red-800" : "text-green-800"
                }
              >
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Click "Upload Document" to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      {document.document_type_name || "Unknown"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {document.file_name}
                    </TableCell>
                    <TableCell>{formatFileSize(document.file_size)}</TableCell>
                    <TableCell>{getStatusBadge(document.status)}</TableCell>
                    <TableCell>
                      {document.upload_date
                        ? new Date(document.upload_date).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {document.status === "Pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(document)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
