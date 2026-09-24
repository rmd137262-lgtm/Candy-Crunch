import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { storage } from "@/src/utils/storage";
import { initSfx, playSfx, setSfxMuted } from "@/src/utils/sfx";
import { initAds, showGameOverAd } from "@/src/ads/ads";
import GameBanner from "@/src/components/GameBanner";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

type Screen = "home" | "game" | "complete" | "over";
type Piece = { id: number; type: number; row: number; col: number; clearing?: boolean; spawn?: boolean; falling?: boolean; fromRow?: number };
type Popup = { id: number; x: number; y: number; label: string };

const SIZE = 7;
const TARGET = 500;
const STARTING_MOVES = 20;
const CELL = 45;
const GAP = 3;
const STEP = CELL + GAP; // 48
const BOARD = (SIZE - 1) * STEP + CELL; // 333

const SWAP_MS = 170;
const POP_MS = 200;
const FLY_MS = 600;
const FALL_MS = 320;

const BIRDS = [
  { name: "Red bird", color: "#F8384E", light: "#FF9AA6" },
  { name: "Orange bird", color: "#FF8A2B", light: "#FFC48A" },
  { name: "Yellow bird", color: "#FFC107", light: "#FFE585" },
  { name: "Purple bird", color: "#B15CFF", light: "#DCB6FF" },
  { name: "Blue bird", color: "#2FC1FF", light: "#9FE4FF" },
  { name: "Green bird", color: "#28C76F", light: "#8DE9B4" },
];
const BIRD_IMAGES = [
  require("../assets/images/birds/red-flying.png"),
  require("../assets/images/birds/orange-flying.png"),
  require("../assets/images/birds/yellow-flying.png"),
  require("../assets/images/birds/purple-flying.png"),
  require("../assets/images/birds/blue-flying.png"),
  require("../assets/images/birds/green-flying.png"),
];

const idx = (row: number, col: number) => row * SIZE + col;
const areNeighbors = (a: number, b: number) =>
  Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)) + Math.abs((a % SIZE) - (b % SIZE)) === 1;
const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

function gridFromPieces(pieces: Piece[]): (Piece | null)[] {
  const grid: (Piece | null)[] = new Array(SIZE * SIZE).fill(null);
  pieces.forEach((p) => {
    if (!p.clearing) grid[idx(p.row, p.col)] = p;
  });
  return grid;
}

function findMatches(grid: (Piece | null)[]) {
  const matches = new Set<number>();
  for (let row = 0; row < SIZE; row += 1) {
    let start = 0;
    while (start < SIZE) {
      const first = grid[idx(row, start)];
      let end = start + 1;
      while (end < SIZE && first && grid[idx(row, end)]?.type === first.type) end += 1;
      if (first && end - start >= 3) for (let col = start; col < end; col += 1) matches.add(idx(row, col));
      start = end;
    }
  }
  for (let col = 0; col < SIZE; col += 1) {
    let start = 0;
    while (start < SIZE) {
      const first = grid[idx(start, col)];
      let end = start + 1;
      while (end < SIZE && first && grid[idx(end, col)]?.type === first.type) end += 1;
      if (first && end - start >= 3) for (let row = start; row < end; row += 1) matches.add(idx(row, col));
      start = end;
    }
  }
  return matches;
}

// Returns a valid adjacent swap that would create a match, or null.
function findValidSwap(pieces: Piece[]): { a: number; b: number } | null {
  const grid = gridFromPieces(pieces);
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const a = idx(row, col);
      const dirs = [
        [0, 1],
        [1, 0],
      ];
      for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= SIZE || nc >= SIZE) continue;
        const b = idx(nr, nc);
        const test = [...grid];
        [test[a], test[b]] = [test[b], test[a]];
        if (findMatches(test).size > 0) return { a, b };
      }
    }
  }
  return null;
}

