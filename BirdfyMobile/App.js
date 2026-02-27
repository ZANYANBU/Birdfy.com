import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, Dimensions, TouchableWithoutFeedback,
  TouchableOpacity, Animated, StatusBar, Image, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W, height: H } = Dimensions.get('window');

// ── Difficulty Presets ─────────────────────────────────────────────────────
const PRESETS = {
  easy:   { gravity: 0.32, lift: -8.5,  gap: 270, speed: 2.0, label: 'EASY',   color: '#4CAF50' },
  medium: { gravity: 0.50, lift: -11.0, gap: 200, speed: 3.2, label: 'MEDIUM', color: '#FF9800' },
  hard:   { gravity: 0.78, lift: -13.5, gap: 148, speed: 4.6, label: 'HARD',   color: '#F44336' },
};

// ── Themes ─────────────────────────────────────────────────────────────────
const THEMES = {
  night: { bg:['#0a0a1a','#1a1a3e'], pipe1:'#7e7bff', pipe2:'#4441bb', acc:'#45e6ff', scoreC:'#fff',  floor:'#1a1a4e' },
  day:   { bg:['#5bb8f5','#87CEEB'], pipe1:'#74bf2e', pipe2:'#4a8a18', acc:'#FFD700', scoreC:'#fff',  floor:'#5d8a3c' },
  lava:  { bg:['#1a0000','#3d0800'], pipe1:'#ff4500', pipe2:'#b03000', acc:'#FFD700', scoreC:'#ffcc00', floor:'#3d0800' },
};

// Default gravity multiplier per theme (1.0 = normal)
const DEFAULT_GRAVITY = { night: 1.0, day: 0.85, lava: 1.2 };
const GRAV_STEP = 0.1;
const GRAV_MIN  = 0.3;
const GRAV_MAX  = 2.5;

// ── Layout Constants ───────────────────────────────────────────────────────
const PIPE_W   = 68;
const BIRD_W   = 44;
const BIRD_H   = 32;
const BIRD_X   = 85;
const FLOOR_H  = 90;

