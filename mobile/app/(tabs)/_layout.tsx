import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { getToken } from '../../services/api';
import { colors } from '../../constants/theme';

export default function TabsLayout() {
  const router = useRouter();

  useEffect(() => {
    getToken().then(t => { if (!t) router.replace('/(auth)/login'); });
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: colors.purple2,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Analizar', tabBarIcon: ({ color }) => <TabIcon emoji="🎤" color={color} /> }} />
      <Tabs.Screen name="dogs"    options={{ title: 'Perros',   tabBarIcon: ({ color }) => <TabIcon emoji="🐶" color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: 'Historial',tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} /> }} />
      <Tabs.Screen name="alerts"  options={{ title: 'Alertas',  tabBarIcon: ({ color }) => <TabIcon emoji="🔔" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil',   tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }} />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === colors.purple2 ? 1 : 0.5 }}>{emoji}</Text>;
}