let PIECE_ID = 1;
function initPieces(): Piece[] {
  const types: number[] = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const choices = BIRDS.map((_, type) => type).filter((type) => {
        const left = col >= 2 ? types[idx(row, col - 1)] === type && types[idx(row, col - 2)] === type : false;
        const up = row >= 2 ? types[idx(row - 1, col)] === type && types[idx(row - 2, col)] === type : false;
        return !left && !up;
      });
      types[idx(row, col)] = choices[Math.floor(Math.random() * choices.length)];
    }
  }
  const pieces: Piece[] = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      PIECE_ID += 1;
      pieces.push({ id: PIECE_ID, type: types[idx(row, col)], row, col });
    }
  }
  return pieces;
}

// Drop survivors to the bottom of each column and spawn new candies above.
function collapse(survivors: Piece[]): Piece[] {
  const next: Piece[] = [];
  for (let col = 0; col < SIZE; col += 1) {
    const colPieces = survivors.filter((p) => p.col === col).sort((a, b) => a.row - b.row);
    let row = SIZE - 1;
    for (let k = colPieces.length - 1; k >= 0; k -= 1) {
      next.push({ ...colPieces[k], row, col, falling: true, spawn: false, clearing: false });
      row -= 1;
    }
    while (row >= 0) {
      PIECE_ID += 1;
      next.push({ id: PIECE_ID, type: Math.floor(Math.random() * BIRDS.length), row, col, spawn: true, falling: true, fromRow: row - SIZE });
      row -= 1;
    }
  }
  return next;
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>("home");
  const [pieces, setPieces] = useState<Piece[]>(() => initPieces());
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(STARTING_MOVES);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [combo, setCombo] = useState(0);
  const [hint, setHint] = useState<{ a: number; b: number } | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const piecesRef = useRef(pieces);
  const selectedRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const movesRef = useRef(STARTING_MOVES);
  const processingRef = useRef(false);
  const popupId = useRef(0);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initSfx();
    initAds();
    storage.getItem<boolean>("bird_sound_on", true).then((value) => {
      const on = value !== false;
      setSoundOn(on);
      setSfxMuted(!on);
    });
    return () => {
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  }, []);

  const clearHint = () => {
    setHint(null);
    if (idleRef.current) clearTimeout(idleRef.current);
  };

  const scheduleHint = () => {
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      if (processingRef.current) return;
      if (movesRef.current <= 0 || scoreRef.current >= TARGET) return;
      const move = findValidSwap(piecesRef.current);
      if (move) setHint(move);
    }, 4000);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSfxMuted(!next);
    storage.setItem("bird_sound_on", next);
    if (next) playSfx("swap");
  };

  const commit = (next: Piece[]) => {
    piecesRef.current = next;
    setPieces(next);
  };

  const startGame = () => {
    const fresh = initPieces();
    piecesRef.current = fresh;
    selectedRef.current = null;
    scoreRef.current = 0;
    movesRef.current = STARTING_MOVES;
    processingRef.current = false;
    setPieces(fresh);
    setScore(0);
    setMoves(STARTING_MOVES);
    setSelected(null);
    setPopups([]);
    setCombo(0);
    setHint(null);
    setScreen("game");
    scheduleHint();
  };

  const spawnPopup = (indices: number[], points: number) => {
    const rows = indices.map((i) => Math.floor(i / SIZE));
    const cols = indices.map((i) => i % SIZE);
    const avgRow = rows.reduce((a, b) => a + b, 0) / rows.length;
    const avgCol = cols.reduce((a, b) => a + b, 0) / cols.length;
    popupId.current += 1;
    const pop: Popup = { id: popupId.current, x: avgCol * STEP + CELL / 2, y: avgRow * STEP + CELL / 2, label: `+${points}` };
    setPopups((prev) => [...prev, pop]);
    setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== pop.id)), 950);
  };

  const pieceAt = (list: Piece[], index: number) =>
    list.find((p) => !p.clearing && idx(p.row, p.col) === index);

  const applyMove = async (a: number, b: number) => {
    if (processingRef.current || screen !== "game") return;
    if (!areNeighbors(a, b)) return;
    const list = piecesRef.current;
    const pa = pieceAt(list, a);
    const pb = pieceAt(list, b);
    if (!pa || !pb) return;

    processingRef.current = true;
    setSelected(null);
    selectedRef.current = null;
    clearHint();
    playSfx("swap");

    // 1) Animate the swap.
    let work = list.map((p) => {
      if (p.id === pa.id) return { ...p, row: pb.row, col: pb.col, falling: false };
      if (p.id === pb.id) return { ...p, row: pa.row, col: pa.col, falling: false };
      return p;
    });
    commit(work);
    Haptics.selectionAsync();
    await wait(SWAP_MS + 20);

    // 2) No match? Slide back and burn a move.
    if (findMatches(gridFromPieces(work)).size === 0) {
      work = work.map((p) => {
        if (p.id === pa.id) return { ...p, row: pa.row, col: pa.col };
        if (p.id === pb.id) return { ...p, row: pb.row, col: pb.col };
        return p;
      });
      commit(work);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await wait(SWAP_MS + 20);
      const nextMoves = movesRef.current - 1;
      movesRef.current = nextMoves;
      setMoves(nextMoves);
      processingRef.current = false;
      if (nextMoves <= 0) {
        playSfx("over");
        showGameOverAd();
        setScreen("over");
      } else {
        scheduleHint();
      }
      return;
    }

    // 3) Resolve cascades with pop + fall animations.
    let cascades = 0;
    while (true) {
      const matches = findMatches(gridFromPieces(work));
      if (matches.size === 0) break;
      cascades += 1;
      const indices = Array.from(matches);
      const points = matches.size * 20 + (cascades - 1) * 25;
      scoreRef.current += points;
      setScore(scoreRef.current);
      spawnPopup(indices, points);
      playSfx(cascades >= 2 ? "combo" : "match");
      Haptics.impactAsync(cascades >= 2 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);

      // Matched birds fly away before the board collapses.
      work = work.map((p) => (matches.has(idx(p.row, p.col)) ? { ...p, clearing: true } : p));
      commit(work);
      await wait(FLY_MS);

      // Drop survivors and spawn new birds.
      work = collapse(work.filter((p) => !p.clearing));
      commit(work);
      await wait(FALL_MS);
    }

    const nextMoves = movesRef.current - 1;
    movesRef.current = nextMoves;
    setMoves(nextMoves);
    if (cascades >= 2) {
      setCombo(cascades);
      setTimeout(() => setCombo(0), 950);
    }
    processingRef.current = false;
    if (scoreRef.current >= TARGET) {
      playSfx("win");
      showGameOverAd();
      setScreen("complete");
    } else if (nextMoves <= 0) {
      playSfx("over");
      showGameOverAd();
      setScreen("over");
    } else {
      scheduleHint();
    }
  };

  const handleCell = (index: number) => {
    if (processingRef.current || screen !== "game") return;
    clearHint();
    scheduleHint();
    const sel = selectedRef.current;
    if (sel === null) {
      selectedRef.current = index;
      setSelected(index);
      Haptics.selectionAsync();
      return;
    }
    if (sel === index) {
      selectedRef.current = null;
      setSelected(null);
      return;
    }
    if (!areNeighbors(sel, index)) {
      selectedRef.current = index;
      setSelected(index);
      Haptics.selectionAsync();
      return;
    }
    selectedRef.current = null;
    setSelected(null);
    applyMove(sel, index);
  };

  if (screen === "home") return <Home onPlay={startGame} />;
  if (screen === "complete")
    return <Result title="LEVEL COMPLETE" eyebrow="FLYING VICTORY" score={score} message="Level 1 target cleared!" button="PLAY AGAIN" onPress={startGame} success />;
  if (screen === "over")
    return <Result title="GAME OVER" eyebrow="OUT OF MOVES" score={score} message="Match more birds and beat 500." button="RETRY" onPress={startGame} />;
  return <Game pieces={pieces} selected={selected} score={score} moves={moves} popups={popups} combo={combo} hint={hint} soundOn={soundOn} onCell={handleCell} onSwipe={applyMove} onToggleSound={toggleSound} />;
}

