export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isEmailVerified?: boolean;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface TokenInfo {
  token: string;
  expires: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    access: TokenInfo;
    refresh: TokenInfo;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
