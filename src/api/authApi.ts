import axiosClient from './axiosClient';
import { LoginRequest, LoginResponse } from '@/types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await axiosClient.post('/auth/logout', { refreshToken });
  },

  refreshTokens: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await axiosClient.post<LoginResponse>('/auth/refresh-tokens', { refreshToken });
    return response.data;
  },
};

export default authApi;
