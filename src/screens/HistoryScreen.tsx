import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getDeliveredOrders } from '../services/orderService';
import { Order } from '../types/api.types';

export default function HistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setError(null);
      const data = await getDeliveredOrders();
      setOrders(data);
    } catch (e: any) {
      setError('Не удалось загрузить историю');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const totalEarnings = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
      ListHeaderComponent={
        orders.length > 0 ? (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Всего доставок</Text>
            <Text style={styles.statsCount}>{orders.length}</Text>
            <Text style={styles.statsEarnings}>
              Сумма заказов: {totalEarnings} ₽
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.empty}>История доставок пуста</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.reference}>#{item.reference}</Text>
            <Text style={styles.total}>{item.total} ₽</Text>
          </View>

          <Text style={styles.date}>🕐 {formatDate(item.createdAt)}</Text>

         <Text style={styles.address}>
  📍 {item.deliveryAddress || item.user?.address || 'Адрес не указан'}
</Text>

          {item.user && (
            <Text style={styles.customer}>
              👤 {item.user.name}
            </Text>
          )}

          <View style={styles.items}>
            {item.items.map((orderItem) => (
              <Text key={orderItem.id} style={styles.item}>
                {orderItem.productName} × {orderItem.quantity}
              </Text>
            ))}
          </View>

          <View style={styles.deliveredBadge}>
            <Text style={styles.deliveredText}>✔️ Доставлен</Text>
          </View>
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
  statsCard: {
    backgroundColor: '#2c3e50',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statsTitle: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 4,
  },
  statsCount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  statsEarnings: {
    color: '#2ecc71',
    fontSize: 14,
    marginTop: 4,
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
    marginBottom: 6,
  },
  reference: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  total: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  customer: {
    fontSize: 13,
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
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  deliveredBadge: {
    backgroundColor: '#e8f8f0',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  deliveredText: {
    color: '#2ecc71',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2c3e50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
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