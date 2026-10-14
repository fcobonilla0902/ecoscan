import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useApp, CHALLENGES } from '../store';
import { CATEGORIES } from '../data/catalog';

export default function ProfileScreen() {
  const { points, history, claimed, claim, reset } = useApp();
  const level = Math.floor(points / 100) + 1;
  const toNext = 100 - (points % 100);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.title}>Mi perfil</Text>

        <View style={styles.hero}>
          <Text style={styles.points}>{points}</Text>
          <Text style={styles.heroLabel}>puntos · Nivel {level}</Text>
          <Text style={styles.heroSmall}>Te faltan {toNext} pts para el siguiente nivel</Text>
        </View>

        <Text style={styles.section}>Retos</Text>
        {CHALLENGES.map((c) => {
          const value = Math.min(c.metric(history), c.goal);
          const complete = value >= c.goal;
          const isClaimed = claimed.includes(c.id);
          return (
            <View key={c.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{c.title}</Text>
                <Text style={styles.reward}>+{c.reward}</Text>
              </View>
              <Text style={styles.desc}>{c.desc}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${(value / c.goal) * 100}%` }]} />
              </View>
              <Text style={styles.small}>{value} / {c.goal}</Text>
              {complete && !isClaimed && (
                <TouchableOpacity style={styles.claim} onPress={() => claim(c)}>
                  <Text style={styles.claimText}>Reclamar puntos</Text>
                </TouchableOpacity>
              )}
              {isClaimed && <Text style={styles.done}>✓ Reclamado</Text>}
            </View>
          );
        })}

        <Text style={styles.section}>Historial</Text>
        {history.length === 0 && <Text style={styles.desc}>Aún no has reciclado nada. ¡Escanea tu primer residuo!</Text>}
        {history.slice(0, 15).map((h, i) => (
          <View key={i} style={styles.hist}>
            <Text style={styles.histName}>{h.name}</Text>
            <Text style={styles.small}>
              {CATEGORIES[h.category].label} · {new Date(h.at).toLocaleDateString()}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          onPress={() =>
            Alert.alert('Reiniciar progreso', '¿Borrar puntos e historial?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Borrar', style: 'destructive', onPress: reset },
            ])
          }
        >
          <Text style={styles.reset}>Reiniciar progreso</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', color: colors.greenDark, marginBottom: 16 },
  hero: { backgroundColor: colors.green, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  points: { color: '#fff', fontSize: 52, fontWeight: '800' },
  heroLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  heroSmall: { color: '#E6F7EC', marginTop: 6 },
  section: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 6 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontWeight: '700', color: colors.text, fontSize: 16 },
  reward: { color: colors.greenDark, fontWeight: '800' },
  desc: { color: colors.muted, marginTop: 2 },
  barBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: colors.green },
  small: { color: colors.muted, fontSize: 12, marginTop: 4 },
  claim: { backgroundColor: colors.green, borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 10 },
  claimText: { color: '#fff', fontWeight: '700' },
  done: { color: colors.greenDark, marginTop: 8, fontWeight: '600' },
  hist: { backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  histName: { color: colors.text, fontWeight: '600' },
  reset: { color: '#C0392B', textAlign: 'center', marginTop: 24 },
});
