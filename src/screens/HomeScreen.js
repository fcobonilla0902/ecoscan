import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, categoryColors } from '../theme';
import { useApp, CHALLENGES } from '../store';

const TIPS = [
  'Enjuaga tus envases antes de reciclarlos: un envase sucio puede contaminar todo el lote.',
  'Aplasta botellas y latas para que ocupen menos espacio.',
  'El papel mojado o con grasa no se recicla.',
  'Las tapas de plástico se reciclan aparte de las botellas de vidrio.',
];

export default function HomeScreen({ navigation }) {
  const { points, history } = useApp();
  const next = CHALLENGES.find((c) => c.metric(history) < c.goal) || CHALLENGES[CHALLENGES.length - 1];
  const progress = Math.min(next.metric(history), next.goal);
  const tip = TIPS[new Date().getDate() % TIPS.length];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hello}>Hola 👋</Text>
        <Text style={styles.title}>EcoScan</Text>
        <Text style={styles.sub}>Escanea y recicla correctamente.</Text>

        <TouchableOpacity style={styles.hero} onPress={() => navigation.navigate('AR')} activeOpacity={0.92}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>NUEVO · REALIDAD AUMENTADA</Text>
          </View>
          <Text style={styles.heroTitle}>Recicla jugando en AR</Text>
          <Text style={styles.heroSub}>
            Abre la cámara y encuentra contenedores virtuales flotando a tu alrededor. Apunta al correcto y gana puntos.
          </Text>
          <View style={styles.binsRow}>
            {[['plastico', 'water-outline'], ['papel', 'document-text-outline'], ['vidrio', 'wine-outline'], ['metal', 'hardware-chip-outline']].map(([k, ic], i) => (
              <View key={k} style={[styles.miniBin, { backgroundColor: categoryColors[k], marginTop: i % 2 ? 10 : 0 }]}>
                <Ionicons name={ic} size={22} color="#fff" />
              </View>
            ))}
          </View>
          <View style={styles.heroBtn}>
            <Ionicons name="cube" size={20} color={colors.greenDark} />
            <Text style={styles.heroBtnText}>Probar ahora</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scan} onPress={() => navigation.navigate('Escanear')} activeOpacity={0.9}>
          <Ionicons name="scan" size={26} color={colors.greenDark} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={styles.scanTitle}>Escanear con IA</Text>
            <Text style={styles.scanSub}>Toma una foto y la IA identifica el residuo</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.greenDark} />
        </TouchableOpacity>

        <View style={styles.row}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{points}</Text>
            <Text style={styles.statLabel}>Puntos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{history.length}</Text>
            <Text style={styles.statLabel}>Reciclados</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reto actual: {next.title}</Text>
          <Text style={styles.cardText}>{next.desc} · +{next.reward} pts</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${(progress / next.goal) * 100}%` }]} />
          </View>
          <Text style={styles.small}>{progress} / {next.goal}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.mint }]}>
          <Text style={styles.cardTitle}>💡 Consejo del día</Text>
          <Text style={styles.cardText}>{tip}</Text>
        </View>

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Mapa')}>
          <Ionicons name="location" size={18} color={colors.greenDark} />
          <Text style={styles.linkText}>Ver centros de reciclaje cercanos</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  hello: { color: colors.muted, fontSize: 16 },
  title: { fontSize: 32, fontWeight: '800', color: colors.greenDark },
  sub: { color: colors.muted, marginBottom: 20, marginTop: 2 },
  cta: { backgroundColor: colors.green, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  ctaTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  ctaSub: { color: '#E6F7EC', marginTop: 2 },
  arCta: { backgroundColor: colors.mint, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: colors.green },
  arTitle: { color: colors.greenDark, fontSize: 17, fontWeight: '800' },
  arSub: { color: colors.text, marginTop: 2, fontSize: 13 },
  hero: { backgroundColor: colors.greenDark, borderRadius: 24, padding: 20, marginBottom: 14, overflow: 'hidden' },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: '#3CE06E', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  heroBadgeText: { color: '#0B3D1C', fontWeight: '800', fontSize: 10, letterSpacing: 0.8 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
  heroSub: { color: '#D5F3E0', marginTop: 6, lineHeight: 20 },
  binsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 6, paddingHorizontal: 6 },
  miniBin: { width: 58, height: 66, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  heroBtn: { marginTop: 14, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroBtnText: { color: colors.greenDark, fontWeight: '800', fontSize: 16 },
  scan: { backgroundColor: colors.white, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  scanTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  scanSub: { color: colors.muted, marginTop: 2, fontSize: 13 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statNum: { fontSize: 28, fontWeight: '800', color: colors.greenDark },
  statLabel: { color: colors.muted },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontWeight: '700', fontSize: 16, color: colors.text, marginBottom: 4 },
  cardText: { color: colors.text, lineHeight: 20 },
  barBg: { height: 10, backgroundColor: colors.border, borderRadius: 5, marginTop: 12, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: colors.green },
  small: { color: colors.muted, marginTop: 6, fontSize: 12 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', padding: 8 },
  linkText: { color: colors.greenDark, fontWeight: '600' },
});
