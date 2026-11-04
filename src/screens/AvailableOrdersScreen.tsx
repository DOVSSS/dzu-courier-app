import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getAvailableOrders, acceptOrder } from '../services/orderService';
import { Order } from '../types/api.types';
import { Notifications } from '../utils/notifications';
import { OrderCardLayout } from '../components/OrderCardLayout';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:  { label: '🕐 Ожидает ресторан', color: '#D97706' },
  ACCEPTED: { label: '👨‍🍳 Готовится',        color: '#2563EB' },
  READY:    { label: '📦 Готов к выдаче',   color: '#059669' },
};

export default function AvailableOrdersScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takingId, setTakingId] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.headerBtnText}>👤 Профиль</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Опрашиваем сервер только пока экран открыт
  useFocusEffect(useCallback(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
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
      const data = await getAvailableOrders();
      setOrders(data);
      hasLoadedOnce.current = true;
      setError(null);
    } catch {
      setError(hasLoadedOnce.current
        ? 'Нет связи с сервером. Показаны последние загруженные заказы.'
        : 'Не удалось загрузить заказы');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const retry = () => {
    setIsLoading(true);
    fetchOrders();
  };

  const handleTakeOrder = async (order: Order) => {
    try {
      setTakingId(order.id);
      await acceptOrder(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      if (order.type !== 'TAXI') {
        Alert.alert(
          'Заказ ваш',
          'Он в разделе «Мои активные доставки». Когда заберёте заказ в ресторане, нажмите «Взял заказ».',
        );
      }
    } catch (e: any) {
      const message = e?.response?.data?.message;
      Alert.alert(
        'Ошибка',
        message === 'Order already taken by another courier'
          ? 'Этот заказ уже взял другой курьер'
          : 'Не удалось взять заказ',
      );
      fetchOrders();
    } finally {
      setTakingId(null);
    }
  };

  if (isLoading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2c3e50" />
    </View>
  );

  if (error && !hasLoadedOnce.current) return (
    <View style={styles.centered}>
      <Text style={styles.error}>{error}</Text>
      <TouchableOpacity style={styles.button} onPress={retry}>
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
            {error && (
              <View style={styles.offlineBanner}>
                <Text style={styles.offlineText}>{error}</Text>
              </View>
            )}
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
          const isTaxi = item.type === 'TAXI';
          const cfg = isTaxi && item.status === 'READY'
            ? { label: '🚕 Ждёт курьера', color: '#D97706' }
            : (STATUS_CONFIG[item.status] ?? { label: item.status, color: '#999' });
          const canTake = isTaxi
            ? item.status === 'READY'
            : item.status === 'ACCEPTED' || item.status === 'READY';

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
                  {canTake && (
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
  headerBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  headerBtnText: { color: '#2c3e50', fontSize: 14, fontWeight: '600' },
  offlineBanner: {
    backgroundColor: '#FEF2F2', borderRadius: 8,
    padding: 10, marginBottom: 12,
  },
  offlineText: { color: '#e74c3c', fontSize: 13 },
});