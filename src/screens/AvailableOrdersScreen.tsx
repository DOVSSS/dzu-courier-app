import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAvailableOrders, acceptOrder } from '../services/orderService';
import { Order } from '../types/api.types';
import { useAuth } from '../context/AuthContext';
import * as Notifications from 'expo-notifications';
import { OrderCardLayout } from '../components/OrderCardLayout';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:  { label: '🕐 Ожидает ресторан', color: '#D97706' },
  ACCEPTED: { label: '👨‍🍳 Готовится',        color: '#2563EB' },
  READY:    { label: '📦 Готов к выдаче',   color: '#059669' },
};

export default function AvailableOrdersScreen() {
  const navigation = useNavigation<any>();
  const { logout, deleteAccount } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takingId, setTakingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    const subscription = Notifications.addNotificationReceivedListener(() => {
      fetchOrders();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setError(null);
      const data = await getAvailableOrders();
      setOrders(data);
    } catch (e: any) {
      setError('Не удалось загрузить заказы');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const performDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      Alert.alert(
        'Учётные данные удалены',
        'Ваш аккаунт был успешно удалён.',
        [{ text: 'OK' }],
      );
    } catch {
      Alert.alert('Ошибка', 'Не удалось удалить аккаунт');
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    const message =
      'Это действие необратимо. Все ваши данные курьера и история доставок будут удалены.';

    if (Platform.OS === 'web') {
      if (window.confirm(`Удалить аккаунт?\n${message}`)) {
        performDeleteAccount();
      }
      return;
    }

    Alert.alert('Удалить аккаунт?', message, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: performDeleteAccount,
      },
    ]);
  };

  const handleTakeOrder = async (order: Order) => {
    try {
      setTakingId(order.id);
      await acceptOrder(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch (e: any) {
      Alert.alert('Ошибка', 'Не удалось взять заказ');
    } finally {
      setTakingId(null);
    }
  };

  if (isLoading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2c3e50" />
    </View>
  );

  if (error) return (
    <View style={styles.centered}>
      <Text style={styles.error}>{error}</Text>
      <TouchableOpacity style={styles.button} onPress={fetchOrders}>
        <Text style={styles.buttonText}>Повторить</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchOrders(); }} />
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
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] ?? { label: item.status, color: '#999' };
          const isReady = item.status === 'READY';

          return (
            <OrderCardLayout
              order={item}
              showMap={false}
              headerRight={
                <View style={[styles.badge, { backgroundColor: cfg.color + '18' }]}>
                  <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              }
              footer={
                <View style={styles.cardFooter}>
                  <Text style={styles.total}>{item.total} ₽</Text>
                  {isReady && (
                    <TouchableOpacity
                      style={[styles.takeButton, takingId === item.id && styles.buttonDisabled]}
                      onPress={() => handleTakeOrder(item)}
                      disabled={takingId === item.id}
                    >
                      {takingId === item.id
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.buttonText}>Взять заказ</Text>
                      }
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          );
        }}
      />
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDeleteAccount}
        disabled={isDeleting}
      >
        {isDeleting
          ? <ActivityIndicator color="#EF4444" />
          : <Text style={styles.deleteBtnText}>Удалить аккаунт</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, backgroundColor: '#f5f5f5', flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  myDeliveriesButton: {
    backgroundColor: '#2c3e50', padding: 14, borderRadius: 8,
    alignItems: 'center', marginBottom: 16,
  },
  historyButton: {
    backgroundColor: '#7f8c8d', padding: 14, borderRadius: 8,
    alignItems: 'center', marginBottom: 16,
  },
  myDeliveriesText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  total: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  takeButton: {
    backgroundColor: '#2ecc71', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, alignItems: 'center',
  },
  button: { backgroundColor: '#2c3e50', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  empty: { fontSize: 16, color: '#999', marginBottom: 8 },
  emptyHint: { fontSize: 13, color: '#bbb' },
  error: { color: '#e74c3c', marginBottom: 16 },
  logoutButton: { padding: 14, alignItems: 'center', backgroundColor: '#fff' },
  logoutText: { color: '#999', fontSize: 14 },
  deleteBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#fff',
  },
  deleteBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});