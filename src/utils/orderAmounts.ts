import { Order } from '../types/api.types';

export type OrderAmounts = {
  total: number;
  foodTotal: number;
  deliveryFee: number;
  serviceFee: number;
};

/**
 * Сервисный сбор в заказе отдельно не хранится: бэкенд считает
 * total = сумма блюд + доставка + сервисный сбор, поэтому сбор — это остаток.
 */
export function getOrderAmounts(order: Order): OrderAmounts {
  const total = order.total ?? 0;

  if (order.type === 'TAXI') {
    return { total, foodTotal: 0, deliveryFee: total, serviceFee: 0 };
  }

  const foodTotal = (order.items ?? []).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = order.deliveryFee ?? 0;
  const serviceFee = Math.max(0, total - foodTotal - deliveryFee);

  return { total, foodTotal, deliveryFee, serviceFee };
}

export function isSameLocalDay(dateString: string, day: Date = new Date()): boolean {
  const date = new Date(dateString);
  return (
    date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate()
  );
}
