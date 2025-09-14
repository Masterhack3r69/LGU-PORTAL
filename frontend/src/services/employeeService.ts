import type { 
  Employee, 
  CreateEmployeeDTO, 
  UpdateEmployeeDTO, 
  EmployeeResponse, 
  EmployeeFilters,
  Document 
} from '../types';
import apiService from './api';

// Backend response interface (different from frontend EmployeeResponse)
interface BackendEmployeeResponse {
  success: boolean;
  data: Employee[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
  filters: Record<string, unknown>;
}

class EmployeeService {                                                                                                       
    // Transform backend employee data to frontend format                                                                       
    // Transform backend employee data to frontend format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private transformEmployee(backendEmployee: any): Employee {                                                                 
      return {                                                                                                                  
        id: backendEmployee.id,
        user_id: backendEmployee.user_id,                                                                                                 
        employee_number: backendEmployee.employee_number,                                                                       
        first_name: backendEmployee.first_name,                                                                                 
        middle_name: backendEmployee.middle_name,                                                                               
        last_name: backendEmployee.last_name,                                                                                   
        suffix: backendEmployee.suffix,                                                                                         
        sex: backendEmployee.sex,                                                                                               
        birth_date: backendEmployee.birth_date,
        birth_place: backendEmployee.birth_place,
        civil_status: backendEmployee.civil_status,                                                                                 
        email_address: backendEmployee.email_address,                                                                           
        contact_number: backendEmployee.contact_number,                                                                         
        current_address: backendEmployee.current_address,
        permanent_address: backendEmployee.permanent_address,
        tin: backendEmployee.tin,
        gsis_number: backendEmployee.gsis_number,
        pagibig_number: backendEmployee.pagibig_number,
        philhealth_number: backendEmployee.philhealth_number,
        sss_number: backendEmployee.sss_number,                                                                       
        plantilla_position: backendEmployee.plantilla_position,
        plantilla_number: backendEmployee.plantilla_number,
        salary_grade: backendEmployee.salary_grade,
        step_increment: backendEmployee.step_increment,                                                                     
        appointment_date: backendEmployee.appointment_date,                                                                     
        current_monthly_salary: backendEmployee.current_monthly_salary,                                                         
        current_daily_rate: backendEmployee.current_daily_rate,                                                                 
        employment_status: backendEmployee.employment_status,
        separation_date: backendEmployee.separation_date,
        separation_reason: backendEmployee.separation_reason,                                                                   
        created_at: backendEmployee.created_at,                                                                                 
        updated_at: backendEmployee.updated_at,                                                                                 
        deleted_at: backendEmployee.deleted_at,                                                                                 
                                                                                                                                
        // Computed fields for UI compatibility                                                                                 
        employee_id: backendEmployee.employee_number,                                                                           
        email: backendEmployee.email_address,                                                                                   
        phone: backendEmployee.contact_number,                                                                                  
        date_of_birth: backendEmployee.birth_date,                                                                              
        gender: backendEmployee.sex,                                                                                            
        address: backendEmployee.current_address,                                                                               
        department: backendEmployee.plantilla_position,                                                                         
        position: backendEmployee.plantilla_position,                                                                           
        hire_date: backendEmployee.appointment_date,                                                                            
        salary: backendEmployee.current_monthly_salary,                                                                         
        status: this.mapEmploymentStatusToStatus(backendEmployee.employment_status as string),                                            
      };                                                                                                                        
    }                                                                                                                           
                                                                                                                                
    // Map backend employment status to frontend status                                                                         
    private mapEmploymentStatusToStatus(employmentStatus: string): 'active' | 'inactive' | 'pending' {                          
      switch (employmentStatus) {                                                                                               
        case 'Active':                                                                                                          
          return 'active';                                                                                                      
        case 'Resigned':                                                                                                        
        case 'Retired':                                                                                                         
        case 'Terminated':
        case 'AWOL':                                                                                                      
          return 'inactive';                                                                                                    
        default:                                                                                                                
          return 'pending';                                                                                                     
      }                                                                                                                         
    }                                                                                                                           
                                                                                                                                
    // Map frontend status to backend employment status                                                                         
    private mapStatusToEmploymentStatus(status: string): string {                                                               
      switch (status) {                                                                                                         
        case 'active':                                                                                                          
          return 'Active';                                                                                                      
        case 'inactive':                                                                                                        
          return 'Resigned'; // Or another inactive status                                                                      
        case 'pending':                                                                                                         
        default:                                                                                                                
          return 'Active'; // Decide a default mapping                                                                          
      }                                                                                                                         
    }                                                                                                                           
                                                                                                                                
