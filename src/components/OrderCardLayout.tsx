import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order } from '../types/api.types';
import { openInMaps } from '../utils/openInMaps';
import { showPhoneActions } from '../utils/phoneActions';

type Props = {
  order: Order;
  showMap?: boolean;
  footer?: ReactNode;
  headerRight?: ReactNode;
};

export function OrderCardLayout({ order, showMap = false, footer, headerRight }: Props) {
  const isTaxi = order.type === 'TAXI';
  const pickupAddress = order.deliveryAddress || order.user?.address || 'Адрес не указан';
  const destinationAddress = order.destinationAddress?.trim() || null;
  const hasPickupCoords = order.deliveryLat != null && order.deliveryLng != null;
  const hasDestCoords = order.destinationLat != null && order.destinationLng != null;

  return (
    <View style={[styles.card, isTaxi && styles.cardTaxi]}>
      <View style={styles.cardTopRow}>
        {isTaxi ? (
          <View style={styles.taxiTypeBadge}>
            <Text style={styles.taxiTypeBadgeText}>🚕 Такси</Text>
          </View>
        ) : (
          <View style={styles.cardTopSpacer} />
        )}
        {headerRight}
      </View>

      {order.user && (
        <View style={styles.clientBlock}>
          <Text style={styles.clientLabel}>Клиент</Text>
          <Text style={styles.clientName}>{order.user.name}</Text>
          {order.user.phone ? (
            <TouchableOpacity
              onPress={() => showPhoneActions(order.user!.phone)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Телефон клиента ${order.user.phone}`}
            >
              <Text style={styles.clientPhone}>📞 {order.user.phone}</Text>
              <Text style={styles.phoneHint}>Нажмите — позвонить или скопировать</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <View style={styles.addressBlock}>
        <Text style={styles.addressLabel}>{isTaxi ? 'Адрес подачи' : 'Адрес доставки'}</Text>
        <Text style={styles.addressText}>{pickupAddress}</Text>
      </View>

      {isTaxi && destinationAddress ? (
        <View style={styles.addressBlock}>
          <Text style={styles.addressLabel}>Адрес назначения</Text>
          <Text style={styles.addressText}>{destinationAddress}</Text>
        </View>
      ) : null}

      {showMap && hasPickupCoords && (
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() =>
            openInMaps(order.deliveryLat!, order.deliveryLng!, pickupAddress)
          }
        >
          <Text style={styles.mapButtonText}>
            {isTaxi ? '🗺️ Подача на карте' : '🗺️ Показать на карте'}
          </Text>
        </TouchableOpacity>
      )}

      {showMap && isTaxi && hasDestCoords && destinationAddress && (
        <TouchableOpacity
          style={[styles.mapButton, styles.mapButtonSecondary]}
          onPress={() =>
            openInMaps(order.destinationLat!, order.destinationLng!, destinationAddress)
          }
        >
          <Text style={styles.mapButtonText}>🗺️ Назначение на карте</Text>
        </TouchableOpacity>
      )}

      {!isTaxi && order.items.length > 0 ? (
        <View style={styles.items}>
          {order.items.map((orderItem) => (
            <View key={orderItem.id} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {orderItem.productName}
              </Text>
              <Text style={styles.itemQty}>×{orderItem.quantity}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {order.comment ? (
        <View style={styles.commentBlock}>
          <Text style={styles.commentLabel}>Комментарий</Text>
          <Text style={styles.commentText}>{order.comment}</Text>
        </View>
      ) : null}

      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8ecf0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTaxi: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTopSpacer: { flex: 1 },
  taxiTypeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  taxiTypeBadgeText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  clientBlock: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  clientLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  phoneHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  addressBlock: {
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
    fontWeight: '500',
  },
  mapButton: {
    alignSelf: 'stretch',
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  mapButtonSecondary: {
    backgroundColor: '#059669',
    marginTop: -4,
  },
  items: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 8,
  },
  commentBlock: {
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  commentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#78350f',
    fontStyle: 'italic',
  },
});
