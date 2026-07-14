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
      `Отметить заказ #${order.reference} как доставленный?`,
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
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.reference}>#{item.reference}</Text>
            <Text style={styles.total}>{item.total} ₽</Text>
          </View>

          <Text style={styles.address}>
            📍 {item.deliveryAddress || item.user?.address || 'Адрес не указан'}
          </Text>

          {item.user && (
            <Text style={styles.customer}>
              👤 {item.user.name} · {item.user.phone}
            </Text>
          )}

          <View style={styles.items}>
            {item.items.map((orderItem) => (
              <Text key={orderItem.id} style={styles.item}>
                {orderItem.productName} × {orderItem.quantity}
              </Text>
            ))}
          </View>

          {item.comment && (
            <Text style={styles.comment}>💬 {item.comment}</Text>
          )}

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
        </View>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reference: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  address: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  customer: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  items: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
    marginBottom: 8,
  },
  item: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  comment: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  deliveredButton: {
    backgroundColor: '#2c3e50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
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