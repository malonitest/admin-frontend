import { axiosClient } from './axiosClient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  results: User[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  role?: string;
}

export const usersApi = {
  getUsers: async (params: GetUsersParams = {}): Promise<UsersResponse> => {
    const response = await axiosClient.get('/users', { params });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await axiosClient.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (data: Partial<User> & { password: string }): Promise<User> => {
    const response = await axiosClient.post('/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await axiosClient.patch(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await axiosClient.delete(`/users/${id}`);
  },
};

export default usersApi;
