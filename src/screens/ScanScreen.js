import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { identifyPhoto } from '../config';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const cam = useRef(null);
  const focused = useIsFocused();

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>EcoScan necesita la cámara para identificar tus residuos.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Permitir cámara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.replace('Elegir')}>
          <Text style={styles.linkText}>Elegir material manualmente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const capture = async () => {
    if (busy || !cam.current) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await cam.current.takePictureAsync({ quality: 0.7 });
      setPreview(photo.uri);
      // Reducimos la foto: la IA no necesita 12 megapíxeles y así sube más rápido.
      const small = await manipulateAsync(photo.uri, [{ resize: { width: 900 } }], {
        compress: 0.7,
        format: SaveFormat.JPEG,
        base64: true,
      });
      const result = await identifyPhoto(small.base64, 'image/jpeg');
      if (!result.found) {
        setError(result.message);
        setPreview(null);
      } else {
        const item = {
          id: `ia-${Date.now()}`,
          name: result.name,
          category: result.category,
          recyclable: result.recyclable,
          instructions: result.instructions,
          tip: result.tip,
          ai: true,
          confidence: result.confidence,
        };
        navigation.replace('Resultado', { item });
        return;
      }
    } catch (e) {
      setError(e.message || 'Ocurrió un error al identificar el residuo.');
      setPreview(null);
    }
    setBusy(false);
  };

  return (
    <View style={styles.flex}>
      {focused && <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" />}

      {busy && preview && (
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.previewDim} />
        </View>
      )}

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Text style={styles.hint}>
          {busy ? 'Analizando con IA…' : 'Encuadra el residuo y toma la foto'}
        </Text>
        {busy && <ActivityIndicator color="#fff" size="large" style={{ marginTop: 14 }} />}
      </View>

      <View style={styles.bottom}>
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={[styles.shutter, busy && { opacity: 0.4 }]} onPress={capture} disabled={busy} activeOpacity={0.8}>
          <Ionicons name="sparkles" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.shutterLabel}>Identificar con IA</Text>
        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.replace('Elegir')}>
          <Text style={[styles.linkText, { color: '#fff' }]}>Elegir material manualmente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const C = 34;
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  msg: { textAlign: 'center', color: colors.text, marginBottom: 16, fontSize: 16 },
  previewDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingBottom: 120 },
  frame: { width: 270, height: 270 },
  corner: { position: 'absolute', width: C, height: C, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  hint: { color: '#fff', marginTop: 24, fontWeight: '700', fontSize: 16, textShadowColor: '#000', textShadowRadius: 4 },
  bottom: { position: 'absolute', bottom: 36, left: 20, right: 20, alignItems: 'center' },
  error: { color: '#fff', backgroundColor: 'rgba(192,57,43,0.9)', padding: 10, borderRadius: 10, marginBottom: 14, textAlign: 'center', overflow: 'hidden' },
  shutter: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.green, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterLabel: { color: '#fff', fontWeight: '700', marginTop: 8 },
  btn: { backgroundColor: colors.green, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { marginTop: 14 },
  linkText: { color: colors.greenDark, fontWeight: '600' },
});
