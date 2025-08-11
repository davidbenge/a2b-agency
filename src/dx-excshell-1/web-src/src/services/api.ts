import { Brand } from '../../../../actions/classes/Brand';

// note: make sure you have the value in the env variable. (should be 27200-a2b-[your-namespace])
const runtime_namespace = process.env.AIO_runtime_namespace;
const BASE_URL = `https://${runtime_namespace}.adobeioruntime.net/api/v1/web/a2b-agency`;

/**
 * API configuration and endpoints
 */
const API_CONFIG = {
  ENDPOINTS: {
    BRAND_GET_LIST: '/get-brands',
    BRAND_CREATE: '/new-brand-registration'
  }
};

/**
 * API response interface
 */
interface ApiResponse<T> {
  statusCode: number;
  body: {
    message: string;
    data?: T;
    error?: string;
  };
}

/**
 * API service class for handling serverless function calls
 */
export class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  private imsToken: string | null = null;
  private imsOrgId: string | null = null;

  private constructor() {
    this.baseUrl = '';
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Initialize the API service with base URL and IMS token
   * @param baseUrl - The base URL from ViewPropsBase
   * @param imsToken - The IMS token from ViewPropsBase
   */
  public initialize(
    imsToken: string,
    imsOrgId: string,
    baseUrl = BASE_URL
  ): void {
    this.baseUrl = baseUrl;
    this.imsToken = imsToken;
    this.imsOrgId = imsOrgId;
  }

  /**
   * Clear the IMS token and base URL
   */
  public clear(): void {
    this.imsToken = null;
    this.baseUrl = '';
    this.imsOrgId = null;
  }

  /**
   * Generic method to call serverless functions
   */
  private async callApi<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<ApiResponse<T>> {
    if (!this.baseUrl) {
      return {
        statusCode: 500,
        body: {
          message: 'API not initialized',
          error: 'Base URL not set'
        }
      };
    }

    if (!this.imsToken) {
      return {
        statusCode: 401,
        body: {
          message: 'Authentication required',
          error: 'IMS token not set'
        }
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-gw-ims-org-id': `${this.imsOrgId}`,
          Authorization: `Bearer ${this.imsToken}`
        },
        body: body ? JSON.stringify(body) : undefined
      });

      console.debug(
        `API calling ${this.baseUrl}${endpoint} with method ${method}`
      );
      const data = await response.json();
      console.debug('API call response', data);
      console.debug('API call response json', JSON.stringify(data, null, 2));

      // Transform the response to match our interface
      return {
        statusCode: response.status,
        body: {
          message: data.message || '',
          data: data?.data || data,
          error: data.error
        }
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: {
          message: 'API call failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get brand list
   */
  async getBrandList(): Promise<ApiResponse<Brand[]>> {
    return this.callApi<Brand[]>(
      `${API_CONFIG.ENDPOINTS.BRAND_GET_LIST}`,
      'GET'
    );
  }

  async createBrand(brandData: Partial<Brand>): Promise<ApiResponse<Brand>> {
    return this.callApi<Brand>(
      `${API_CONFIG.ENDPOINTS.BRAND_CREATE}`,
      'POST',
      brandData
    );
  }
}

// Export a singleton instance
export const apiService = ApiService.getInstance();
