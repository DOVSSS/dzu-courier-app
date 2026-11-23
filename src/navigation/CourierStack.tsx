import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AvailableOrdersScreen from '../screens/AvailableOrdersScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

export default function CourierStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AvailableOrders"
        component={AvailableOrdersScreen}
        options={{ title: 'Заказы' }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'История доставок' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Stack.Navigator>
  );
}
