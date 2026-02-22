import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, setToken } from '../../services/api';
import { colors } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return Alert.alert('Error', 'Email y contraseña obligatorios');
    setLoading(true);
    try {
      const res = tab === 'login'
        ? await auth.login(email, password)
        : await auth.register(email, password, name);
      await setToken(res.token);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>🐾 Guau<Text style={s.logoAccent}>AI</Text></Text>
        <Text style={s.tagline}>Habla con tu perro</Text>

        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, tab === 'login' && s.tabActive]} onPress={() => setTab('login')}>
            <Text style={[s.tabText, tab === 'login' && s.tabTextActive]}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === 'register' && s.tabActive]} onPress={() => setTab('register')}>
            <Text style={[s.tabText, tab === 'register' && s.tabTextActive]}>Registrarse</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          {tab === 'register' && (
            <View style={s.field}>
              <Text style={s.label}>NOMBRE</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Tu nombre" placeholderTextColor={colors.muted} />
            </View>
          )}
          <View style={s.field}>
            <Text style={s.label}>EMAIL</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={s.field}>
            <Text style={s.label}>CONTRASEÑA</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={colors.muted} secureTextEntry />
          </View>

          <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={s.btnText}>{tab === 'login' ? 'Entrar →' : 'Crear cuenta →'}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  inner:        { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo:         { fontSize: 42, fontWeight: '900', textAlign: 'center', color: colors.text, marginBottom: 8 },
  logoAccent:   { color: colors.purple2 },
  tagline:      { color: colors.muted, textAlign: 'center', fontSize: 15, marginBottom: 32 },
  tabs:         { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tab:          { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  tabActive:    { backgroundColor: colors.purple, borderColor: colors.purple },
  tabText:      { color: colors.muted, fontWeight: '600' },
  tabTextActive:{ color: 'white' },
  card:         { backgroundColor: colors.bg2, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  field:        { marginBottom: 16 },
  label:        { fontSize: 11, color: colors.muted, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  input:        { backgroundColor: colors.bg3, borderRadius: 12, padding: 14, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  btn:          { backgroundColor: colors.purple, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText:      { color: 'white', fontWeight: '800', fontSize: 16 },
});
