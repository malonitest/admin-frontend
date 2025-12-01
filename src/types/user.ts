export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}

export interface UserDetail extends UserListItem {
  phone?: string;
  address?: string;
  updatedAt: string;
}
