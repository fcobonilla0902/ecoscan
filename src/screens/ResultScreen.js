import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, categoryColors } from '../theme';
import { CATEGORIES } from '../data/catalog';
import { useApp } from '../store';

export default function ResultScreen({ route, navigation }) {
  const { item } = route.params;
  const { recycle } = useApp();
  const [done, setDone] = useState(false);
  const cat = CATEGORIES[item.category];
  const color = categoryColors[item.category];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: color }]}>
          <Ionicons name={cat.icon} size={36} color="#fff" />
        </View>
        <Text style={styles.name}>{item.name}</Text>
        {item.ai && (
          <Text style={styles.aiNote}>
            ✨ Identificado con IA · {Math.round((item.confidence || 0) * 100)}% de seguridad
          </Text>
        )}

        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: color }]}>
            <Text style={styles.tagText}>{cat.label}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: item.recyclable ? colors.green : '#C0392B' }]}>
            <Text style={styles.tagText}>{item.recyclable ? '♻️ Reciclable' : 'No reciclable'}</Text>
          </View>
        </View>

        <Text style={styles.section}>Cómo desecharlo</Text>
        <Text style={styles.body}>{item.instructions}</Text>

        <Text style={styles.section}>Dónde va</Text>
        <Text style={styles.body}>{cat.bin}</Text>

        <View style={styles.tip}>
          <Text style={styles.tipText}>💡 {item.tip}</Text>
        </View>
      </View>

      {item.recyclable &&
        (done ? (
          <View style={styles.doneBox}>
            <Text style={styles.doneText}>🎉 ¡+10 puntos! Gracias por reciclar.</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.primary}
            onPress={() => {
              recycle(item);
              setDone(true);
            }}
          >
            <Text style={styles.primaryText}>Ya lo reciclé (+10 pts)</Text>
          </TouchableOpacity>
        ))}

      <TouchableOpacity style={styles.arBtn} onPress={() => navigation.navigate('AR', { item })}>
        <Text style={styles.arBtnText}>🕶️ Ver en realidad aumentada</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={() => navigation.replace('Escanear')}>
        <Text style={styles.secondaryText}>Escanear otro</Text>
      </TouchableOpacity>
      {item.ai && (
        <TouchableOpacity style={styles.secondary} onPress={() => navigation.replace('Elegir')}>
          <Text style={styles.secondaryText}>No es correcto — elegir manualmente</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.secondary} onPress={() => navigation.navigate('Tabs', { screen: 'Mapa' })}>
        <Text style={styles.secondaryText}>Ver centros cercanos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  tags: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12, marginBottom: 8, flexWrap: 'wrap' },
  tag: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  section: { fontWeight: '700', fontSize: 15, color: colors.greenDark, marginTop: 14 },
  body: { color: colors.text, lineHeight: 22, marginTop: 4 },
  tip: { backgroundColor: colors.mint, borderRadius: 12, padding: 12, marginTop: 16 },
  tipText: { color: colors.text, lineHeight: 20 },
  primary: { backgroundColor: colors.green, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  doneBox: { backgroundColor: colors.mint, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  doneText: { color: colors.greenDark, fontWeight: '700' },
  aiNote: { textAlign: 'center', color: colors.greenDark, fontWeight: '600', marginTop: 6, fontSize: 13 },
  arBtn: { backgroundColor: colors.greenDark, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  arBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondary: { borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.green, marginBottom: 10 },
  secondaryText: { color: colors.greenDark, fontWeight: '600' },
});