export default function App() {
  // ── UI State (triggers re-renders) ────────────────────────────────────
  const [uiScore,      setUiScore]      = useState(0);
  const [bestScore,    setBestScore]    = useState(0);
  const [screen,       setScreen]       = useState('MENU'); // MENU | PLAYING | GAMEOVER
  const [pipeTopH,     setPipeTopH]     = useState(180);
  const [difficulty,   setDifficulty]   = useState('medium');
  const [theme,        setTheme]        = useState('night');
  const [customBg,     setCustomBg]     = useState(null);   // { uri } or null
  const [themeGravity, setThemeGravity] = useState({ ...DEFAULT_GRAVITY });
  const [wingUp,       setWingUp]       = useState(false);  // wing animation toggle

  // ── Physics Refs (no re-render; safe inside rAF loop) ─────────────────
  const gameStateRef  = useRef('MENU');
  const birdYRef      = useRef(H / 2);
  const birdVelRef    = useRef(0);
  const pipeXRef      = useRef(W + 50);
  const pipeTopHRef   = useRef(180);
  const scoreRef      = useRef(0);
  const diffRef       = useRef('medium');
  const gravMultRef   = useRef(1.0); // captured gravity multiplier for current run
  const loopRef       = useRef(null);
  const wingLoopRef   = useRef(null);

  // ── Animated Values ───────────────────────────────────────────────────
  const birdYAnim   = useRef(new Animated.Value(H / 2)).current;
  const birdRotAnim = useRef(new Animated.Value(0)).current;
  const pipeXAnim   = useRef(new Animated.Value(W + 50)).current;
  const wingAnim    = useRef(new Animated.Value(0)).current;

  // ── Initialization ────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('@birdfy_best')
      .then(v => { if (v) setBestScore(parseInt(v)); })
      .catch(() => {});
    AsyncStorage.getItem('@birdfy_gravity')
      .then(v => { if (v) setThemeGravity(JSON.parse(v)); })
      .catch(() => {});
    AsyncStorage.getItem('@birdfy_custombg')
      .then(v => { if (v) setCustomBg({ uri: v }); })
      .catch(() => {});
    return () => { stopLoop(); stopWingAnim(); };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────
  const stopLoop = () => {
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
  };

  const stopWingAnim = () => {
    if (wingLoopRef.current) {
      wingLoopRef.current.stop();
      wingLoopRef.current = null;
    }
  };

  const startWingAnim = (speedMs = 160) => {
    stopWingAnim();
    wingAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wingAnim, { toValue: 1,  duration: speedMs, useNativeDriver: true }),
        Animated.timing(wingAnim, { toValue: -1, duration: speedMs, useNativeDriver: true }),
      ])
    );
    wingLoopRef.current = loop;
    loop.start();
  };

  const randomPipeH = (gap) => {
    const min = 80;
    const max = H - FLOOR_H - gap - 80;
    return min + Math.random() * (max - min);
  };

  // ── Gallery picker ────────────────────────────────────────────────────
  const pickBackground = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setCustomBg({ uri });
      AsyncStorage.setItem('@birdfy_custombg', uri).catch(() => {});
    }
  };

  const clearBackground = () => {
    setCustomBg(null);
    AsyncStorage.removeItem('@birdfy_custombg').catch(() => {});
  };

  // ── Gravity controls ──────────────────────────────────────────────────
  const adjustGravity = (themeKey, delta) => {
    setThemeGravity(prev => {
      const next = Math.min(GRAV_MAX, Math.max(GRAV_MIN, +((prev[themeKey] ?? 1.0) + delta).toFixed(1)));
      const updated = { ...prev, [themeKey]: next };
      AsyncStorage.setItem('@birdfy_gravity', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  // ── Start / Restart ───────────────────────────────────────────────────
  const startGame = () => {
    const preset = PRESETS[difficulty];
    const initH  = randomPipeH(preset.gap);

    diffRef.current    = difficulty;
    gravMultRef.current = themeGravity[theme] ?? 1.0;

    birdYRef.current     = H / 2;
    birdVelRef.current   = 0;
    pipeXRef.current     = W + 50;
    pipeTopHRef.current  = initH;
    scoreRef.current     = 0;
    gameStateRef.current = 'PLAYING';

    birdYAnim.setValue(H / 2);
    birdRotAnim.setValue(0);
    pipeXAnim.setValue(W + 50);

    setUiScore(0);
    setPipeTopH(initH);
    setScreen('PLAYING');

    // Wing flaps faster on hard
    const flapSpeed = difficulty === 'hard' ? 90 : difficulty === 'easy' ? 220 : 140;
    startWingAnim(flapSpeed);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    stopLoop();
    loopRef.current = requestAnimationFrame(gameLoop);
  };

  // ── Game Loop (all refs, zero stale-closure risk) ─────────────────────
  const gameLoop = () => {
    if (gameStateRef.current !== 'PLAYING') return;

    const preset = PRESETS[diffRef.current];

    // 1. Bird physics (gravity scaled by per-theme multiplier)
    birdVelRef.current += preset.gravity * gravMultRef.current;
    birdYRef.current   += birdVelRef.current;

    // 2. Pipe movement
    pipeXRef.current -= preset.speed;

    // 3. Pipe recycling -> score point
    if (pipeXRef.current < -PIPE_W - 10) {
      pipeXRef.current    = W + 50;
      const newH          = randomPipeH(preset.gap);
      pipeTopHRef.current = newH;
      scoreRef.current   += 1;

      // UI update (re-render only for score & pipe height reset)
      setUiScore(scoreRef.current);
      setPipeTopH(newH);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // 4. Collision detection
    if (checkCollision(preset.gap)) {
      triggerGameOver();
      return;
    }

    // 5. Push values to Animated (native driver bypass — direct setValue is sync)
    birdYAnim.setValue(birdYRef.current);
    pipeXAnim.setValue(pipeXRef.current);

    // 6. Rotation: up = tilted back, falling = nose down
    const rot = Math.min(Math.max(birdVelRef.current * 4.5, -30), 80);
    birdRotAnim.setValue(rot);

    loopRef.current = requestAnimationFrame(gameLoop);
  };

  // ── Collision (tight hitbox with inner margins) ───────────────────────
  const checkCollision = (gap) => {
    const bLeft   = BIRD_X + 7;
    const bRight  = BIRD_X + BIRD_W - 7;
    const bTop    = birdYRef.current + 5;
    const bBottom = birdYRef.current + BIRD_H - 5;

    // Floor and ceiling
    if (bBottom > H - FLOOR_H) return true;
    if (bTop < 0)              return true;

    const px = pipeXRef.current;
    const ph = pipeTopHRef.current;

    // X overlap with the pipe column
    if (bRight > px + 5 && bLeft < px + PIPE_W - 5) {
      if (bTop  < ph)        return true; // top pipe
      if (bBottom > ph + gap) return true; // bottom pipe
    }
    return false;
  };

  // ── Flap (reads gameStateRef, never stale) ────────────────────────────
  const flap = () => {
    if (gameStateRef.current !== 'PLAYING') return;
    birdVelRef.current = PRESETS[diffRef.current].lift;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // ── Game Over ─────────────────────────────────────────────────────────
  const triggerGameOver = () => {
    stopLoop();
    stopWingAnim();
    gameStateRef.current = 'GAMEOVER';
    setScreen('GAMEOVER');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    const finalScore = scoreRef.current;
    setBestScore(prev => {
      const newBest = Math.max(prev, finalScore);
      AsyncStorage.setItem('@birdfy_best', newBest.toString()).catch(() => {});
      return newBest;
    });
  };

  // ── Render helpers ────────────────────────────────────────────────────
  const rotStr = birdRotAnim.interpolate({
    inputRange: [-30, 80],
    outputRange: ['-30deg', '80deg'],
  });

  const t      = THEMES[theme];
  const preset = PRESETS[difficulty];

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Background: custom photo or gradient */}
      {customBg
        ? <Image source={customBg} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        : <LinearGradient colors={t.bg} style={StyleSheet.absoluteFillObject} />
      }
      {/* Dim overlay for custom bg readability */}
      {customBg && <View style={styles.bgDim} />}

      {/* ── GAME LAYER (full screen touch) ─────────────────────────────── */}
      <TouchableWithoutFeedback onPress={flap}>
        <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]}>

          {/* Top Pipe */}
          <Animated.View style={[styles.pipe, {
            left: pipeXAnim, top: 0, height: pipeTopH,
            backgroundColor: t.pipe1, borderColor: t.pipe2,
            borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
          }]} />

          {/* Bottom Pipe */}
          <Animated.View style={[styles.pipe, {
            left: pipeXAnim, top: pipeTopH + preset.gap, height: H,
            backgroundColor: t.pipe1, borderColor: t.pipe2,
            borderTopLeftRadius: 14, borderTopRightRadius: 14,
          }]} />

          {/* Floor */}
          <View style={[styles.floor, { backgroundColor: t.floor }]} />

          {/* Bird */}
          <Animated.View style={[styles.bird, {
            top: birdYAnim,
            shadowColor: t.acc,
            transform: [{ rotate: rotStr }],
          }]}>
            {/* Animated wing (behind body) */}
            <Animated.View style={[styles.birdWing, {
              transform: [{
                rotateX: wingAnim.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['40deg', '-55deg'],
                }),
              }],
            }]} />
            <LinearGradient colors={['#FFD700', '#FF8C00']} style={styles.birdInner}>
              <View style={styles.birdEye} />
              <View style={styles.birdBeak} />
            </LinearGradient>
          </Animated.View>

        </View>
      </TouchableWithoutFeedback>

      {/* ── HUD (score while playing) ──────────────────────────────────── */}
      {screen === 'PLAYING' && (
        <View style={styles.hud} pointerEvents="none">
          <Text style={[styles.hudScore, { color: t.scoreC }]}>{uiScore}</Text>
        </View>
      )}

      {/* ── MENU ──────────────────────────────────────────────────────── */}
      {screen === 'MENU' && (
        <View style={styles.overlay}>
          <BlurView intensity={28} tint="dark" style={styles.card}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingBottom: 8 }}>

              <Text style={[styles.title, { color: t.acc }]}>BIRDFY</Text>
              <Text style={styles.cardSub}>Best Score: {bestScore}</Text>

              <Text style={styles.sectionLabel}>DIFFICULTY</Text>
              <View style={styles.row}>
                {Object.entries(PRESETS).map(([key, p]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setDifficulty(key)}
                    style={[styles.diffBtn, {
                      borderColor: p.color,
                      backgroundColor: difficulty === key ? p.color : 'transparent',
                    }]}
                  >
                    <Text style={[styles.diffBtnTxt, { color: difficulty === key ? '#fff' : p.color }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>THEME</Text>
              <View style={styles.row}>
                {Object.entries(THEMES).map(([key, th]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setTheme(key)}
                    style={[styles.themeBtn, {
                      backgroundColor: th.bg[1],
                      borderColor: theme === key ? t.acc : 'rgba(255,255,255,0.15)',
                    }]}
                  >
                    <View style={[styles.themeCircle, { backgroundColor: th.pipe1 }]} />
                    <Text style={[styles.themeTxt, { color: theme === key ? t.acc : '#aaa' }]}>
                      {key.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── Per-theme gravity control ── */}
              <Text style={styles.sectionLabel}>GRAVITY — {theme.toUpperCase()}</Text>
              <View style={styles.gravRow}>
                <TouchableOpacity onPress={() => adjustGravity(theme, -GRAV_STEP)} style={[styles.gravBtn, { borderColor: t.acc }]}>
                  <Text style={[styles.gravBtnTxt, { color: t.acc }]}>−</Text>
                </TouchableOpacity>
                <View style={styles.gravDisplay}>
                  <Text style={[styles.gravValue, { color: t.acc }]}>{(themeGravity[theme] ?? 1.0).toFixed(1)}×</Text>
                  <Text style={styles.gravLabel}>
                    {(themeGravity[theme] ?? 1.0) < 0.7 ? '🪶 Feather'
                    : (themeGravity[theme] ?? 1.0) < 1.1 ? '🌍 Normal'
                    : (themeGravity[theme] ?? 1.0) < 1.6 ? '🏋️ Heavy'
                    : '🌑 Planet'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => adjustGravity(theme, +GRAV_STEP)} style={[styles.gravBtn, { borderColor: t.acc }]}>
                  <Text style={[styles.gravBtnTxt, { color: t.acc }]}>+</Text>
                </TouchableOpacity>
              </View>

              {/* ── Custom background ── */}
              <Text style={styles.sectionLabel}>BACKGROUND</Text>
              <View style={styles.row}>
                <TouchableOpacity onPress={pickBackground} style={[styles.bgBtn, { borderColor: t.acc }]}>
                  <Text style={[styles.bgBtnTxt, { color: t.acc }]}>📷  Gallery</Text>
                </TouchableOpacity>
                {customBg && (
                  <TouchableOpacity onPress={clearBackground} style={[styles.bgBtn, { borderColor: '#f44336' }]}>
                    <Text style={[styles.bgBtnTxt, { color: '#f44336' }]}>✕  Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              {customBg && (
                <Image source={customBg} style={styles.bgPreview} resizeMode="cover" />
              )}

              <TouchableOpacity onPress={startGame} style={[styles.mainBtn, { backgroundColor: t.acc }]}>
                <Text style={styles.mainBtnTxt}>TAP TO FLY ›</Text>
              </TouchableOpacity>

            </ScrollView>
          </BlurView>
        </View>
      )}

      {/* ── GAME OVER ─────────────────────────────────────────────────── */}
      {screen === 'GAMEOVER' && (
        <View style={styles.overlay}>
          <BlurView intensity={35} tint="dark" style={styles.card}>

            <Text style={styles.crashTxt}>CRASHED!</Text>
            <Text style={[styles.finalScore, { color: t.acc }]}>{uiScore}</Text>
            <Text style={styles.finalBest}>BEST: {bestScore}</Text>

            {uiScore > 0 && uiScore >= bestScore && (
              <Text style={[styles.newRecord, { color: t.acc }]}>✦ NEW RECORD ✦</Text>
            )}

            {/* Quick difficulty switch */}
            <Text style={styles.sectionLabel}>DIFFICULTY</Text>
            <View style={styles.row}>
              {Object.entries(PRESETS).map(([key, p]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setDifficulty(key)}
                  style={[styles.diffBtn, {
                    borderColor: p.color,
                    backgroundColor: difficulty === key ? p.color : 'transparent',
                  }]}
                >
                  <Text style={[styles.diffBtnTxt, { color: difficulty === key ? '#fff' : p.color }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={startGame} style={[styles.mainBtn, { backgroundColor: t.acc, marginTop: 16 }]}>
              <Text style={styles.mainBtnTxt}>RETRY ›</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setScreen('MENU')} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnTxt}>MENU</Text>
            </TouchableOpacity>

          </BlurView>
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Game elements
  pipe: {
    position: 'absolute', width: PIPE_W, borderWidth: 3,
    shadowColor: '#000', shadowOffset: { width: -3, height: 4 },
    shadowOpacity: 0.6, shadowRadius: 4, elevation: 6,
  },
  floor: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: FLOOR_H,
    borderTopWidth: 3, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  bird: {
    position: 'absolute', left: BIRD_X, width: BIRD_W, height: BIRD_H,
    shadowRadius: 12, shadowOpacity: 0.7, elevation: 10, zIndex: 20,
  },
  birdWing: {
    position: 'absolute',
    left: 4, top: 6,
    width: 22, height: 13,
    backgroundColor: '#FFF3B0',
    borderRadius: 8,
    borderWidth: 1.5, borderColor: '#DAA520',
    zIndex: 5,
    // perspective makes rotateX visible
    transform: [{ perspective: 200 }],
  },
  birdInner: {
    flex: 1, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  birdEye: {
    position: 'absolute', right: 7, top: 5, width: 11, height: 11,
    backgroundColor: '#fff', borderRadius: 6, borderWidth: 2, borderColor: '#222',
  },
  birdBeak: {
    position: 'absolute', right: -8, width: 0, height: 0,
    borderTopWidth: 6, borderBottomWidth: 6, borderLeftWidth: 10,
    borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#FF4500',
  },

  // HUD
  hud: {
    position: 'absolute', top: 55, left: 0, right: 0, alignItems: 'center', zIndex: 30,
  },
  hudScore: {
    fontSize: 76, fontWeight: '900', opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 8,
  },

  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', zIndex: 50,
  },
  card: {
    width: W * 0.86, paddingVertical: 32, paddingHorizontal: 28,
    borderRadius: 30, alignItems: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },

  // Menu texts
  title: { fontSize: 44, fontWeight: '900', letterSpacing: 5 },
  cardSub: { color: '#aaa', marginTop: 6, fontSize: 15 },
  sectionLabel: {
    color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800',
    letterSpacing: 3, marginTop: 22, marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 10 },

  // Difficulty buttons
  diffBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2,
  },
  diffBtnTxt: { fontSize: 12, fontWeight: '800' },

  // Theme buttons
  themeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2,
  },
  themeCircle: { width: 12, height: 12, borderRadius: 6 },
  themeTxt: { fontSize: 12, fontWeight: '700' },

  // Action buttons
  mainBtn: {
    marginTop: 24, paddingVertical: 16, paddingHorizontal: 44,
    borderRadius: 50, shadowRadius: 12, shadowOpacity: 0.5, elevation: 6,
  },
  mainBtnTxt: { fontSize: 18, fontWeight: '900', color: '#001428' },
  secondaryBtn: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 30 },
  secondaryBtnTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '700' },

  // Game over
  crashTxt: {
    fontSize: 38, fontWeight: '900', color: '#ff5d9e',
    textShadowColor: 'rgba(255,93,158,0.4)', textShadowRadius: 12,
  },
  finalScore: { fontSize: 72, fontWeight: '900', marginVertical: 4 },
  finalBest: { color: '#888', fontSize: 16 },
  newRecord: { fontSize: 14, fontWeight: '800', letterSpacing: 2, marginTop: 6 },

  // Gravity control
  gravRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4,
  },
  gravBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  gravBtnTxt: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  gravDisplay: { alignItems: 'center', minWidth: 70 },
  gravValue: { fontSize: 26, fontWeight: '900' },
  gravLabel: { color: '#888', fontSize: 12, marginTop: 2 },

  // Background picker
  bgBtn: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 22, borderWidth: 2,
  },
  bgBtnTxt: { fontSize: 14, fontWeight: '700' },
  bgPreview: {
    width: W * 0.7, height: 80, borderRadius: 14, marginTop: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
  },

  // Custom background dim
  bgDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
