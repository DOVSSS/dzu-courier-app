import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import AuthStack from './AuthStack';
import CourierStack from './CourierStack';

export default function RootNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <CourierStack /> : <AuthStack />}
    </NavigationContainer>
  );
}