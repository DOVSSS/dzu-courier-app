import { Linking, Platform } from 'react-native';

export const openInMaps = (lat: number, lng: number, label?: string) => {
  const encodedLabel = encodeURIComponent(label ?? 'Адрес доставки');
  const url = Platform.select({
    ios: `maps:0,0?q=${encodedLabel}@${lat},${lng}`,
    android: `geo:0,0?q=${lat},${lng}(${encodedLabel})`,
  });
  const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  Linking.canOpenURL(url!).then((supported) => {
    Linking.openURL(supported ? url! : fallbackUrl);
  }).catch(() => {
    Linking.openURL(fallbackUrl);
  });
};
