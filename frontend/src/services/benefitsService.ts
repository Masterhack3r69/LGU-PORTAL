import type { 
  BenefitType,
  EmployeeBenefitsResponse,
  BenefitCalculationRequest,
  BenefitCalculationResponse,
  LoyaltyAwardRequest,
  LeaveMonetizationResponse,
  BenefitsSummaryResponse,
  CreateBenefitForm,
  BenefitsFilters,
  PayrollApiResponse
} from '../types/payroll';
import apiService from './api';

class BenefitsService {
  // GET /api/benefits/types - Get all benefit types
  async getBenefitTypes(): Promise<BenefitType[]> {
    const response = await apiService.get<PayrollApiResponse<BenefitType[]>>('/benefits/types');
    return response.data;
  }

  // GET /api/benefits/employee/:id - Get employee benefits
  async getEmployeeBenefits(employeeId: number, year?: number): Promise<EmployeeBenefitsResponse> {
    const params = year ? { year } : {};
    const response = await apiService.get<PayrollApiResponse<EmployeeBenefitsResponse>>(
      `/benefits/employee/${employeeId}`,
      params
    );
    return response.data;
  }

  // POST /api/benefits/calculate - Calculate benefits for employee
  async calculateBenefit(request: BenefitCalculationRequest): Promise<BenefitCalculationResponse> {
    const response = await apiService.post<PayrollApiResponse<BenefitCalculationResponse>>(
      '/benefits/calculate',
      request
    );
    return response.data;
  }

  // POST /api/benefits/loyalty-award - Process loyalty award
  async processLoyaltyAward(request: LoyaltyAwardRequest): Promise<BenefitCalculationResponse> {
    const response = await apiService.post<PayrollApiResponse<BenefitCalculationResponse>>(
      '/benefits/loyalty-award',
      request
    );
    return response.data;
  }

  // GET /api/benefits/summary/:year - Get benefits summary report
  async getBenefitsSummary(year: number, filters?: BenefitsFilters): Promise<BenefitsSummaryResponse> {
    const params = { ...filters };
    const response = await apiService.get<PayrollApiResponse<BenefitsSummaryResponse>>(
      `/benefits/summary/${year}`,
      params
    );
    return response.data;
  }

  // Create benefit record (using compensation service)
  async createBenefit(benefitData: CreateBenefitForm): Promise<void> {
    await apiService.post('/compensation', benefitData);
  }

  // Update benefit record (using compensation service)
  async updateBenefit(id: number, benefitData: Partial<CreateBenefitForm>): Promise<void> {
    await apiService.put(`/compensation/${id}`, benefitData);
  }

  // Delete benefit record (using compensation service)
  async deleteBenefit(id: number): Promise<void> {
    await apiService.delete(`/compensation/${id}`);
  }

  // Utility methods for benefit calculations
  async calculateThirteenthMonth(employeeId: number, year: number): Promise<BenefitCalculationResponse> {
    return this.calculateBenefit({
      employee_id: employeeId,
      benefit_type: 'thirteenth_month',
      year
    });
  }

  async calculatePBB(employeeId: number, year: number): Promise<BenefitCalculationResponse> {
    return this.calculateBenefit({
      employee_id: employeeId,
      benefit_type: 'pbb',
      year
    });
  }

  async calculateLoyaltyAward(employeeId: number, year: number): Promise<BenefitCalculationResponse> {
    return this.calculateBenefit({
      employee_id: employeeId,
      benefit_type: 'loyalty_award',
      year
    });
  }

  // Calculate leave monetization potential
  async calculateLeaveMonetization(employeeId: number, year: number): Promise<BenefitCalculationResponse> {
    return this.calculateBenefit({
      employee_id: employeeId,
      benefit_type: 'leave_monetization',
      year
    });
  }

  // Process actual leave monetization
  async processLeaveMonetization(request: {
    employee_id: number;
    leave_type_id: number;
    year: number;
    days_to_monetize: number;
  }): Promise<LeaveMonetizationResponse> {
    const response = await apiService.post<LeaveMonetizationResponse>('/leaves/monetize', request);
    return response;
  }

  // Format currency for display
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  // Get benefit type by code
  async getBenefitTypeByCode(code: string): Promise<BenefitType | undefined> {
    const types = await this.getBenefitTypes();
    return types.find(type => type.code === code);
  }

  // Check if benefit is taxable
  isBenefitTaxable(benefitCode: string): boolean {
    const taxableBenefits = ['PBB', 'MYB', 'YEB']; // Performance-based bonuses are typically taxable
    return taxableBenefits.includes(benefitCode);
  }

  // Get benefit category
  getBenefitCategory(benefitCode: string): 'bonus' | 'allowance' | 'award' | 'monetization' | 'other' {
    const bonuses = ['PBB', 'MYB', 'YEB']; // Performance-based bonuses
    const allowances = ['RATA', 'CA', 'MA', 'HA', 'SL']; // Various allowances
    const awards = ['LA']; // Loyalty awards
    const monetization = ['VLM', 'SLM']; // Leave monetization

    if (bonuses.includes(benefitCode)) return 'bonus';
    if (allowances.includes(benefitCode)) return 'allowance';
    if (awards.includes(benefitCode)) return 'award';
    if (monetization.includes(benefitCode)) return 'monetization';
    return 'other';
  }

  // Calculate total benefits for a year
  calculateYearlyTotal(benefits: EmployeeBenefitsResponse): number {
    const { bonuses, allowances, awards } = benefits.benefits;
    const allBenefits = [...bonuses, ...allowances, ...awards];
    return allBenefits.reduce((total, benefit) => total + benefit.amount, 0);
  }

  // Get next eligibility date for loyalty award
  getNextLoyaltyAwardDate(appointmentDate: string, currentServiceYears: number): Date | null {
    const appointment = new Date(appointmentDate);
    
    if (currentServiceYears < 10) {
      // Next award at 10 years
      const nextDate = new Date(appointment);
      nextDate.setFullYear(appointment.getFullYear() + 10);
      return nextDate;
    } else {
      // Next award every 5 years after 10
      const yearsAfterTen = currentServiceYears - 10;
      const nextMilestone = Math.ceil(yearsAfterTen / 5) * 5 + 10;
      const nextDate = new Date(appointment);
      nextDate.setFullYear(appointment.getFullYear() + nextMilestone);
      return nextDate;
    }
  }
}

export const benefitsService = new BenefitsService();
export default benefitsService;