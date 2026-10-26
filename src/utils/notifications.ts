import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

// Expo Go on Android (SDK 53+) crashes as soon as expo-notifications is loaded,
// so the module is required lazily and skipped there. Push works in EAS / dev builds.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const Notifications: NotificationsModule | null = isExpoGo
  ? null
  : require('expo-notifications');

// Как показывать уведомления когда приложение открыто
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications) {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  // Канал нужно создать до запроса разрешения, иначе Android 13+ не покажет диалог
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Заказы',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
    // Звук канала Android не даёт поменять после создания — для другого звука нужен новый id
    await Notifications.setNotificationChannelAsync('new-orders', {
      name: 'Новые заказы',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'new_order.wav',
      vibrationPattern: [0, 500, 250, 500, 250, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (error) {
    if (__DEV__) console.warn('Failed to get push token:', error);
    return null;
  }
}