    // Transform frontend form data to backend format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private transformToBackendFormat(formData: any): any {
      return {
        employee_number: formData.employee_id || formData.employee_number,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        suffix: formData.suffix,
        sex: formData.gender || formData.sex,
        birth_date: formData.birth_date || formData.date_of_birth,
        birth_place: formData.birth_place,
        civil_status: formData.civil_status,
        email_address: formData.email || formData.email_address,
        contact_number: formData.phone || formData.contact_number,
        current_address: formData.address || formData.current_address,
        permanent_address: formData.permanent_address,
        tin: formData.tin,
        gsis_number: formData.gsis_number,
        pagibig_number: formData.pagibig_number,
        philhealth_number: formData.philhealth_number,
        sss_number: formData.sss_number,
        plantilla_position: formData.department || formData.position || formData.plantilla_position,
        plantilla_number: formData.plantilla_number,
        salary_grade: formData.salary_grade,
        step_increment: formData.step_increment,
        appointment_date: formData.appointment_date || formData.hire_date,
        // Calculate monthly salary from daily rate (daily rate * 22 working days)
        current_monthly_salary: formData.current_monthly_salary || (formData.current_daily_rate ? formData.current_daily_rate * 22 : undefined),
        current_daily_rate: formData.current_daily_rate,
        employment_status: this.mapStatusToEmploymentStatus(formData.status as string) || formData.employment_status || 'Active',
        separation_date: formData.separation_date,
        separation_reason: formData.separation_reason,
      };
    }

    async getEmployees(filters: Partial<EmployeeFilters> = {}): Promise<EmployeeResponse> {                                     
      const params = {                                                                                                          
        page: filters.page || 1,                                                                                                
        limit: filters.limit || 10,                                                                                             
        ...(filters.name && { search: filters.name }),                                                                          
        ...(filters.department && { department: filters.department }),                                                          
        ...(filters.position && { position: filters.position }),                                                                
        ...(filters.status && { employment_status: this.mapStatusToEmploymentStatus(filters.status) }),                         
      };                                                                                                                        
                                                                                                                                
      const response = await apiService.get<BackendEmployeeResponse>('/employees', params);                                     
                                                                                                                                
      // Transform backend response to match frontend interface                                                                 
      const transformedEmployees = response.data ? response.data.map(emp => this.transformEmployee(emp)) : [];                  
                                                                                                                                
      return {                                                                                                                  
        employees: transformedEmployees,                                                                                        
        total: response.pagination?.totalRecords || 0,                                                                          
        page: response.pagination?.currentPage || 1,                                                                            
        limit: response.pagination?.pageSize || 10,                                                                             
        totalPages: response.pagination?.totalPages || 0,                                                                       
      };                                                                                                                        
    }                                                                                                                           
                                                                                                                                
    async getEmployee(id: string | number): Promise<Employee> {                                                                 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiService.get<{ success: boolean; data: any }>(`/employees/${id}`);                               
      return this.transformEmployee(response.data);                                                                             
    }                                                                                                                           
                                                                                                                                
    async createEmployee(employeeData: CreateEmployeeDTO): Promise<Employee> {                                                  
      const backendData = this.transformToBackendFormat(employeeData);
      console.log('Frontend data:', employeeData);
      console.log('Backend transformed data:', backendData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiService.post<{ success: boolean; data: any }>('/employees', backendData);                       
      return this.transformEmployee(response.data);                                                                             
    }                                                                                                                           
                                                                                                                                
    async updateEmployee(id: string | number, employeeData: UpdateEmployeeDTO): Promise<Employee> {                             
      console.log('updateEmployee - Original data received:', employeeData);
      const backendData = this.transformToBackendFormat(employeeData);                                                          
      console.log('updateEmployee - Transformed backend data:', backendData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiService.put<{ success: boolean; data: any }>(`/employees/${id}`, backendData);                  
      return this.transformEmployee(response.data);                                                                             
    }                

  async deleteEmployee(id: string | number): Promise<void> {
    await apiService.delete(`/employees/${id}`);
  }

  async getEmployeeDocuments(employeeId: string | number): Promise<Document[]> {
    return await apiService.get<Document[]>(`/employees/${employeeId}/documents`);
  }

  async uploadDocument(employeeId: string | number, file: File, category?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('document', file);
    if (category) {
      formData.append('category', category);
    }
    
    return await apiService.upload<Document>(`/employees/${employeeId}/documents`, formData);
  }

  async downloadDocument(employeeId: string | number, documentId: string | number): Promise<Blob> {
    const response = await apiService.get<Blob>(
      `/employees/${employeeId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
    return response;
  }

  async deleteDocument(employeeId: string | number, documentId: string | number): Promise<void> {
    await apiService.delete(`/employees/${employeeId}/documents/${documentId}`);
  }

  async getDepartments(): Promise<string[]> {
    return await apiService.get<string[]>('/employees/departments');
  }

  async getPositions(): Promise<string[]> {
    return await apiService.get<string[]>('/employees/positions');
  }
}

export const employeeService = new EmployeeService();
export default employeeService;