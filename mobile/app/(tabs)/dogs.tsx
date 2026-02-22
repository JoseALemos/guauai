import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { dogsApi } from '../../services/api';
import { colors } from '../../constants/theme';

interface Dog {
  id: string; name: string; breed: string; birth_date: string;
  weight_kg: number; notes: string; total_analyses: number; analyses_30d: number;
  emotion_more_common: string; last_analysis: string;
}

export default function DogsScreen() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Dog | null>(null);
  const [form, setForm] = useState({ name: '', breed: '', birth_date: '', weight_kg: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  async function load() {
    setLoading(true);
    try { setDogs(await dogsApi.list()); } catch {}
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', breed: '', birth_date: '', weight_kg: '', notes: '' });
    setModal(true);
  }
  function openEdit(d: Dog) {
    setEditing(d);
    setForm({ name: d.name, breed: d.breed||'', birth_date: d.birth_date?.slice(0,10)||'', weight_kg: String(d.weight_kg||''), notes: d.notes||'' });
    setModal(true);
  }

  async function save() {
    if (!form.name) return Alert.alert('Error', 'Nombre obligatorio');
    setSaving(true);
    try {
      const body = { ...form, weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null, birth_date: form.birth_date || null };
      if (editing) await dogsApi.update(editing.id, body);
      else await dogsApi.create(body);
      setModal(false); load();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSaving(false);
  }

  async function deleteDog(d: Dog) {
    Alert.alert('Eliminar', `¿Eliminar a ${d.name}? Se borrarán todos sus análisis.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await dogsApi.delete(d.id); load(); } },
    ]);
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.purple} size="large" /></View>;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>🐶 Mis Perros</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}><Text style={s.addBtnText}>+ Añadir</Text></TouchableOpacity>
      </View>

      {dogs.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🐾</Text>
          <Text style={s.emptyText}>Añade tu primer perro</Text>
          <TouchableOpacity style={s.addBtn} onPress={openAdd}><Text style={s.addBtnText}>+ Añadir perro</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={dogs}
          keyExtractor={d => d.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: d }) => (
            <TouchableOpacity style={s.card} onLongPress={() => openEdit(d)}>
              <View style={s.cardRow}>
                <View style={s.avatar}><Text style={s.avatarEmoji}>🐶</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.dogName}>{d.name}</Text>
                  <Text style={s.dogBreed}>{d.breed || 'Raza no especificada'}</Text>
                </View>
                <TouchableOpacity onPress={() => openEdit(d)}><Text style={{ color: colors.muted }}>✏️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => deleteDog(d)} style={{ marginLeft: 12 }}><Text style={{ color: colors.red }}>🗑</Text></TouchableOpacity>
              </View>
              <View style={s.statsRow}>
                <View style={s.stat}><Text style={s.statVal}>{d.analyses_30d||0}</Text><Text style={s.statLbl}>este mes</Text></View>
                <View style={s.stat}><Text style={s.statVal}>{d.total_analyses||0}</Text><Text style={s.statLbl}>total</Text></View>
                {d.emotion_more_common && <View style={s.stat}><Text style={s.statVal}>{d.emotion_more_common}</Text><Text style={s.statLbl}>emoción habitual</Text></View>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editing ? 'Editar perro' : 'Añadir perro'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            {(['name', 'breed', 'birth_date', 'weight_kg', 'notes'] as const).map(field => (
              <View key={field} style={s.field}>
                <Text style={s.label}>
                  {{ name:'NOMBRE *', breed:'RAZA', birth_date:'FECHA NACIMIENTO (AAAA-MM-DD)', weight_kg:'PESO (KG)', notes:'NOTAS' }[field]}
                </Text>
                <TextInput
                  style={s.input}
                  value={form[field]}
                  onChangeText={v => setForm(f => ({ ...f, [field]: v }))}
                  placeholder={{ name:'Rex', breed:'Labrador', birth_date:'2022-06-15', weight_kg:'12.5', notes:'Alergias...' }[field]}
                  placeholderTextColor={colors.muted}
                  keyboardType={field === 'weight_kg' ? 'decimal-pad' : 'default'}
                />
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="white" /> : <Text style={s.saveBtnText}>Guardar</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  title:        { fontSize: 22, fontWeight: '800', color: colors.text },
  addBtn:       { backgroundColor: colors.purple, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  addBtnText:   { color: 'white', fontWeight: '700', fontSize: 14 },
  empty:        { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyEmoji:   { fontSize: 60 },
  emptyText:    { color: colors.muted, fontSize: 16, marginBottom: 8 },
  card:         { backgroundColor: colors.bg2, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar:       { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.purple, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji:  { fontSize: 22 },
  dogName:      { fontSize: 17, fontWeight: '800', color: colors.text },
  dogBreed:     { fontSize: 13, color: colors.muted, marginTop: 2 },
  statsRow:     { flexDirection: 'row', gap: 16 },
  stat:         { alignItems: 'center' },
  statVal:      { fontSize: 16, fontWeight: '800', color: colors.text },
  statLbl:      { fontSize: 11, color: colors.muted },
  modalContainer: { flex: 1, backgroundColor: colors.bg2, padding: 24 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: colors.text },
  field:        { marginBottom: 16 },
  label:        { fontSize: 11, color: colors.muted, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  input:        { backgroundColor: colors.bg3, borderRadius: 12, padding: 14, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  saveBtn:      { backgroundColor: colors.purple, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText:  { color: 'white', fontWeight: '800', fontSize: 16 },
});
