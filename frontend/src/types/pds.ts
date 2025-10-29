// types/pds.ts - Personal Data Sheet types

// II. FAMILY BACKGROUND
export interface FamilyBackground {
  id?: number;
  employee_id: number;
  
  // Spouse
  spouse_surname?: string;
  spouse_first_name?: string;
  spouse_middle_name?: string;
  spouse_name_extension?: string;
  spouse_occupation?: string;
  spouse_employer_name?: string;
  spouse_business_address?: string;
  spouse_telephone_no?: string;
  
  // Father
  father_surname?: string;
  father_first_name?: string;
  father_middle_name?: string;
  father_name_extension?: string;
  
  // Mother
  mother_maiden_surname?: string;
  mother_first_name?: string;
  mother_middle_name?: string;
}

// Children
export interface Child {
  id?: number;
  employee_id?: number;
  full_name: string;
  birth_date?: string;
}

// III. EDUCATIONAL BACKGROUND
export type EducationLevel = 'ELEMENTARY' | 'SECONDARY' | 'VOCATIONAL' | 'COLLEGE' | 'GRADUATE_STUDIES';

export interface Education {
  id?: number;
  employee_id?: number;
  level: EducationLevel;
  school_name: string;
  degree_course?: string;
  period_from?: string;
  period_to?: string;
  highest_level_units?: string;
  year_graduated?: string;
  scholarship_honors?: string;
}

// V. WORK EXPERIENCE
export interface WorkExperience {
  id?: number;
  employee_id?: number;
  date_from?: string;
  date_to?: string;
  position_title: string;
  department_agency: string;
  monthly_salary?: number;
  salary_grade?: string;
  status_of_appointment?: string;
  is_government_service?: boolean;
}

// VI. VOLUNTARY WORK
export interface VoluntaryWork {
  id?: number;
  employee_id?: number;
  organization_name: string;
  organization_address?: string;
  date_from?: string;
  date_to?: string;
  number_of_hours?: number;
  position_nature?: string;
}

// VIII. OTHER INFORMATION
export interface OtherInfo {
  id?: number;
  employee_id: number;
  special_skills?: string;
  non_academic_distinctions?: string;
  membership_associations?: string;
}

// Complete PDS Data
export interface PDSData {
  familyBackground?: FamilyBackground | null;
  children: Child[];
  education: Education[];
  workExperience: WorkExperience[];
  voluntaryWork: VoluntaryWork[];
  otherInfo?: OtherInfo | null;
}
