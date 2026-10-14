import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, categoryColors } from '../theme';
import { CATALOG, CATEGORIES } from '../data/catalog';

export default function PickMaterialScreen({ navigation }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);

  const data = useMemo(
    () =>
      CATALOG.filter(
        (i) => (!cat || i.category === cat) && i.name.toLowerCase().includes(q.trim().toLowerCase())
      ),
    [q, cat]
  );

  return (
    <View style={styles.flex}>
      <TextInput
        style={styles.input}
        placeholder="Buscar: botella, lata, cartón…"
        value={q}
        onChangeText={setQ}
        placeholderTextColor={colors.muted}
      />
      <View style={styles.chips}>
        {Object.entries(CATEGORIES).map(([key, c]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setCat(cat === key ? null : key)}
            style={[styles.chip, cat === key && { backgroundColor: categoryColors[key] }]}
          >
            <Text style={[styles.chipText, cat === key && { color: '#fff' }]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Sin resultados.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => navigation.replace('Resultado', { item })}>
            <View style={[styles.dot, { backgroundColor: categoryColors[item.category] }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.cat}>{CATEGORIES[item.category].label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  input: { margin: 16, marginBottom: 8, backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  chip: { backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.border },
  chipText: { color: colors.text, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  name: { fontWeight: '600', color: colors.text, fontSize: 16 },
  cat: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 30 },
});
