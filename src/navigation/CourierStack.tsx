import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AvailableOrdersScreen from '../screens/AvailableOrdersScreen';
import MyDeliveriesScreen from '../screens/MyDeliveriesScreen';
import HistoryScreen from '../screens/HistoryScreen';  // ← добавить

const Stack = createStackNavigator();

export default function CourierStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AvailableOrders"
        component={AvailableOrdersScreen}
        options={{ title: 'Доступные заказы' }}
      />
      <Stack.Screen
        name="MyDeliveries"
        component={MyDeliveriesScreen}
        options={{ title: 'Мои доставки' }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'История доставок' }}
      />
    </Stack.Navigator>
  );
}