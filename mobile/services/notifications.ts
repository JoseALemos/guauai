import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alertas de comportamiento',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7c3aed',
      sound: 'default',
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}

export async function scheduleLocalAlert(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, data: { type: 'alert' } },
    trigger: null, // inmediata
  });
}

/** Lanza alerta local cuando el análisis devuelve una alerta crítica */
export async function notifyIfAlert(dogName: string, alert: { level: string; message: string } | null) {
  if (!alert) return;
  const icons: Record<string, string> = { high: '🚨', medium: '⚠️', low: '💛' };
  await scheduleLocalAlert(
    `${icons[alert.level] || '⚠️'} ${dogName} necesita atención`,
    alert.message
  );
}
