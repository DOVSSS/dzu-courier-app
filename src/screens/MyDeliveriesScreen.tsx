import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyDeliveries, updateOrderStatus, pickupOrder } from '../services/orderService';
import { Order } from '../types/api.types';
import { OrderCardLayout } from '../components/OrderCardLayout';
import { Notifications } from '../utils/notifications';

const AT_RESTAURANT_STATUS: Record<string, { label: string; color: string }> = {
  ACCEPTED: { label: '👨‍🍳 Ресторан готовит', color: '#2563EB' },
  READY:    { label: '📦 Готов к выдаче',  color: '#059669' },
};

export default function MyDeliveriesScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  // Обновляем, пока экран открыт: заказ могут отменить клиент или администратор
  useFocusEffect(useCallback(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    const subscription = Notifications?.addNotificationReceivedListener(() => {
      fetchOrders();
    });
    return () => {
      clearInterval(interval);
      subscription?.remove();
    };
  }, []));

  const fetchOrders = async () => {
    try {
      const data = await getMyDeliveries();
      setOrders(data);
      hasLoadedOnce.current = true;
      setError(null);
    } catch {
      setError(hasLoadedOnce.current
        ? 'Нет связи с сервером. Показаны последние загруженные доставки.'
        : 'Не удалось загрузить доставки');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const handlePickup = (order: Order) => {
    Alert.alert(
      'Подтверждение',
      `Вы забрали заказ #${order.reference} в ресторане?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Взял заказ',
          onPress: async () => {
            try {
              setDeliveringId(order.id);
              const updated = await pickupOrder(order.id);
              setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
            } catch (e: any) {
              const message = e?.response?.data?.message;
              Alert.alert(
                'Ошибка',
                typeof message === 'string' && message.includes('CANCELLED')
                  ? 'Этот заказ был отменён'
                  : typeof message === 'string' && message.includes('not marked the order as ready')
                    ? 'Ресторан ещё не отметил заказ готовым к выдаче'
                    : 'Не удалось обновить статус',
              );
              fetchOrders();
            } finally {
              setDeliveringId(null);
            }
          },
        },
      ],
    );
  };

  const handleDelivered = async (order: Order) => {
    Alert.alert(
      'Подтверждение',
      `Отметить доставку для ${order.user?.name ?? 'клиента'} как выполненную?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Доставлен',
          onPress: async () => {
            try {
              setDeliveringId(order.id);
              await updateOrderStatus(order.id, 'DELIVERED');
              setOrders((prev) => prev.filter((o) => o.id !== order.id));
            } catch (e: any) {
              const message = e?.response?.data?.message;
              Alert.alert(
                'Ошибка',
                typeof message === 'string' && message.includes('CANCELLED')
                  ? 'Этот заказ был отменён'
                  : 'Не удалось обновить статус',
              );
              fetchOrders();
            } finally {
              setDeliveringId(null);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  if (error && !hasLoadedOnce.current) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => { setIsLoading(true); fetchOrders(); }}>
          <Text style={styles.buttonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
      ListHeaderComponent={
        error ? (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>{error}</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.empty}>Нет активных доставок</Text>
        </View>
      }
      renderItem={({ item }) => {
        const atRestaurant = AT_RESTAURANT_STATUS[item.status];
        const waitingForRestaurant = item.status === 'ACCEPTED';
        const busy = deliveringId === item.id;

        return (
          <OrderCardLayout
            order={item}
            showMap
            headerRight={<Text style={styles.total}>{item.total} ₽</Text>}
            footer={
              <View>
                {atRestaurant && (
                  <View style={[styles.statusBadge, { backgroundColor: atRestaurant.color + '18' }]}>
                    <Text style={[styles.statusBadgeText, { color: atRestaurant.color }]}>
                      {atRestaurant.label}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.deliveredButton,
                    atRestaurant && styles.pickupButton,
                    waitingForRestaurant && styles.waitingButton,
                    busy && styles.buttonDisabled,
                  ]}
                  onPress={() => (atRestaurant ? handlePickup(item) : handleDelivered(item))}
                  disabled={busy || waitingForRestaurant}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {waitingForRestaurant
                        ? '⏳ Ждём «Готов к выдаче» от ресторана'
                        : atRestaurant ? '📦 Взял заказ' : '✔️ Доставлен'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            }
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  total: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2ecc71',
  },
  deliveredButton: {
    backgroundColor: '#2c3e50',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  pickupButton: {
    backgroundColor: '#2ecc71',
  },
  waitingButton: {
    backgroundColor: '#95a5a6',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2c3e50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  empty: {
    fontSize: 16,
    color: '#999',
  },
  error: {
    color: '#e74c3c',
    marginBottom: 16,
  },
  offlineBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  offlineText: {
    color: '#e74c3c',
    fontSize: 13,
  },
});