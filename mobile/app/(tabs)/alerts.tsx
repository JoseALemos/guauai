import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { alertsApi } from '../../services/api';
import { colors, EMOTION_EMOJI } from '../../constants/theme';

interface Alert {
  id: string; estado_emocional: string; intensidad: string;
  mensaje_interpretado: string; recomendacion_dueno: string;
  created_at: string; dog_name: string;
}

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    alertsApi.list().then(setAlerts).catch(() => {}).finally(() => setLoading(false));
  }, []));

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.purple} size="large" /></View>;

  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.title}>🔔 Alertas</Text>
      <Text style={s.subtitle}>Comportamientos que requieren atención (últimas 24h)</Text>

      {alerts.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>✅</Text>
          <Text style={s.emptyTitle}>Todo en orden</Text>
          <Text style={s.emptyText}>No hay alertas en las últimas 24 horas</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={a => a.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: a }) => (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.alertIcon}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.dogName}>🐶 {a.dog_name}</Text>
                  <Text style={s.date}>{new Date(a.created_at).toLocaleString('es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{a.estado_emocional?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={s.mensaje}>{EMOTION_EMOJI[a.estado_emocional] || '🐶'} "{a.mensaje_interpretado}"</Text>
              {a.recomendacion_dueno ? (
                <View style={s.rec}>
                  <Text style={s.recLabel}>💡 Qué hacer</Text>
                  <Text style={s.recText}>{a.recomendacion_dueno}</Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title:        { fontSize: 22, fontWeight: '800', color: colors.text, padding: 20, paddingBottom: 4 },
  subtitle:     { color: colors.muted, fontSize: 13, paddingHorizontal: 20, marginBottom: 8 },
  empty:        { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyEmoji:   { fontSize: 64 },
  emptyTitle:   { fontSize: 20, fontWeight: '800', color: colors.text },
  emptyText:    { color: colors.muted, fontSize: 14 },
  card:         { backgroundColor: colors.bg2, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.red },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  alertIcon:    { fontSize: 24 },
  dogName:      { fontSize: 15, fontWeight: '700', color: colors.text },
  date:         { fontSize: 12, color: colors.muted, marginTop: 2 },
  badge:        { backgroundColor: '#3f1212', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText:    { color: '#fca5a5', fontSize: 11, fontWeight: '800' },
  mensaje:      { color: colors.text, fontSize: 14, fontStyle: 'italic', lineHeight: 20, marginBottom: 12 },
  rec:          { backgroundColor: colors.bg3, borderRadius: 10, padding: 12 },
  recLabel:     { color: colors.yellow, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  recText:      { color: colors.text, fontSize: 13, lineHeight: 18 },
});
