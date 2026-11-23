import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getCourierBoard, acceptOrder, updateOrderStatus, pickupOrder } from '../services/orderService';
import { Order } from '../types/api.types';
import { Notifications } from '../utils/notifications';
import { OrderCardLayout } from '../components/OrderCardLayout';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:  { label: '🕐 Ожидает ресторан', color: '#D97706' },
  ACCEPTED: { label: '👨‍🍳 Готовится',        color: '#2563EB' },
  READY:    { label: '📦 Готов к выдаче',   color: '#059669' },
};

const AT_RESTAURANT_STATUS: Record<string, { label: string; color: string }> = {
  ACCEPTED: { label: '👨‍🍳 Ресторан готовит', color: '#2563EB' },
  READY:    { label: '📦 Готов к выдаче',  color: '#059669' },
};

type Section = {
  key: 'active' | 'available';
  title: string;
  data: Order[];
};

export default function AvailableOrdersScreen() {
  const navigation = useNavigation<any>();
  const [available, setAvailable] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takingId, setTakingId] = useState<string | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
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

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getCourierBoard();
      setAvailable(data.available);
      setActive(data.active);
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
  }, []);

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
  }, [fetchOrders]));

  const handleTakeOrder = async (order: Order) => {
    try {
      setTakingId(order.id);
      const updated = await acceptOrder(order.id);
      const taken: Order = {
        ...order,
        ...updated,
        courierId: updated.courierId ?? 'taken',
      };
      setAvailable((prev) => prev.filter((o) => o.id !== order.id));
      setActive((prev) => [taken, ...prev.filter((o) => o.id !== order.id)]);
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
              setActive((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
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

  const handleDelivered = (order: Order) => {
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
              setActive((prev) => prev.filter((o) => o.id !== order.id));
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
      ],
    );
  };

  if (isLoading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2c3e50" />
    </View>
  );

  if (error && !hasLoadedOnce.current) return (
    <View style={styles.centered}>
      <Text style={styles.error}>{error}</Text>
      <TouchableOpacity style={styles.button} onPress={() => { setIsLoading(true); fetchOrders(); }}>
        <Text style={styles.buttonText}>Повторить</Text>
      </TouchableOpacity>
    </View>
  );

  const sections: Section[] = [
    { key: 'active', title: 'В работе', data: active },
    { key: 'available', title: 'Новые', data: available },
  ].filter((section) => section.data.length > 0);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => { setIsRefreshing(true); fetchOrders(); }}
        />
      }
      ListHeaderComponent={
        <View>
          {error && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>{error}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.historyText}>📋 История доставок</Text>
          </TouchableOpacity>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.empty}>Нет заказов</Text>
          <Text style={styles.emptyHint}>Потяните вниз чтобы обновить</Text>
        </View>
      }
      renderItem={({ item, section }) => {
        if (section.key === 'active') {
          const atRestaurant = AT_RESTAURANT_STATUS[item.status];
          const waitingForRestaurant = item.status === 'ACCEPTED';
          const busy = deliveringId === item.id;

          return (
            <OrderCardLayout
              order={item}
              showMap
              headerRight={<Text style={styles.activeTotal}>{item.total} ₽</Text>}
              footer={
                <View>
                  {atRestaurant && (
                    <View style={[styles.badge, { backgroundColor: atRestaurant.color + '18' }]}>
                      <Text style={[styles.badgeText, { color: atRestaurant.color }]}>
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
        }

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
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, backgroundColor: '#f5f5f5', flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  historyButton: {
    backgroundColor: '#7f8c8d', padding: 14, borderRadius: 8,
    alignItems: 'center', marginBottom: 16,
  },
  historyText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
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
  activeTotal: { fontSize: 17, fontWeight: '700', color: '#2ecc71' },
  takeButton: {
    backgroundColor: '#2ecc71', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, alignItems: 'center',
  },
  deliveredButton: {
    backgroundColor: '#2c3e50',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  pickupButton: { backgroundColor: '#2ecc71' },
  waitingButton: { backgroundColor: '#95a5a6' },
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
