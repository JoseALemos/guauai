/**
 * GuauAI — Pantalla de análisis de audio
 * Graba el sonido del perro y obtiene interpretación en tiempo real
 */
import { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Animated, Easing,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyzeAudio, dogsApi } from '../../services/api';
import { colors, EMOTION_EMOJI, EMOTION_COLOR } from '../../constants/theme';
import { useFocusEffect } from 'expo-router';
import { notifyIfAlert, registerForPushNotifications } from '../../services/notifications';

interface Dog { id: string; name: string; breed: string; }
interface Analysis {
  estado_emocional: string; necesidad: string; intensidad: string;
  confianza: number; mensaje_interpretado: string; recomendacion_dueno: string;
  tipo_vocalizacion: string; notas_tecnicas: string;
}
interface Result { analysis: Analysis; alert?: { level: string; message: string } | null; }

export default function AnalyzeScreen() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(useCallback(() => {
    dogsApi.list().then(setDogs).catch(() => {});
    registerForPushNotifications().catch(() => {});
  }, []));

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }
  function stopPulse() { pulseAnim.stopAnimation(); pulseAnim.setValue(1); }

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return Alert.alert('Permiso requerido', 'GuauAI necesita acceso al micrófono');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setResult(null);
      setSeconds(0);
      startPulse();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    clearInterval(timerRef.current);
    setIsRecording(false);
    stopPulse();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) await analyze(uri);
    } catch (e: any) {
      Alert.alert('Error al detener', e.message);
    }
  }

  async function analyze(uri: string) {
    setLoading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const dog = selectedDog;
      const res = await analyzeAudio(
        base64, 'audio/m4a',
        dog?.name || 'Mi perro', dog?.breed || '',
        dog?.id, 'es'
      );
      setResult(res);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await notifyIfAlert(dog?.name || 'Tu perro', res.alert || null);
    } catch (e: any) {
      Alert.alert('Error al analizar', e.message);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const a = result?.analysis;
  const emotionColor = a ? (EMOTION_COLOR[a.estado_emocional] || colors.purple) : colors.purple;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Guau<Text style={s.titleAccent}>AI</Text></Text>
        <Text style={s.subtitle}>¿Qué dice tu perro?</Text>

        {/* Dog selector */}
        {dogs.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dogScroll}>
            <TouchableOpacity style={[s.dogChip, !selectedDog && s.dogChipActive]} onPress={() => setSelectedDog(null)}>
              <Text style={[s.dogChipText, !selectedDog && s.dogChipTextActive]}>Sin asociar</Text>
            </TouchableOpacity>
            {dogs.map(d => (
              <TouchableOpacity key={d.id} style={[s.dogChip, selectedDog?.id === d.id && s.dogChipActive]} onPress={() => setSelectedDog(d)}>
                <Text style={[s.dogChipText, selectedDog?.id === d.id && s.dogChipTextActive]}>🐶 {d.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Mic button */}
        <View style={s.micContainer}>
          <Animated.View style={[s.micOuter, isRecording && { borderColor: emotionColor }, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              style={[s.micBtn, isRecording && { backgroundColor: colors.red }]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="white" size="large" />
                : <Text style={s.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>}
            </TouchableOpacity>
          </Animated.View>
          <Text style={s.timer}>{isRecording ? fmt(seconds) : (loading ? 'Analizando…' : 'Pulsa para grabar')}</Text>
        </View>

        {/* Result */}
        {a && (
          <View style={[s.resultCard, { borderColor: emotionColor + '66' }]}>
            {/* Alert banner */}
            {result?.alert && (
              <View style={s.alertBanner}>
                <Text style={s.alertText}>⚠️ {result.alert.message}</Text>
              </View>
            )}
            <View style={s.resultHeader}>
              <Text style={s.resultEmoji}>{EMOTION_EMOJI[a.estado_emocional] || '🐶'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.emotionBadge, { color: emotionColor }]}>{a.estado_emocional?.toUpperCase()}</Text>
                <Text style={s.tipoVoz}>{a.tipo_vocalizacion} · {a.intensidad} · {Math.round((a.confianza||0)*100)}% confianza</Text>
              </View>
            </View>
            <Text style={s.mensaje}>"{a.mensaje_interpretado}"</Text>
            <View style={s.divider} />
            <View style={s.row}>
              <Text style={s.rowLabel}>Necesidad</Text>
              <Text style={s.rowValue}>{a.necesidad}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Recomendación</Text>
              <Text style={s.rowValue}>{a.recomendacion_dueno}</Text>
            </View>
            {a.notas_tecnicas ? (
              <Text style={s.notasTec}>🔬 {a.notas_tecnicas}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.bg },
  scroll:         { padding: 24, alignItems: 'center', paddingBottom: 40 },
  title:          { fontSize: 36, fontWeight: '900', color: colors.text, marginTop: 8 },
  titleAccent:    { color: colors.purple2 },
  subtitle:       { color: colors.muted, marginBottom: 20, fontSize: 15 },
  dogScroll:      { marginBottom: 24, maxHeight: 44 },
  dogChip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: colors.bg2 },
  dogChipActive:  { backgroundColor: colors.purple, borderColor: colors.purple },
  dogChipText:    { color: colors.muted, fontSize: 14, fontWeight: '600' },
  dogChipTextActive: { color: 'white' },
  micContainer:   { alignItems: 'center', marginBottom: 32 },
  micOuter:       { width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  micBtn:         { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center' },
  micIcon:        { fontSize: 40 },
  timer:          { color: colors.muted, fontSize: 16, fontWeight: '600' },
  resultCard:     { width: '100%', backgroundColor: colors.bg2, borderRadius: 20, padding: 20, borderWidth: 1 },
  alertBanner:    { backgroundColor: '#3f1212', borderRadius: 10, padding: 12, marginBottom: 16 },
  alertText:      { color: '#fca5a5', fontSize: 13, fontWeight: '600' },
  resultHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  resultEmoji:    { fontSize: 44 },
  emotionBadge:   { fontSize: 18, fontWeight: '900' },
  tipoVoz:        { color: colors.muted, fontSize: 12, marginTop: 4 },
  mensaje:        { color: colors.text, fontSize: 16, fontStyle: 'italic', marginBottom: 16, lineHeight: 24 },
  divider:        { height: 1, backgroundColor: colors.border, marginBottom: 16 },
  row:            { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rowLabel:       { color: colors.muted, fontSize: 13, flex: 1 },
  rowValue:       { color: colors.text, fontSize: 13, fontWeight: '600', flex: 2, textAlign: 'right' },
  notasTec:       { color: colors.muted, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
});
