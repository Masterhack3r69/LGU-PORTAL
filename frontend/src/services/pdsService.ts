// services/pdsService.ts - PDS data service
import type { PDSData, FamilyBackground, Child, Education, WorkExperience, VoluntaryWork, OtherInfo } from '../types/pds';
import apiService from './api';

class PDSService {
  // Get complete PDS data for an employee
  async getPDSData(employeeId: number): Promise<PDSData> {
    const response = await apiService.get<{ success: boolean; data: PDSData }>(`/pds/${employeeId}`);
    return response.data;
  }

  // Save family background
  async saveFamilyBackground(employeeId: number, data: FamilyBackground): Promise<FamilyBackground> {
    const response = await apiService.post<{ success: boolean; data: FamilyBackground }>(
      `/pds/${employeeId}/family-background`,
      data
    );
    return response.data;
  }

  // Save children
  async saveChildren(employeeId: number, children: Child[]): Promise<Child[]> {
    const response = await apiService.post<{ success: boolean; data: Child[] }>(
      `/pds/${employeeId}/children`,
      { children }
    );
    return response.data;
  }

  // Save education
  async saveEducation(employeeId: number, education: Education[]): Promise<Education[]> {
    const response = await apiService.post<{ success: boolean; data: Education[] }>(
      `/pds/${employeeId}/education`,
      { education }
    );
    return response.data;
  }

  // Save work experience
  async saveWorkExperience(employeeId: number, workExperience: WorkExperience[]): Promise<WorkExperience[]> {
    const response = await apiService.post<{ success: boolean; data: WorkExperience[] }>(
      `/pds/${employeeId}/work-experience`,
      { workExperience }
    );
    return response.data;
  }

  // Save voluntary work
  async saveVoluntaryWork(employeeId: number, voluntaryWork: VoluntaryWork[]): Promise<VoluntaryWork[]> {
    const response = await apiService.post<{ success: boolean; data: VoluntaryWork[] }>(
      `/pds/${employeeId}/voluntary-work`,
      { voluntaryWork }
    );
    return response.data;
  }

  // Save other information
  async saveOtherInfo(employeeId: number, data: OtherInfo): Promise<OtherInfo> {
    const response = await apiService.post<{ success: boolean; data: OtherInfo }>(
      `/pds/${employeeId}/other-info`,
      data
    );
    return response.data;
  }
}

export const pdsService = new PDSService();
export default pdsService;
