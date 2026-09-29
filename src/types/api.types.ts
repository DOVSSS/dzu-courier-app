export type UserRole = 'USER' | 'RESTAURANT' | 'COURIER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

export interface OrderUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  
}

export interface Order {
  id: string;
  reference: string;
  status: string;
  total: number;
  deliveryAddress: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  comment: string | null;
  createdAt: string;
  user: OrderUser | null;
  items: OrderItem[];
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED';