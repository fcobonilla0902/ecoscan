import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DeviceMotion } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, categoryColors } from '../theme';
import { CATALOG, CATEGORIES } from '../data/catalog';
import { useApp } from '../store';

// Realidad aumentada: cámara en vivo + sensores de movimiento.
// Seis contenedores 3D quedan anclados en el espacio frente a ti.
// Gira el teléfono para encontrarlos y apunta la mira al correcto.
const KEYS = Object.keys(CATEGORIES);
const ANGLES = [-100, -60, -20, 20, 60, 100];
const BIN_PITCH = -8;
const FOV = 62;
const AIM_DEG = 9;
const DWELL_MS = 1200;
const BIN_W = 92;
const BIN_H = 118;
const LID_H = 16;
const INTRO_KEY = 'ecoscan:arIntroSeen';

const EMOJI = {
  'botella-vidrio': '🍾',
  'frasco-vidrio': '🫙',
  'vidrio-roto-cocina': '💡',
  'botella-pet': '🧴',
  'bolsa-plastica': '🛍️',
  unicel: '🍱',
  'caja-carton': '📦',
  'papel-oficina': '📰',
  tetrapak: '🧃',
  'lata-aluminio': '🥤',
  'lata-conserva': '🥫',
  'restos-comida': '🍌',
  pilas: '🔋',
  electronicos: '📱',
};
const CONFETTI = ['🎉', '♻️', '🌱', '✨', '💚'];

const wrap = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
const toDeg = (r) => (r * 180) / Math.PI;
const randomItem = (excludeId) => {
  const pool = CATALOG.filter((i) => i.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
};
const darken = (hex, f = 0.78) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
};

