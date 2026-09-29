import { Alert, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';

function phoneForTel(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function showPhoneActions(phone: string): void {
  const tel = phoneForTel(phone);
  if (!tel) return;

  const call = () => {
    Linking.openURL(`tel:${tel}`).catch(() => {
      Alert.alert('Ошибка', 'Не удалось открыть набор номера');
    });
  };

  const copy = async () => {
    await Clipboard.setStringAsync(phone.trim());
    Alert.alert('Скопировано', 'Номер скопирован в буфер обмена');
  };

  Alert.alert(phone, 'Выберите действие', [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Скопировать', onPress: () => { copy(); } },
    { text: 'Позвонить', onPress: call },
  ]);
}
