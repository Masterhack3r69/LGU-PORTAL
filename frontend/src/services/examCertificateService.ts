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

  // Create new exam certificate
  async createExamCertificate(data: CreateExamCertificateDTO): Promise<ExamCertificate> {
    const response = await api.post('/exam-certificates', data);
    return response.data.data;
  },

  // Update exam certificate
  async updateExamCertificate(id: number, data: UpdateExamCertificateDTO): Promise<ExamCertificate> {
    const response = await api.put(`/exam-certificates/${id}`, data);
    return response.data.data;
  },

  // Delete exam certificate
  async deleteExamCertificate(id: number): Promise<void> {
    await api.delete(`/exam-certificates/${id}`);
  }
};
