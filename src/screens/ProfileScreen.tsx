import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

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
      'Это действие необратимо. Ваши личные данные будут удалены. История выполненных доставок сохраняется без привязки к аккаунту для учёта.';

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

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Аккаунт курьера</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
      </View>

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
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
  },
  label: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  email: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  logoutButton: {
    backgroundColor: '#2c3e50', padding: 14, borderRadius: 8,
    alignItems: 'center', marginBottom: 12,
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  deleteBtn: {
    marginTop: 'auto',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#fff',
  },
  deleteBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