function Bird({ piece, selected, hinted, onCell }: { piece: Piece; selected: boolean; hinted: boolean; onCell: (index: number) => void }) {
  const palette = BIRDS[piece.type];
  const x = useSharedValue(piece.col * STEP);
  const y = useSharedValue((piece.spawn ? (piece.fromRow ?? piece.row) : piece.row) * STEP);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const glow = useSharedValue(0);
  const flightX = useSharedValue(0);
  const flightY = useSharedValue(0);
  const flightRotation = useSharedValue(0);
  const mounted = useRef(false);

  useEffect(() => {
    x.value = withTiming(piece.col * STEP, { duration: SWAP_MS, easing: Easing.inOut(Easing.quad) });
  }, [piece.col, x]);

  useEffect(() => {
    y.value = withTiming(piece.row * STEP, {
      duration: piece.falling ? FALL_MS : SWAP_MS,
      easing: piece.falling ? Easing.out(Easing.cubic) : Easing.inOut(Easing.quad),
    });
  }, [piece.row, piece.falling, y]);

  useEffect(() => {
    if (piece.clearing) {
      const direction = piece.id % 2 === 0 ? 1 : -1;
      flightX.value = withTiming(direction * (220 + (piece.id % 3) * 28), { duration: FLY_MS, easing: Easing.out(Easing.cubic) });
      flightY.value = withTiming(-(145 + (piece.id % 4) * 18), { duration: FLY_MS, easing: Easing.out(Easing.cubic) });
      flightRotation.value = withTiming(direction * (18 + (piece.id % 3) * 12), { duration: FLY_MS, easing: Easing.out(Easing.quad) });
      scale.value = withTiming(0.86, { duration: FLY_MS, easing: Easing.out(Easing.quad) });
      opacity.value = withTiming(0, { duration: FLY_MS });
    }
  }, [piece.clearing, scale, opacity, flightRotation, flightX, flightY, piece.id]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    scale.value = 0.5;
    scale.value = withTiming(1, { duration: POP_MS, easing: Easing.out(Easing.back(1.7)) });
  }, [scale]);

  useEffect(() => {
    if (hinted) {
      glow.value = withRepeat(withTiming(1, { duration: 500 }), -1, true);
    } else {
      glow.value = withTiming(0, { duration: 200 });
    }
  }, [hinted, glow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value + flightX.value },
      { translateY: y.value + flightY.value },
      { rotate: `${flightRotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <Animated.View style={[styles.birdAbs, animatedStyle]}>
      <Pressable
        testID={`cell-${idx(piece.row, piece.col)}`}
        onPress={() => onCell(idx(piece.row, piece.col))}
        style={[styles.cell, { backgroundColor: palette.color, shadowColor: palette.color }, selected && styles.cellSelected]}
      >
        <Image source={BIRD_IMAGES[piece.type]} resizeMode="contain" style={styles.birdImage} />
        <Animated.View pointerEvents="none" style={[styles.hintRing, glowStyle]} />
      </Pressable>
    </Animated.View>
  );
}

function ScorePopup({ x, y, label }: { x: number; y: number; label: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });
  }, [p]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.15, 0.7, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(p.value, [0, 1], [0, -46]) },
      { scale: interpolate(p.value, [0, 0.25, 1], [0.4, 1.15, 1], Extrapolation.CLAMP) },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.popup, { left: x - 45, top: y - 16 }, animatedStyle]}>
      <Text style={styles.popupText}>{label}</Text>
    </Animated.View>
  );
}

function Game({
  pieces,
  selected,
  score,
  moves,
  popups,
  combo,
  hint,
  soundOn,
  onCell,
  onSwipe,
  onToggleSound,
}: {
  pieces: Piece[];
  selected: number | null;
  score: number;
  moves: number;
  popups: Popup[];
  combo: number;
  hint: { a: number; b: number } | null;
  soundOn: boolean;
  onCell: (index: number) => void;
  onSwipe: (from: number, to: number) => void;
  onToggleSound: () => void;
}) {
  const startRef = useRef<number | null>(null);
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(10)
        .runOnJS(true)
        .onStart((e) => {
          const col = Math.max(0, Math.min(SIZE - 1, Math.floor(e.x / STEP)));
          const row = Math.max(0, Math.min(SIZE - 1, Math.floor(e.y / STEP)));
          startRef.current = idx(row, col);
        })
        .onEnd((e) => {
          const from = startRef.current;
          startRef.current = null;
          if (from === null) return;
          const tx = e.translationX;
          const ty = e.translationY;
          if (Math.abs(tx) < 10 && Math.abs(ty) < 10) return;
          const row = Math.floor(from / SIZE);
          const col = from % SIZE;
          if (Math.abs(tx) > Math.abs(ty)) {
            const nc = col + (tx > 0 ? 1 : -1);
            if (nc < 0 || nc >= SIZE) return;
            onSwipe(from, idx(row, nc));
          } else {
            const nr = row + (ty > 0 ? 1 : -1);
            if (nr < 0 || nr >= SIZE) return;
            onSwipe(from, idx(nr, col));
          }
        }),
    [onSwipe],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#7A3FF2", "#E056A0"]} style={styles.container}>
        <View style={styles.gameTop}>
          <View>
            <Text style={styles.statLabel}>SCORE</Text>
            <Text testID="score-value" style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.centerGroup}>
            <View style={styles.levelPill}>
              <Text style={styles.levelText}>LEVEL 1</Text>
            </View>
            <Pressable testID="sound-toggle" onPress={onToggleSound} style={styles.soundBtn}>
              <Ionicons name={soundOn ? "volume-high" : "volume-mute"} size={16} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.movesBox}>
            <Text style={styles.statLabel}>MOVES</Text>
            <Text testID="moves-value" style={styles.movesValue}>{moves}</Text>
          </View>
        </View>

        <View style={styles.goalLine}>
          <Text style={styles.goalText}>TARGET <Text style={styles.goalStrong}>{TARGET}</Text></Text>
          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, { width: `${Math.min(100, (score / TARGET) * 100)}%` }]} />
          </View>
        </View>

        <View style={styles.boardShell}>
          <GestureDetector gesture={pan}>
            <View style={styles.board}>
              {pieces.map((piece) => (
                <Bird key={piece.id} piece={piece} selected={selected === idx(piece.row, piece.col)} hinted={!!hint && (hint.a === idx(piece.row, piece.col) || hint.b === idx(piece.row, piece.col))} onCell={onCell} />
              ))}
            </View>
          </GestureDetector>
          <View pointerEvents="none" style={styles.overlay}>
            {popups.map((popup) => (
              <ScorePopup key={popup.id} x={popup.x} y={popup.y} label={popup.label} />
            ))}
          </View>
        </View>

        {combo >= 2 ? (
          <Animated.View key={combo} entering={ZoomIn.duration(260)} style={styles.comboBanner}>
            <Ionicons name="sparkles" size={16} color="#FFE585" />
            <Text style={styles.comboText}>COMBO x{combo}!</Text>
          </Animated.View>
        ) : (
          <View style={styles.helper}>
            <View style={styles.helperIcon}>
              <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.helperText}>SWIPE A BIRD TO SWAP</Text>
          </View>
        )}

        <View style={styles.bannerArea}>
          <GameBanner />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function Home({ onPlay }: { onPlay: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#7A3FF2", "#E056A0"]} style={styles.container}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            {BIRDS.slice(0, 4).map((piece, index) => (
              <View key={piece.name} style={[styles.logoDot, { backgroundColor: piece.color, shadowColor: piece.color }]}>
                <Image source={BIRD_IMAGES[index]} resizeMode="contain" style={styles.logoBird} />
              </View>
            ))}
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LEVEL 01</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.kicker}>MATCH • CLEAR • COMBO</Text>
          <Text style={styles.title}>BIRD<Text style={styles.titleAccent}>.</Text>{`\n`}BLITZ</Text>
          <Text style={styles.subtitle}>Match three birds.{`\n`}Watch them fly.</Text>
          <View style={styles.miniBoard}>
            {[0, 1, 2, 3, 4, 5, 0, 2, 4].map((type, i) => (
              <View key={i} style={[styles.miniPiece, { backgroundColor: BIRDS[type].color }]}>
                <Image source={BIRD_IMAGES[type]} resizeMode="contain" style={styles.miniBird} />
              </View>
            ))}
          </View>
        </View>

        <View>
          <View style={styles.goalCard}>
            <Ionicons name="flag" size={22} color="#FFE585" />
            <View>
              <Text style={styles.statLabel}>LEVEL 1 GOAL</Text>
              <Text style={styles.goalValue}>500 POINTS</Text>
            </View>
          </View>
          <Pressable testID="play-button" onPress={onPlay} style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
            <Text style={styles.playText}>PLAY LEVEL 1</Text>
            <Ionicons name="arrow-forward" size={22} color="#5A1F8F" />
          </Pressable>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function Result({
  title,
  eyebrow,
  score,
  message,
  button,
  onPress,
  success = false,
}: {
  title: string;
  eyebrow: string;
  score: number;
  message: string;
  button: string;
  onPress: () => void;
  success?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={success ? ["#28C76F", "#1BA6A0"] : ["#7A3FF2", "#E056A0"]} style={[styles.container, styles.center]}>
        <View style={styles.resultIcon}>
          <Ionicons name={success ? "trophy" : "refresh"} size={34} color="#FFE585" />
        </View>
        <Text style={styles.kicker}>{eyebrow}</Text>
        <Text style={styles.resultTitle}>{title}</Text>
        <View style={styles.resultCard}>
          <Text style={styles.statLabel}>FINAL SCORE</Text>
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.resultMessage}>{message}</Text>
        </View>
        <Pressable
          testID={button === "RETRY" ? "retry-button" : "play-again-button"}
          onPress={onPress}
          style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
        >
          <Text style={styles.playText}>{button}</Text>
          <Ionicons name={button === "RETRY" ? "refresh" : "arrow-forward"} size={22} color="#5A1F8F" />
        </Pressable>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#7A3FF2" },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28 },
  center: { alignItems: "center", justifyContent: "center" },

  logoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logoMark: { flexDirection: "row", flexWrap: "wrap", width: 44, gap: 6 },
  logoDot: { width: 19, height: 19, borderRadius: 10, alignItems: "center", justifyContent: "center", shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  logoBird: { width: 28, height: 28 },
  levelBadge: { borderRadius: 12, borderWidth: 1, borderColor: "#FFFFFF66", backgroundColor: "#FFFFFF22", paddingHorizontal: 12, paddingVertical: 8 },
  levelBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  hero: { flex: 1, justifyContent: "center", paddingBottom: 20 },
  kicker: { color: "#FFFFFFDD", fontWeight: "900", fontSize: 12, letterSpacing: 2.1, marginBottom: 14 },
  title: { color: "#FFFFFF", fontSize: 55, lineHeight: 53, fontWeight: "900", letterSpacing: -2, textShadowColor: "#00000030", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 6 },
  titleAccent: { color: "#FFE585" },
  subtitle: { color: "#FFFFFFDD", fontSize: 18, lineHeight: 27, marginTop: 22 },
  miniBoard: { flexDirection: "row", flexWrap: "wrap", width: 128, gap: 7, marginTop: 32, transform: [{ rotate: "-7deg" }] },
  miniPiece: { width: 35, height: 35, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  miniBird: { width: 42, height: 42 },
  goalCard: { flexDirection: "row", alignItems: "center", gap: 13, padding: 18, backgroundColor: "#FFFFFF1A", borderRadius: 20, borderWidth: 1, borderColor: "#FFFFFF33", marginBottom: 15 },
  statLabel: { color: "#FFFFFFCC", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  goalValue: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", marginTop: 3 },
  playButton: { minHeight: 62, borderRadius: 20, backgroundColor: "#FFE585", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12, shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8, width: "100%" },
  pressed: { transform: [{ scale: 0.97 }] },
  playText: { color: "#5A1F8F", fontSize: 16, fontWeight: "900", letterSpacing: 1.2 },

  gameTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statValue: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", marginTop: 3 },
  levelPill: { backgroundColor: "#FFFFFF22", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: "#FFFFFF66" },
  levelText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  movesBox: { alignItems: "flex-end" },
  movesValue: { color: "#FFE585", fontSize: 25, fontWeight: "900", marginTop: 3 },
  goalLine: { marginTop: 23, marginBottom: 17 },
  goalText: { color: "#FFFFFFCC", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 8 },
  goalStrong: { color: "#FFFFFF" },
  goalTrack: { height: 8, borderRadius: 5, backgroundColor: "#FFFFFF33", overflow: "hidden" },
  goalFill: { height: "100%", backgroundColor: "#FFE585", borderRadius: 5 },

  boardShell: { alignSelf: "center", backgroundColor: "#FFFFFF1F", padding: 7, borderRadius: 24, borderWidth: 1, borderColor: "#FFFFFF33", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
  board: { width: BOARD, height: BOARD, overflow: "hidden" },
  overlay: { position: "absolute", left: 7, top: 7, width: BOARD, height: BOARD },
  birdAbs: { position: "absolute", top: 0, left: 0, width: CELL, height: CELL, zIndex: 2 },
  cell: { width: CELL, height: CELL, borderRadius: 22, alignItems: "center", justifyContent: "center", shadowOpacity: 0.4, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  cellSelected: { borderWidth: 3, borderColor: "#FFFFFF" },
  birdImage: { width: 56, height: 56 },
  hintRing: { position: "absolute", top: -3, left: -3, right: -3, bottom: -3, borderRadius: 24, borderWidth: 3, borderColor: "#FFFFFF" },
  centerGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  soundBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#FFFFFF22", borderWidth: 1, borderColor: "#FFFFFF66", alignItems: "center", justifyContent: "center" },

  popup: { position: "absolute", width: 90, alignItems: "center" },
  popupText: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", letterSpacing: 0.5, textShadowColor: "#00000066", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },

  comboBanner: { flexDirection: "row", alignItems: "center", alignSelf: "center", gap: 8, marginTop: 24, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, backgroundColor: "#FFFFFF22", borderWidth: 1, borderColor: "#FFE58588" },
  comboText: { color: "#FFE585", fontSize: 16, fontWeight: "900", letterSpacing: 1.2 },
  helper: { flexDirection: "row", alignItems: "center", alignSelf: "center", gap: 9, marginTop: 25 },
  helperIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#FFFFFF22", alignItems: "center", justifyContent: "center" },
  helperText: { color: "#FFFFFFCC", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  bannerArea: { marginTop: "auto", alignItems: "center", justifyContent: "flex-end", minHeight: 50 },

  resultIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#FFFFFF22", alignItems: "center", justifyContent: "center", marginBottom: 28 },
  resultTitle: { color: "#FFFFFF", fontSize: 39, fontWeight: "900", letterSpacing: -1, marginBottom: 28, textAlign: "center" },
  resultCard: { width: "100%", backgroundColor: "#FFFFFF1A", borderRadius: 24, padding: 25, alignItems: "center", borderWidth: 1, borderColor: "#FFFFFF33", marginBottom: 28 },
  finalScore: { color: "#FFFFFF", fontSize: 68, fontWeight: "900", marginTop: 2 },
  resultMessage: { color: "#FFFFFFDD", fontSize: 14, marginTop: 8, textAlign: "center" },
});
