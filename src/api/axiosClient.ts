import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const DEFAULT_API_BASE_URL = 'https://backrent-itx754fut5nry-app.purplepond-bd8ec00c.westeurope.azurecontainerapps.io/v1';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

console.log('Using backend URL:', API_BASE_URL);

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor - add auth token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');

    // Ensure headers exist and set auth header reliably (AxiosHeaders vs plain object)
    if (token) {
      config.headers = config.headers ?? {};
      const headersAny = config.headers as any;
      if (typeof headersAny.set === 'function') {
        headersAny.set('Authorization', `Bearer ${token}`);
      } else {
        headersAny.Authorization = `Bearer ${token}`;
      }
    } else {
      const url = (config.url || '').toString();
      if (!url.includes('/auth/')) {
        console.warn('[Auth] Missing access token for request:', url);
      }
    }

    // Avoid forcing JSON for multipart/form-data requests.
    // Axios will automatically set Content-Type for JSON bodies.
    if (config.data instanceof FormData) {
      const headersAny = (config.headers ?? {}) as any;
      if (typeof headersAny.delete === 'function') {
        headersAny.delete('Content-Type');
      } else {
        delete headersAny['Content-Type'];
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors and token refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 error and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-tokens`, {
            refreshToken,
          });
          
          const { access, refresh } = response.data.tokens;
          
          // Store new tokens
          localStorage.setItem('token', access.token);
          localStorage.setItem('refreshToken', refresh.token);
          
          // Update the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access.token}`;
          }
          
          // Retry the original request
          return axiosClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear auth data and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = window.location.pathname.startsWith('/customer') ? '/customer/login' : '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token - redirect to login
        console.warn('[Auth] 401 and no refreshToken; redirecting to /login');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = window.location.pathname.startsWith('/customer') ? '/customer/login' : '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
