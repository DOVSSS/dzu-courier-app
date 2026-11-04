import api from './api';
import { Order } from '../types/api.types';

export const getAvailableOrders = async (): Promise<Order[]> => {
  const response = await api.get('/orders');
  const orders: Order[] = response.data;
  return orders.filter(
    (o) => !o.courierId && (o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'READY'),
  );
};

/** Взятые курьером заказы: ещё в ресторане (ACCEPTED/READY) и уже в пути (DELIVERING). */
export const getMyDeliveries = async (): Promise<Order[]> => {
  const response = await api.get('/orders');
  const orders: Order[] = response.data;
  return orders.filter(
    (o) => !!o.courierId && (o.status === 'ACCEPTED' || o.status === 'READY' || o.status === 'DELIVERING'),
  );
};

export const getDeliveredOrders = async (): Promise<Order[]> => {  
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

export const updateCourierLocation = async (
  orderId: string,
  lat: number,
  lng: number
): Promise<void> => {
  await api.patch(`/orders/${orderId}/location`, { lat, lng });
};

export const acceptOrder = async (orderId: string): Promise<Order> => {
  const response = await api.patch(`/orders/${orderId}/accept`);
  return response.data;
};

export const pickupOrder = async (orderId: string): Promise<Order> => {
  const response = await api.patch(`/orders/${orderId}/pickup`);
  return response.data;
};