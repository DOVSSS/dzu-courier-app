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
import { useNavigation } from '@react-navigation/native';
import { getReadyOrders, updateOrderStatus } from '../services/orderService';
import { Order } from '../types/api.types';
import { useAuth } from '../context/AuthContext';
import { Alert } from 'react-native';
export default function AvailableOrdersScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takingId, setTakingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setError(null);
      const data = await getReadyOrders();
      setOrders(data);
    } catch (e: any) {
      setError('Не удалось загрузить заказы');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

 const handleTakeOrder = async (order: Order) => {
  try {
    setTakingId(order.id);
    await updateOrderStatus(order.id, 'DELIVERING');
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
  } catch (e: any) {
    Alert.alert('Ошибка', 'Не удалось взять заказ');
  } finally {
    setTakingId(null);
  }
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
    <View style={{ flex: 1 }}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
  <View>
    <TouchableOpacity
      style={styles.myDeliveriesButton}
      onPress={() => navigation.navigate('MyDeliveries')}
    >
      <Text style={styles.myDeliveriesText}>🚴 Мои активные доставки</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.historyButton}
      onPress={() => navigation.navigate('History')}
    >
      <Text style={styles.myDeliveriesText}>📋 История доставок</Text>
    </TouchableOpacity>
  </View>
}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.empty}>Нет доступных заказов</Text>
            <Text style={styles.emptyHint}>Потяните вниз чтобы обновить</Text>
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
                styles.takeButton,
                takingId === item.id && styles.buttonDisabled,
              ]}
              onPress={() => handleTakeOrder(item)}
              disabled={takingId === item.id}
            >
              {takingId === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Взять заказ</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </View>
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
  myDeliveriesButton: {
    backgroundColor: '#2c3e50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  myDeliveriesText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
  takeButton: {
    backgroundColor: '#2ecc71',
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
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: '#bbb',
  },
  error: {
    color: '#e74c3c',
    marginBottom: 16,
  },
  logoutButton: {
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoutText: {
    color: '#999',
    fontSize: 14,
  },
  historyButton: {
  backgroundColor: '#7f8c8d',
  padding: 14,
  borderRadius: 8,
  alignItems: 'center',
  marginBottom: 16,
},
});