export default function ARScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const { recycle } = useApp();

  const [item, setItem] = useState(route.params?.item || randomItem());
  const [pose, setPose] = useState({ yaw: 0, pitch: 0 });
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hint, setHint] = useState(false);
  const [motionOk, setMotionOk] = useState(true);
  const [intro, setIntro] = useState(false);

  const sensorOn = useRef(false);
  const ppdRef = useRef(1);
  const manual = useRef({ yaw: 0, pitch: 0, lastDx: 0, lastDy: 0 });
  const smooth = useRef(null);
  const origin = useRef(null);
  const aim = useRef({ idx: -1, since: 0 });
  const lockUntil = useRef(0);
  const timer = useRef(null);

  // Animaciones
  const bob = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const confetti = useRef(
    Array.from({ length: 16 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      o: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  // Introducción la primera vez
  useEffect(() => {
    AsyncStorage.getItem(INTRO_KEY)
      .then((v) => !v && setIntro(true))
      .catch(() => setIntro(true));
  }, []);
  const closeIntro = () => {
    setIntro(false);
    AsyncStorage.setItem(INTRO_KEY, '1').catch(() => {});
    recenter();
  };

  // Sensor de movimiento -> hacia dónde apunta la cámara
  useEffect(() => {
    let sub;
    let cancelled = false;
    (async () => {
      try {
        // DeviceMotion no necesita permiso en iOS/Android; solo comprobamos disponibilidad.
        if (!(await DeviceMotion.isAvailableAsync())) return setMotionOk(false);
        if (cancelled) return;
        DeviceMotion.setUpdateInterval(33);
        sub = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation) return;
          sensorOn.current = true;
          setMotionOk(true);
          const { alpha: a, beta: b, gamma: g } = rotation;
          const fx = Math.cos(a) * -Math.sin(g) - Math.sin(a) * (Math.sin(b) * Math.cos(g));
          const fy = Math.sin(a) * -Math.sin(g) + Math.cos(a) * (Math.sin(b) * Math.cos(g));
          const fz = -Math.cos(b) * Math.cos(g);
          const yawNow = toDeg(Math.atan2(fx, fy));
          const pitchNow = toDeg(Math.asin(Math.max(-1, Math.min(1, fz))));

          if (!smooth.current) smooth.current = { yaw: yawNow, pitch: pitchNow };
          else {
            smooth.current.yaw += wrap(yawNow - smooth.current.yaw) * 0.35;
            smooth.current.pitch += (pitchNow - smooth.current.pitch) * 0.35;
          }
          if (origin.current == null) origin.current = smooth.current.yaw;
          setPose({ yaw: wrap(smooth.current.yaw - origin.current), pitch: smooth.current.pitch });
        });
      } catch {
        setMotionOk(false);
      }
    })();
    // Si en 2 s no llega ningún dato, pasamos al modo "arrastrar para mirar".
    const watchdog = setTimeout(() => {
      if (!sensorOn.current) setMotionOk(false);
    }, 2000);
    return () => {
      clearTimeout(watchdog);
      cancelled = true;
      if (sub) sub.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const burst = () => {
    Animated.parallel(
      confetti.map((c, i) => {
        const ang = (i / confetti.length) * Math.PI * 2;
        const dist = 90 + Math.random() * 90;
        c.x.setValue(0);
        c.y.setValue(0);
        c.o.setValue(1);
        return Animated.parallel([
          Animated.timing(c.x, { toValue: Math.cos(ang) * dist, duration: 950, useNativeDriver: true }),
          Animated.timing(c.y, { toValue: Math.sin(ang) * dist + 50, duration: 950, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(c.o, { toValue: 0, duration: 950, useNativeDriver: true }),
        ]);
      })
    ).start();
  };

  const doShake = () =>
    Animated.sequence(
      [-10, 10, -8, 8, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 55, useNativeDriver: true }))
    ).start();

  const resolve = (idx) => {
    lockUntil.current = Date.now() + 1900;
    aim.current = { idx: -1, since: 0 };
    setProgress(0);
    const ok = KEYS[idx] === item.category;
    if (ok) {
      recycle(item);
      setScore((s) => s + 10);
      setStreak((s) => s + 1);
      setFeedback({ ok: true, idx, text: '¡Correcto! +10 puntos' });
      burst();
    } else {
      setStreak(0);
      setFeedback({ ok: false, idx, text: `Ese no es. Va en: ${CATEGORIES[item.category].bin}` });
      doShake();
    }
    timer.current = setTimeout(() => {
      setFeedback(null);
      setHint(false);
      setItem((prev) => randomItem(prev.id));
    }, 1900);
  };

  // Apuntar un contenedor ~1 s lo confirma
  useEffect(() => {
    if (intro) return;
    const now = Date.now();
    if (now < lockUntil.current) return;
    let best = -1;
    let bestD = Infinity;
    ANGLES.forEach((a, i) => {
      const d = Math.hypot(wrap(a - pose.yaw), BIN_PITCH - pose.pitch);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (bestD > AIM_DEG) {
      aim.current = { idx: -1, since: 0 };
      setProgress(0);
      return;
    }
    if (aim.current.idx !== best) {
      aim.current = { idx: best, since: now };
      setProgress(0);
      return;
    }
    const p = Math.min(1, (now - aim.current.since) / DWELL_MS);
    setProgress(p);
    if (p >= 1) resolve(best);
  }, [pose, intro]);

  const recenter = () => {
    if (sensorOn.current && smooth.current) origin.current = smooth.current.yaw;
    else {
      manual.current.yaw = 0;
      manual.current.pitch = 0;
      setPose({ yaw: 0, pitch: 0 });
    }
  };

  // Respaldo: arrastrar el dedo para mirar alrededor si no hay sensor.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !sensorOn.current,
      onMoveShouldSetPanResponder: () => !sensorOn.current,
      onPanResponderGrant: () => {
        manual.current.lastDx = 0;
        manual.current.lastDy = 0;
      },
      onPanResponderMove: (_, g) => {
        const m = manual.current;
        const ddx = g.dx - m.lastDx;
        const ddy = g.dy - m.lastDy;
        m.lastDx = g.dx;
        m.lastDy = g.dy;
        m.yaw = wrap(m.yaw - ddx / ppdRef.current);
        m.pitch = Math.max(-60, Math.min(60, m.pitch + ddy / ppdRef.current));
        setPose({ yaw: m.yaw, pitch: m.pitch });
      },
    })
  ).current;

  if (!camPerm) return <View style={styles.center} />;
  if (!camPerm.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🕶️</Text>
        <Text style={styles.msg}>La realidad aumentada necesita la cámara para mostrar los contenedores a tu alrededor.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestCamPerm}>
          <Text style={styles.btnText}>Permitir cámara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ppd = width / FOV;
  ppdRef.current = ppd;
  const cx = width / 2;
  const cy = height * 0.5;
  const targetIdx = KEYS.indexOf(item.category);
  const dT = wrap(ANGLES[targetIdx] - pose.yaw);
  const targetVisible = Math.abs(dT) < FOV / 2;
  const bobUp = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
  const bobDown = bob.interpolate({ inputRange: [0, 1], outputRange: [-9, 0] });
  const bubbleBob = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const emoji = EMOJI[item.id] || '♻️';

  return (
    <View style={styles.flex}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />
      <View style={styles.tint} pointerEvents="none" />
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers} />

      {/* Línea de horizonte */}
      <View style={[styles.horizon, { top: cy + 8 * ppd - (pose.pitch + 0) * ppd + BIN_H / 2 }]} pointerEvents="none" />

      {/* Contenedores 3D anclados en el espacio */}
      {ANGLES.map((a, i) => {
        const dyaw = wrap(a - pose.yaw);
        if (Math.abs(dyaw) > FOV / 2 + 15) return null;
        const dpitch = BIN_PITCH - pose.pitch;
        const key = KEYS[i];
        const base = categoryColors[key];
        const aimed = aim.current.idx === i && progress > 0;
        const flash = feedback && feedback.idx === i ? (feedback.ok ? '#3CE06E' : '#FF5A4D') : null;
        const depth = 1 - Math.min(Math.abs(dyaw) / FOV, 1) * 0.28; // perspectiva falsa
        return (
          <View
            key={key}
            pointerEvents="none"
            style={[
              styles.binWrap,
              {
                left: cx + dyaw * ppd - BIN_W / 2,
                top: cy - dpitch * ppd - BIN_H / 2,
                transform: [{ scale: (aimed ? 1.14 : 1) * depth }],
                opacity: 0.5 + depth * 0.5,
              },
            ]}
          >
            <Animated.View style={{ transform: [{ translateY: i % 2 ? bobDown : bobUp }] }}>
              <View style={[styles.lid, { backgroundColor: darken(base, 0.72) }]}>
                <View style={styles.handle} />
              </View>
              <View
                style={[
                  styles.body,
                  {
                    backgroundColor: base,
                    borderColor: flash || (aimed ? '#fff' : 'rgba(255,255,255,0.55)'),
                    shadowColor: flash || '#fff',
                    shadowOpacity: flash || aimed ? 0.9 : 0.25,
                  },
                ]}
              >
                <View style={[styles.stripe, { backgroundColor: darken(base, 0.88) }]} />
                <Ionicons name={CATEGORIES[key].icon} size={32} color="#fff" />
                <Text style={styles.binText}>{CATEGORIES[key].label}</Text>
              </View>
            </Animated.View>
            <View style={styles.groundShadow} />
          </View>
        );
      })}

      {/* Pista */}
      {hint && !targetVisible && (
        <Animated.View
          style={[styles.arrow, dT > 0 ? { right: 10 } : { left: 10 }, { top: cy - 30, transform: [{ translateY: bubbleBob }] }]}
          pointerEvents="none"
        >
          <Ionicons name={dT > 0 ? 'arrow-forward-circle' : 'arrow-back-circle'} size={58} color="#fff" />
          <Text style={styles.arrowText}>{CATEGORIES[item.category].label}</Text>
        </Animated.View>
      )}

      {/* Mira */}
      <View style={[styles.reticle, { left: cx - 30, top: cy - 30, borderColor: progress > 0 ? '#3CE06E' : '#fff' }]} pointerEvents="none">
        <View style={[styles.reticleDot, progress > 0 && { backgroundColor: '#3CE06E' }]} />
      </View>
      <View style={[styles.progressBg, { left: cx - 40, top: cy + 44 }]} pointerEvents="none">
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Confeti */}
      {confetti.map((c, i) => (
        <Animated.Text
          key={i}
          pointerEvents="none"
          style={[
            styles.confetti,
            { left: cx - 12, top: cy - 16, opacity: c.o, transform: [{ translateX: c.x }, { translateY: c.y }] },
          ]}
        >
          {CONFETTI[i % CONFETTI.length]}
        </Animated.Text>
      ))}

      {/* Barra superior */}
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.round} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.itemCard}>
          <Text style={styles.itemLabel}>RESIDUO EN TU MANO</Text>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        </View>
        <TouchableOpacity style={styles.round} onPress={() => setIntro(true)}>
          <Ionicons name="help" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Objeto flotante */}
      <Animated.View
        pointerEvents="none"
        style={[styles.bubbleWrap, { top: insets.top + 78, transform: [{ translateY: bubbleBob }, { translateX: shake }] }]}
      >
        <View style={styles.bubble}>
          <Text style={styles.bubbleEmoji}>{emoji}</Text>
        </View>
        <View style={styles.pills}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>⭐ {score}</Text>
          </View>
          {streak >= 2 && (
            <View style={[styles.pill, { backgroundColor: '#FF8A1F' }]}>
              <Text style={styles.pillText}>🔥 Racha x{streak}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {!motionOk && (
        <View style={styles.warn}>
          <Text style={styles.warnText}>Sin sensor de movimiento: arrastra el dedo por la pantalla para mirar a tu alrededor.</Text>
        </View>
      )}

      {feedback && (
        <View style={[styles.feedback, { backgroundColor: feedback.ok ? colors.green : '#C0392B' }]}>
          <Text style={styles.feedbackText}>{feedback.text}</Text>
        </View>
      )}

      {/* Barra inferior */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.help}>Gira el teléfono, apunta al contenedor correcto y mantén la mira ~1 s</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={() => setHint(true)}>
            <Ionicons name="bulb" size={18} color="#fff" />
            <Text style={styles.actionText}>Pista</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={recenter}>
            <Ionicons name="locate" size={18} color="#fff" />
            <Text style={styles.actionText}>Recentrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => setItem((p) => randomItem(p.id))}>
            <Ionicons name="shuffle" size={18} color="#fff" />
            <Text style={styles.actionText}>Otro</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Introducción */}
      {intro && (
        <View style={styles.introBg}>
          <View style={styles.introCard}>
            <Text style={styles.introEmoji}>🕶️♻️</Text>
            <Text style={styles.introTitle}>Realidad aumentada</Text>
            <Text style={styles.introSub}>Aprende a separar jugando</Text>
            {[
              ['1', 'Mira a tu alrededor: hay contenedores virtuales flotando en tu espacio.'],
              ['2', 'Te toca un residuo. Gira el teléfono hasta encontrar su contenedor.'],
              ['3', 'Apunta la mira ~1 segundo para soltarlo. ¡Acierta y ganas puntos!'],
            ].map(([n, t]) => (
              <View key={n} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{n}</Text>
                </View>
                <Text style={styles.stepText}>{t}</Text>
              </View>
            ))}
            <TouchableOpacity style={[styles.btn, { marginTop: 18, alignSelf: 'stretch', alignItems: 'center' }]} onPress={closeIntro}>
              <Text style={styles.btnText}>¡Empezar!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,60,30,0.12)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  bigEmoji: { fontSize: 56, marginBottom: 12 },
  msg: { textAlign: 'center', color: colors.text, marginBottom: 16, fontSize: 16, lineHeight: 22 },
  btn: { backgroundColor: colors.green, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 22 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: colors.greenDark, fontWeight: '600' },
  horizon: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.28)' },
  binWrap: { position: 'absolute', width: BIN_W + 8, height: BIN_H + 26, alignItems: 'center' },
  lid: { width: BIN_W + 8, height: LID_H, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: -4 },
  handle: { width: 30, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  body: {
    width: BIN_W,
    height: BIN_H - LID_H,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 3,
    borderTopWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    overflow: 'hidden',
  },
  stripe: { position: 'absolute', left: 0, right: 0, top: 0, height: 10 },
  binText: { color: '#fff', fontWeight: '800', marginTop: 6, fontSize: 13, textAlign: 'center' },
  groundShadow: { width: BIN_W + 10, height: 14, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.38)', marginTop: 6 },
  arrow: { position: 'absolute', alignItems: 'center' },
  arrowText: { color: '#fff', fontWeight: '800', textShadowColor: '#000', textShadowRadius: 4 },
  reticle: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  reticleDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  progressBg: { position: 'absolute', width: 80, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#3CE06E' },
  confetti: { position: 'absolute', fontSize: 26 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  itemCard: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 },
  itemLabel: { color: '#9FE8BC', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  itemName: { color: '#fff', fontWeight: '800', fontSize: 16 },
  bubbleWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bubble: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.green,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  bubbleEmoji: { fontSize: 46 },
  pills: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: { backgroundColor: colors.green, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  warn: { position: 'absolute', top: 230, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 12 },
  warnText: { color: '#fff', textAlign: 'center' },
  feedback: { position: 'absolute', top: 230, left: 24, right: 24, borderRadius: 14, padding: 14 },
  feedbackText: { color: '#fff', fontWeight: '800', textAlign: 'center', fontSize: 16 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.35)', paddingTop: 10 },
  help: { color: '#fff', textAlign: 'center', fontSize: 12, marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 16 },
  actionText: { color: '#fff', fontWeight: '600' },
  introBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  introCard: { backgroundColor: '#fff', borderRadius: 24, padding: 22, alignSelf: 'stretch' },
  introEmoji: { fontSize: 40, textAlign: 'center' },
  introTitle: { fontSize: 24, fontWeight: '800', color: colors.greenDark, textAlign: 'center', marginTop: 6 },
  introSub: { color: colors.muted, textAlign: 'center', marginBottom: 14 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  stepNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontWeight: '800' },
  stepText: { flex: 1, color: colors.text, lineHeight: 20 },
});
