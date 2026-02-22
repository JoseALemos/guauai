import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { dogsApi } from '../../services/api';
import { colors, EMOTION_EMOJI, EMOTION_COLOR } from '../../constants/theme';

interface Analysis {
  id: string; estado_emocional: string; necesidad: string; intensidad: string;
  confianza: number; mensaje_interpretado: string; recomendacion_dueno: string;
  tipo_vocalizacion: string; created_at: string; _dogName?: string;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const dogs = await dogsApi.list();
      const all = await Promise.all(
        dogs.map((d: any) => dogsApi.history(d.id, 50).then((rows: any[]) =>
          rows.map(r => ({ ...r, _dogName: d.name }))
        ))
      );
      const flat = all.flat().sort((a: Analysis, b: Analysis) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setHistory(flat);
    } catch {}
    setLoading(false);
  }

  async function shareAnalysis(a: Analysis) {
    await Share.share({
      message: `🐾 GuauAI — ${a._dogName || 'Mi perro'}\n\n${EMOTION_EMOJI[a.estado_emocional] || '🐶'} ${a.estado_emocional?.toUpperCase()}\n\n"${a.mensaje_interpretado}"\n\n💡 ${a.recomendacion_dueno}\n\n— Analizado con GuauAI`,
      url: `https://dogspeak-production.up.railway.app/share/${a.id}`,
    });
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.purple} size="large" /></View>;

  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.title}>📋 Historial</Text>
      {history.length === 0 ? (
        <View style={s.empty}><Text style={s.emptyEmoji}>🎤</Text><Text style={s.emptyText}>Graba tu primer análisis</Text></View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={a => a.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: a }) => {
            const isOpen = expanded === a.id;
            const ec = EMOTION_COLOR[a.estado_emocional] || colors.purple;
            const date = new Date(a.created_at).toLocaleString('es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return (
              <TouchableOpacity style={[s.card, { borderLeftColor: ec }]} onPress={() => setExpanded(isOpen ? null : a.id)}>
                <View style={s.cardRow}>
                  <Text style={s.emoji}>{EMOTION_EMOJI[a.estado_emocional] || '🐶'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.emotion, { color: ec }]}>{a.estado_emocional?.toUpperCase()}</Text>
                    {a._dogName && <Text style={s.dogName}>🐶 {a._dogName}</Text>}
                    <Text style={s.date}>{date}</Text>
                  </View>
                  <Text style={s.conf}>{Math.round((a.confianza||0)*100)}%</Text>
                </View>
                <Text style={s.mensaje} numberOfLines={isOpen ? undefined : 2}>"{a.mensaje_interpretado}"</Text>
                {isOpen && (
                  <View style={{ marginTop: 12 }}>
                    <View style={s.row}><Text style={s.rl}>Necesidad</Text><Text style={s.rv}>{a.necesidad}</Text></View>
                    <View style={s.row}><Text style={s.rl}>Intensidad</Text><Text style={s.rv}>{a.intensidad}</Text></View>
                    <View style={s.row}><Text style={s.rl}>Tipo</Text><Text style={s.rv}>{a.tipo_vocalizacion}</Text></View>
                    <View style={s.row}><Text style={s.rl}>Recomendación</Text><Text style={[s.rv, { flex: 2 }]}>{a.recomendacion_dueno}</Text></View>
                    <TouchableOpacity style={s.shareBtn} onPress={() => shareAnalysis(a)}>
                      <Text style={s.shareBtnText}>🔗 Compartir análisis</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.bg },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title:      { fontSize: 22, fontWeight: '800', color: colors.text, padding: 20, paddingBottom: 8 },
  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 60 },
  emptyText:  { color: colors.muted, fontSize: 16, marginTop: 12 },
  card:       { backgroundColor: colors.bg2, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4 },
  cardRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  emoji:      { fontSize: 28 },
  emotion:    { fontSize: 14, fontWeight: '800' },
  dogName:    { fontSize: 12, color: colors.muted, marginTop: 2 },
  date:       { fontSize: 11, color: colors.muted, marginTop: 2 },
  conf:       { fontSize: 16, fontWeight: '800', color: colors.green },
  mensaje:    { color: colors.text, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderColor: colors.border },
  rl:         { color: colors.muted, fontSize: 12, flex: 1 },
  rv:         { color: colors.text, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  shareBtn:   { marginTop: 12, backgroundColor: colors.bg3, borderRadius: 10, padding: 12, alignItems: 'center' },
  shareBtnText: { color: colors.purple2, fontWeight: '700', fontSize: 14 },
});
