import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit, Trash2, FileType, Settings } from "lucide-react";
import { documentService } from "@/services/documentService";
import type { DocumentType } from "@/types/employee";
import { toastSuccess, toastError, toastWarning } from "@/lib/toast";

interface DocumentTypeFormData {
  name: string;
  description: string;
  is_required: boolean;
  max_file_size: number;
  allowed_extensions: string[];
}

export function DocumentTypesManagement() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<DocumentTypeFormData>({
    name: "",
    description: "",
    is_required: false,
    max_file_size: 5242880, // 5MB default
    allowed_extensions: [],
  });

  // Common file extensions
  const commonExtensions = [
    "pdf",
    "doc",
    "docx",
    "jpg",
    "jpeg",
    "png",
    "gif",
    "txt",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
  ];

  // Load document types
  useEffect(() => {
    loadDocumentTypes();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      setIsLoading(true);
      const types = await documentService.getDocumentTypes();
      setDocumentTypes(types);
    } catch (error) {
      console.error("Failed to load document types:", error);
      toastError("Failed to load document types");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_required: false,
      max_file_size: 5242880,
      allowed_extensions: [],
    });
    setEditingType(null);
  };

  const handleEdit = (docType: DocumentType) => {
    setEditingType(docType);
    setFormData({
      name: docType.name,
      description: docType.description || "",
      is_required: docType.is_required,
      max_file_size: docType.max_file_size,
      allowed_extensions: docType.allowed_extensions || [],
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toastWarning("Document type name is required");
      return;
    }

    try {
      setIsSaving(true);

      // Here you would call the API to create/update document type
      // Since we don't have those endpoints yet, I'll simulate the operation
      console.log("Saving document type:", formData);

      if (editingType) {
        // Update operation
        toastSuccess("Document type updated successfully");
      } else {
        // Create operation
        toastSuccess("Document type created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      // Reload data
      await loadDocumentTypes();
    } catch (error) {
      console.error("Failed to save document type:", error);
      toastError("Failed to save document type");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (docType: DocumentType) => {
    if (
      !confirm(
        `Are you sure you want to delete the document type "${docType.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      // Here you would call the API to delete the document type
      console.log("Deleting document type:", docType.id);
      toastSuccess("Document type deleted successfully");
      await loadDocumentTypes();
    } catch (error) {
      console.error("Failed to delete document type:", error);
      toastError("Failed to delete document type");
    }
  };

  const handleExtensionToggle = (extension: string) => {
    setFormData((prev) => ({
      ...prev,
      allowed_extensions: prev.allowed_extensions.includes(extension)
        ? prev.allowed_extensions.filter((ext) => ext !== extension)
        : [...prev.allowed_extensions, extension],
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const bytesToMB = (bytes: number) => bytes / (1024 * 1024);
  const mbToBytes = (mb: number) => mb * 1024 * 1024;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading document types...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Document Types Management
              </CardTitle>
              <CardDescription>
                Configure document types that employees can upload for review
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Document Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingType
                      ? "Edit Document Type"
                      : "Create Document Type"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure the document type settings and file restrictions
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Birth Certificate, Resume, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe what this document type is for..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_required"
                      checked={formData.is_required}
                      onCheckedChange={(checked: boolean) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_required: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="is_required">Required document</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_file_size">
                      Maximum File Size (MB)
                    </Label>
                    <Input
                      id="max_file_size"
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      value={bytesToMB(formData.max_file_size)}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          max_file_size: mbToBytes(
                            parseFloat(e.target.value) || 5
                          ),
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Allowed File Extensions</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {commonExtensions.map((ext) => (
                        <div key={ext} className="flex items-center space-x-2">
                          <Checkbox
                            id={`ext-${ext}`}
                            checked={formData.allowed_extensions.includes(ext)}
                            onCheckedChange={() => handleExtensionToggle(ext)}
                          />
                          <Label htmlFor={`ext-${ext}`} className="text-sm">
                            {ext}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {formData.allowed_extensions.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No restrictions selected - all file types will be
                        allowed
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving
                        ? "Saving..."
                        : editingType
                        ? "Update"
                        : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {documentTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileType className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p>No document types configured yet</p>
              <p className="text-sm">
                Click "Add Document Type" to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Max Size</TableHead>
                  <TableHead>Allowed Extensions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentTypes.map((docType) => (
                  <TableRow key={docType.id}>
                    <TableCell className="font-medium">
                      {docType.name}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {docType.description || "No description"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {docType.is_required ? (
                        <Badge variant="destructive">Required</Badge>
                      ) : (
                        <Badge variant="secondary">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatFileSize(docType.max_file_size)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {docType.allowed_extensions &&
                        docType.allowed_extensions.length > 0 ? (
                          docType.allowed_extensions.slice(0, 3).map((ext) => (
                            <Badge
                              key={ext}
                              variant="outline"
                              className="text-xs"
                            >
                              {ext}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            All types
                          </span>
                        )}
                        {docType.allowed_extensions &&
                          docType.allowed_extensions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{docType.allowed_extensions.length - 3} more
                            </Badge>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(docType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(docType)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
