import React from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, categoryColors } from '../theme';
import { LESSONS, CATEGORIES } from '../data/catalog';

export default function LearnScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.title}>Aprende a separar</Text>
        {LESSONS.map((l) => (
          <View key={l.category} style={styles.card}>
            <View style={[styles.icon, { backgroundColor: categoryColors[l.category] }]}>
              <Ionicons name={CATEGORIES[l.category].icon} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{l.title}</Text>
              <Text style={styles.body}>{l.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', color: colors.greenDark, marginBottom: 16 },
  card: { flexDirection: 'row', gap: 14, backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  body: { color: colors.muted, marginTop: 4, lineHeight: 20 },
});
