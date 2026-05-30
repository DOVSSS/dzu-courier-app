import api from './api';
import { Order } from '../types/api.types';

export const getReadyOrders = async (): Promise<Order[]> => {
  const response = await api.get('/orders');
  const orders: Order[] = response.data;
  return orders.filter((o) => o.status === 'READY');
};

export const getMyDeliveries = async (): Promise<Order[]> => {
  const response = await api.get('/orders');
  const orders: Order[] = response.data;
  return orders.filter((o) => o.status === 'DELIVERING');
};

export const getDeliveredOrders = async (): Promise<Order[]> => {  // ← новый
  const response = await api.get('/orders');
  const orders: Order[] = response.data;
  return orders.filter((o) => o.status === 'DELIVERED');
};

export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<Order> => {
  const response = await api.patch(`/orders/${orderId}`, { status });
  return response.data;
};