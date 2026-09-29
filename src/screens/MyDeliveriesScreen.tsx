import React, { useEffect, useState } from 'react';
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
import { getMyDeliveries, updateOrderStatus } from '../services/orderService';
import { Order } from '../types/api.types';
import { OrderCardLayout } from '../components/OrderCardLayout';

export default function MyDeliveriesScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setError(null);
      const data = await getMyDeliveries();
      setOrders(data);
    } catch (e: any) {
      setError('Не удалось загрузить доставки');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
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
              Alert.alert('Ошибка', 'Не удалось обновить статус');
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

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={fetchOrders}>
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
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.empty}>Нет активных доставок</Text>
        </View>
      }
      renderItem={({ item }) => (
        <OrderCardLayout
          order={item}
          showMap
          headerRight={<Text style={styles.total}>{item.total} ₽</Text>}
          footer={
            <TouchableOpacity
              style={[
                styles.deliveredButton,
                deliveringId === item.id && styles.buttonDisabled,
              ]}
              onPress={() => handleDelivered(item)}
              disabled={deliveringId === item.id}
            >
              {deliveringId === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>✔️ Доставлен</Text>
              )}
            </TouchableOpacity>
          }
        />
      )}
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
});