import { apiService } from './api';
import type { Document, DocumentType, DocumentUploadData, DocumentChecklist, DocumentStatistics } from '../types/employee';

interface DocumentFilters {
  employee_id?: number;
  document_type_id?: number;
  status?: 'Pending' | 'Approved' | 'Rejected';
  uploaded_by?: number;
  limit?: number;
}

export const documentService = {
  // Get documents with optional filters
  async getDocuments(filters: DocumentFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/documents${queryString ? '?' + queryString : ''}`;
    
    const response = await apiService.get<{ success: boolean; data: Document[] }>(url);
    return response.data;
  },

  // Get document by ID
  async getDocumentById(id: number) {
    const response = await apiService.get<{ success: boolean; data: Document }>(`/documents/${id}`);
    return response.data;
  },

  // Get available document types
  async getDocumentTypes(): Promise<DocumentType[]> {
    const response = await apiService.get<{ success: boolean; data: DocumentType[] }>('/documents/types');
    return response.data;
  },

  // Upload a new document
  async uploadDocument(data: DocumentUploadData) {
    const formData = new FormData();
    formData.append('employee_id', data.employee_id.toString());
    formData.append('document_type_id', data.document_type_id.toString());
    formData.append('document', data.file);
    
    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await apiService.upload<{ success: boolean; data: Document; message: string }>('/documents/upload', formData);
    
    return response;
  },

  // Download a document
  async downloadDocument(id: number, fileName: string) {
    // For downloads, we need to use fetch directly with blob response
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const response = await fetch(`${baseUrl}/documents/${id}/download`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Document downloaded successfully' };
  },

  // Preview a document (admin only)
  async previewDocument(id: number) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const previewUrl = `${baseUrl}/documents/${id}/preview`;
    
    // Open in new tab/window
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
    
    return { success: true, message: 'Document opened for preview' };
  },

  // Delete a document
  async deleteDocument(id: number) {
    const response = await apiService.delete<{ success: boolean; message: string }>(`/documents/${id}`);
    return response;
  },

  // Approve a document (admin only)
  async approveDocument(id: number, reviewNotes?: string) {
    const response = await apiService.put<{ success: boolean; message: string }>(`/documents/${id}/approve`, {
      review_notes: reviewNotes,
    });
    return response;
  },

  // Reject a document (admin only)
  async rejectDocument(id: number, reviewNotes: string) {
    const response = await apiService.put<{ success: boolean; message: string }>(`/documents/${id}/reject`, {
      review_notes: reviewNotes,
    });
    return response;
  },

  // Get employee document checklist
  async getEmployeeDocumentChecklist(employeeId: number): Promise<DocumentChecklist[]> {
    const response = await apiService.get<{ success: boolean; data: DocumentChecklist[] }>(`/documents/checklist/${employeeId}`);
    return response.data;
  },

  // Get document statistics
  async getDocumentStatistics(filters: DocumentFilters = {}): Promise<DocumentStatistics> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/documents/statistics${queryString ? '?' + queryString : ''}`;
    
    const response = await apiService.get<{ success: boolean; data: DocumentStatistics }>(url);
    return response.data;
  },

  // Validate file before upload
  validateFile(file: File, documentType: DocumentType): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > documentType.max_file_size) {
      return {
        isValid: false,
        error: `File size exceeds limit of ${Math.round(documentType.max_file_size / 1024 / 1024)}MB`,
      };
    }

    // Check file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt && documentType.allowed_extensions.length > 0 && !documentType.allowed_extensions.includes(fileExt)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${documentType.allowed_extensions.join(', ')}`,
      };
    }

    return { isValid: true };
  },
};