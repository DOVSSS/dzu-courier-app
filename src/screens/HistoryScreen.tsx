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
import { OrderCardLayout } from '../components/OrderCardLayout';

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
        <OrderCardLayout
          order={item}
          showMap={false}
          headerRight={
            <View style={styles.headerRight}>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              <Text style={styles.total}>{item.total} ₽</Text>
            </View>
          }
          footer={
            <View style={styles.deliveredBadge}>
              <Text style={styles.deliveredText}>✔️ Доставлен</Text>
            </View>
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
  headerRight: {
    alignItems: 'flex-end',
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2ecc71',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#64748b',
  },
  deliveredBadge: {
    backgroundColor: '#e8f8f0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
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