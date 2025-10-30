import api from './api';
import type { ExamCertificate, CreateExamCertificateDTO, UpdateExamCertificateDTO } from '@/types/employee';

export const examCertificateService = {
  // Get all exam certificates for an employee
  async getExamCertificatesByEmployee(employeeId: number): Promise<ExamCertificate[]> {
    const response = await api.get(`/exam-certificates/employee/${employeeId}`);
    
    // Handle both response formats
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  },

  // Get exam certificate by ID
  async getExamCertificate(id: number): Promise<ExamCertificate> {
    const response = await api.get(`/exam-certificates/${id}`);
    return response.data.data;
  },

  // Helper function to format dates to YYYY-MM-DD
  formatDateForDB(dateString: string | undefined): string | undefined {
    if (!dateString) return undefined;
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If ISO format, extract date part
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Try to parse and format
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.error('Error formatting date:', e);
    }
    
    return undefined;
  },

  // Create new exam certificate
  async createExamCertificate(data: CreateExamCertificateDTO): Promise<ExamCertificate> {
    // Format dates before sending
    const formattedData = {
      ...data,
      date_taken: this.formatDateForDB(data.date_taken),
      validity_date: this.formatDateForDB(data.validity_date)
    };
    
    const response = await api.post('/exam-certificates', formattedData);
    return response.data.data;
  },

  // Update exam certificate
  async updateExamCertificate(id: number, data: UpdateExamCertificateDTO): Promise<ExamCertificate> {
    // Format dates before sending
    const formattedData = {
      ...data,
      date_taken: this.formatDateForDB(data.date_taken),
      validity_date: this.formatDateForDB(data.validity_date)
    };
    
    const response = await api.put(`/exam-certificates/${id}`, formattedData);
    return response.data.data;
  },

  // Delete exam certificate
  async deleteExamCertificate(id: number): Promise<void> {
    await api.delete(`/exam-certificates/${id}`);
  }
};
