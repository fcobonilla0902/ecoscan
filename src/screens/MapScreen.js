import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { colors } from '../theme';
import { CATEGORIES } from '../data/catalog';
import { CENTERS, distanceKm } from '../data/centers';

export default function MapScreen() {
  const [pos, setPos] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | denied

  useEffect(() => {
    (async () => {
      try {
        const { status: s } = await Location.requestForegroundPermissionsAsync();
        if (s !== 'granted') return setStatus('denied');
        const loc = await Location.getCurrentPositionAsync({});
        setPos(loc.coords);
        setStatus('ok');
      } catch {
        setStatus('denied');
      }
    })();
  }, []);

  const data = useMemo(() => {
    const list = CENTERS.map((c) => ({ ...c, km: pos ? distanceKm(pos, c) : null }));
    return pos ? list.sort((a, b) => a.km - b.km) : list;
  }, [pos]);

  const open = (c) => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${c.latitude},${c.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`,
    });
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Centros de reciclaje</Text>
      {status === 'loading' && <ActivityIndicator color={colors.green} style={{ marginTop: 20 }} />}
      {status === 'denied' && (
        <Text style={styles.warn}>Activa la ubicación para ordenarlos por cercanía.</Text>
      )}
      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.head}>
              <Text style={styles.name}>{item.name}</Text>
              {item.km != null && <Text style={styles.km}>{item.km.toFixed(1)} km</Text>}
            </View>
            <Text style={styles.addr}>{item.address}</Text>
            <Text style={styles.addr}>🕒 {item.hours}</Text>
            <Text style={styles.accepts}>Acepta: {item.accepts.map((a) => CATEGORIES[a].label).join(', ')}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => open(item)}>
              <Text style={styles.btnText}>Cómo llegar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: '800', color: colors.greenDark, padding: 20, paddingBottom: 4 },
  warn: { color: colors.muted, paddingHorizontal: 20 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '700', fontSize: 16, color: colors.text, flex: 1 },
  km: { color: colors.greenDark, fontWeight: '700' },
  addr: { color: colors.muted, marginTop: 3 },
  accepts: { color: colors.text, marginTop: 8 },
  btn: { backgroundColor: colors.green, borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
});
