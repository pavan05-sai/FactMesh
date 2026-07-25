import api from './api';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/register', { email, password });
  return res.data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/api/auth/login', { email, password });
  return res.data;
}
