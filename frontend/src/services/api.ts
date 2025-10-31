import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { showToast } from "@/lib/toast"

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
      withCredentials: true,
      // Don't set default Content-Type - let axios handle it per request
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Set Content-Type based on data type
        if (config.data instanceof FormData) {
          // For FormData, don't set Content-Type - let the browser add it with boundary
          // This is crucial for file uploads
        } else if (config.data && !config.headers?.['Content-Type']) {
          // For other data (JSON), set Content-Type to application/json
          if (config.headers) {
            config.headers['Content-Type'] = 'application/json';
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';
        
        // Don't show toast for authentication errors on initial load
        if (error.response?.status !== 401 || window.location.pathname !== '/') {
          showToast.error(message);
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic API methods
  public async get<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    const response = await this.api.get(url, config);
    
    // For blob responses, return the response data directly
    if (config?.responseType === 'blob') {
      return response.data as T;
    }
    
    return response.data;
  }

  public async post<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    const response = await this.api.post(url, data, config);
    
    // For blob responses, return the response data directly
    if (config?.responseType === 'blob') {
      return response.data as T;
    }
    
    return response.data;
  }

  public async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.api.put(url, data);
    return response.data;
  }

  public async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.api.patch(url, data);
    return response.data;
  }

  public async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete(url);
    return response.data;
  }

  public async upload<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.api.post(url, formData);
    return response.data;
  }

  public async postFormData<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.api.post(url, formData);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;