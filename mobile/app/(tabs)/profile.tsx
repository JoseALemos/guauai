import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { auth, clearToken } from '../../services/api';
import { colors } from '../../constants/theme';

interface User { id: string; email: string; name: string; created_at: string; }

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    auth.me().then(setUser).catch(() => {});
  }, []));

  async function logout() {
    Alert.alert('Cerrar sesión', '¿Cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => {
        await clearToken();
        router.replace('/(auth)/login');
      }},
    ]);
  }

  const initial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
        <Text style={s.name}>{user?.name || 'Usuario'}</Text>
        <Text style={s.email}>{user?.email}</Text>
        <Text style={s.since}>Miembro desde {user?.created_at ? new Date(user.created_at).toLocaleDateString('es', { month: 'long', year: 'numeric' }) : '—'}</Text>

        <View style={s.section}>
          <Text style={s.sectionTitle}>ACERCA DE GUAUAI</Text>
          {[
            ['🌐', 'Web', 'guauai.ainertia.io'],
            ['📂', 'Open Source', 'github.com/JoseALemos/guauai'],
            ['🏢', 'Hecho por', 'Ainertia Capital S.L.'],
            ['📍', 'Ubicación', 'Córdoba, España'],
            ['⚖️', 'Licencia', 'MIT (motor) + Propietario (app)'],
          ].map(([icon, label, value]) => (
            <View key={label} style={s.row}>
              <Text style={s.rowIcon}>{icon}</Text>
              <Text style={s.rowLabel}>{label}</Text>
              <Text style={s.rowValue}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>VERSIÓN</Text>
          <View style={s.row}>
            <Text style={s.rowIcon}>📱</Text>
            <Text style={s.rowLabel}>App</Text>
            <Text style={s.rowValue}>1.0.0</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowIcon}>🤖</Text>
            <Text style={s.rowLabel}>Modelo IA</Text>
            <Text style={s.rowValue}>gpt-audio</Text>
          </View>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  scroll:       { padding: 24, alignItems: 'center' },
  avatar:       { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText:   { fontSize: 36, fontWeight: '800', color: 'white' },
  name:         { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  email:        { fontSize: 14, color: colors.muted, marginBottom: 4 },
  since:        { fontSize: 13, color: colors.muted, marginBottom: 32 },
  section:      { width: '100%', backgroundColor: colors.bg2, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 11, color: colors.muted, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  row:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  rowIcon:      { fontSize: 16, width: 28 },
  rowLabel:     { color: colors.muted, fontSize: 13, flex: 1 },
  rowValue:     { color: colors.text, fontSize: 13, fontWeight: '600' },
  logoutBtn:    { width: '100%', backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.red, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  logoutText:   { color: colors.red, fontWeight: '700', fontSize: 15 },
});
