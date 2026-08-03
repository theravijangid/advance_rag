import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

class ApiConnector {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${BASE_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Central response interceptor to handle unified error normalization
    this.client.interceptors.response.use(
      (response) => {
        // We assume backend always returns { success: boolean, data?: any, message?: string }
        // For convenience, we unwrap the data here so domain services don't have to
        return response.data?.data !== undefined ? response.data.data : response.data;
      },
      (error: AxiosError) => {
        const status = error.response?.status || 500;
        const errorData: any = error.response?.data;
        
        // Expected format from apiResponseHandlingClass: { success: false, error: '...' }
        const errorMessage = errorData?.error || errorData?.message || error.message || 'An error occurred';
        
        throw new ApiError(status, errorMessage, errorData);
      }
    );
  }

  private getConfig(token: string | null, customConfig: AxiosRequestConfig = {}): AxiosRequestConfig {
    const config: AxiosRequestConfig = { ...customConfig };
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  }

  public async get<T = any>(url: string, token: string | null, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get<T, T>(url, this.getConfig(token, config));
  }

  public async post<T = any>(url: string, data: any, token: string | null, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post<T, T>(url, data, this.getConfig(token, config));
  }

  public async put<T = any>(url: string, data: any, token: string | null, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put<T, T>(url, data, this.getConfig(token, config));
  }

  public async delete<T = any>(url: string, token: string | null, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete<T, T>(url, this.getConfig(token, config));
  }
}

export const apiConnector = new ApiConnector();
