import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

type Screen = "home" | "game" | "complete" | "over";
type Piece = { id: number; type: number };
type Popup = { id: number; x: number; y: number; label: string };
type CascadeStep = { indices: number[]; points: number };

const SIZE = 7;
const TARGET = 500;
const STARTING_MOVES = 20;
const CELL = 45;
const GAP = 3;
const STEP = CELL + GAP; // 48
const PAD = 7; // board tray inner padding

// Original candy palette (deep base + light gloss core). No copyrighted assets.
const PIECES = [
  { name: "Cherry", color: "#F8384E", light: "#FF9AA6" },
  { name: "Orange", color: "#FF8A2B", light: "#FFC48A" },
  { name: "Lemon", color: "#FFC107", light: "#FFE585" },
  { name: "Grape", color: "#B15CFF", light: "#DCB6FF" },
  { name: "Berry", color: "#2FC1FF", light: "#9FE4FF" },
  { name: "Apple", color: "#28C76F", light: "#8DE9B4" },
];

const indexOf = (row: number, col: number) => row * SIZE + col;
const areNeighbors = (a: number, b: number) => {
  const ar = Math.floor(a / SIZE);
  const ac = a % SIZE;
  const br = Math.floor(b / SIZE);
  const bc = b % SIZE;
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
};

function findMatches(board: (Piece | null)[]) {
  const matches = new Set<number>();
  for (let row = 0; row < SIZE; row += 1) {
    let start = 0;
    while (start < SIZE) {
      const first = board[indexOf(row, start)];
      let end = start + 1;
      while (end < SIZE && first && board[indexOf(row, end)]?.type === first.type) end += 1;
      if (first && end - start >= 3) for (let col = start; col < end; col += 1) matches.add(indexOf(row, col));
      start = end;
    }
  }
  for (let col = 0; col < SIZE; col += 1) {
    let start = 0;
    while (start < SIZE) {
      const first = board[indexOf(start, col)];
      let end = start + 1;
      while (end < SIZE && first && board[indexOf(end, col)]?.type === first.type) end += 1;
      if (first && end - start >= 3) for (let row = start; row < end; row += 1) matches.add(indexOf(row, col));
      start = end;
    }
  }
  return matches;
}

function createBoard(): Piece[] {
  let nextId = 1;
  const board: Piece[] = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const choices = PIECES.map((_, type) => type).filter((type) => {
        const left = col >= 2 ? board[indexOf(row, col - 1)]?.type === type && board[indexOf(row, col - 2)]?.type === type : false;
        const up = row >= 2 ? board[indexOf(row - 1, col)]?.type === type && board[indexOf(row - 2, col)]?.type === type : false;
        return !left && !up;
      });
      const type = choices[Math.floor(Math.random() * choices.length)];
      board.push({ id: nextId, type });
      nextId += 1;
    }
  }
  return board;
}

let refillId = 100000;
function resolveBoard(input: Piece[]) {
  let board: (Piece | null)[] = [...input];
  let gained = 0;
  let cascade = 0;
  const steps: CascadeStep[] = [];
  while (true) {
    const matches = findMatches(board);
    if (matches.size === 0) break;
    cascade += 1;
    const points = matches.size * 20 + (cascade - 1) * 25;
    gained += points;
    steps.push({ indices: Array.from(matches), points });
    matches.forEach((index) => {
      board[index] = null;
    });
    for (let col = 0; col < SIZE; col += 1) {
      const filled: Piece[] = [];
      for (let row = SIZE - 1; row >= 0; row -= 1) {
        const piece = board[indexOf(row, col)];
        if (piece) filled.push(piece);
      }
      for (let row = SIZE - 1; row >= 0; row -= 1) {
        refillId += 1;
        board[indexOf(row, col)] = filled[SIZE - 1 - row] ?? { id: refillId, type: Math.floor(Math.random() * PIECES.length) };
      }
    }
  }
  return { board: board as Piece[], gained, steps, cascades: cascade };
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>("home");
  const [board, setBoard] = useState<Piece[]>(() => createBoard());
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(STARTING_MOVES);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [combo, setCombo] = useState(0);
  const boardRef = useRef(board);
  const selectedRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const movesRef = useRef(STARTING_MOVES);
  const popupId = useRef(0);

  const startGame = () => {
    const freshBoard = createBoard();
    boardRef.current = freshBoard;
    selectedRef.current = null;
    scoreRef.current = 0;
    movesRef.current = STARTING_MOVES;
    setBoard(freshBoard);
    setScore(0);
    setMoves(STARTING_MOVES);
    setSelected(null);
    setPopups([]);
    setCombo(0);
    setScreen("game");
  };

  const spawnFeedback = (steps: CascadeStep[], cascades: number) => {
    const created: Popup[] = steps.map((step) => {
      const rows = step.indices.map((i) => Math.floor(i / SIZE));
      const cols = step.indices.map((i) => i % SIZE);
      const avgRow = rows.reduce((a, b) => a + b, 0) / rows.length;
      const avgCol = cols.reduce((a, b) => a + b, 0) / cols.length;
      popupId.current += 1;
      return {
        id: popupId.current,
        x: PAD + avgCol * STEP + CELL / 2,
        y: PAD + avgRow * STEP + CELL / 2,
        label: `+${step.points}`,
      };
    });
    setPopups((prev) => [...prev, ...created]);
    const ids = created.map((p) => p.id);
    setTimeout(() => setPopups((prev) => prev.filter((p) => !ids.includes(p.id))), 950);
    if (cascades >= 2) {
      setCombo(cascades);
      setTimeout(() => setCombo(0), 950);
    }
  };

  const handleCell = (index: number) => {
    if (screen !== "game") return;
    const currentSelected = selectedRef.current;
    if (currentSelected === null) {
      selectedRef.current = index;
      setSelected(index);
      Haptics.selectionAsync();
      return;
    }
    if (currentSelected === index) {
      selectedRef.current = null;
      setSelected(null);
      return;
    }
    if (!areNeighbors(currentSelected, index)) {
      selectedRef.current = index;
      setSelected(index);
      Haptics.selectionAsync();
      return;
    }
    const currentBoard = boardRef.current;
    const swapped = [...currentBoard];
    [swapped[currentSelected], swapped[index]] = [swapped[index], swapped[currentSelected]];
    const matches = findMatches(swapped);
    if (matches.size === 0) {
      const nextMoves = movesRef.current - 1;
      movesRef.current = nextMoves;
      selectedRef.current = null;
      setMoves(nextMoves);
      setSelected(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      if (nextMoves <= 0) setScreen("over");
      return;
    }
    const result = resolveBoard(swapped);
    const nextScore = scoreRef.current + result.gained;
    const nextMoves = movesRef.current - 1;
    boardRef.current = result.board;
    scoreRef.current = nextScore;
    movesRef.current = nextMoves;
    selectedRef.current = null;
    setBoard(result.board);
    setScore(nextScore);
    setMoves(nextMoves);
    setSelected(null);
    spawnFeedback(result.steps, result.cascades);
    Haptics.impactAsync(result.cascades >= 2 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
    if (nextScore >= TARGET) setScreen("complete");
    else if (nextMoves <= 0) setScreen("over");
  };

  if (screen === "home") return <Home onPlay={startGame} />;
  if (screen === "complete")
    return <Result title="LEVEL COMPLETE" eyebrow="SWEET VICTORY" score={score} message="Level 1 target smashed!" button="PLAY AGAIN" onPress={startGame} success />;
  if (screen === "over")
    return <Result title="GAME OVER" eyebrow="OUT OF MOVES" score={score} message="Line up more candies and beat 500." button="RETRY" onPress={startGame} />;
  return <Game board={board} selected={selected} score={score} moves={moves} popups={popups} combo={combo} onCell={handleCell} />;
}

function Candy({ piece, index, selected, onCell }: { piece: Piece; index: number; selected: boolean; onCell: (index: number) => void }) {
  const palette = PIECES[piece.type];
  return (
    <Animated.View entering={ZoomIn.duration(240)} style={styles.cellWrap}>
      <Pressable
        testID={`cell-${index}`}
        onPress={() => onCell(index)}
        style={({ pressed }) => [
          styles.cell,
          { backgroundColor: palette.color, shadowColor: palette.color },
          selected && styles.cellSelected,
          pressed && styles.cellPressed,
        ]}
      >
        <View style={[styles.candyCore, { backgroundColor: palette.light }]} />
        <View style={styles.candyShine} />
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
  board,
  selected,
  score,
  moves,
  popups,
  combo,
  onCell,
}: {
  board: Piece[];
  selected: number | null;
  score: number;
  moves: number;
  popups: Popup[];
  combo: number;
  onCell: (index: number) => void;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#7A3FF2", "#E056A0"]} style={styles.container}>
        <View style={styles.gameTop}>
          <View>
            <Text style={styles.statLabel}>SCORE</Text>
            <Text testID="score-value" style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.levelPill}>
            <Text style={styles.levelText}>LEVEL 1</Text>
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
          <View style={styles.board}>
            {board.map((piece, index) => (
              <Candy key={piece.id} piece={piece} index={index} selected={selected === index} onCell={onCell} />
            ))}
          </View>
          <View pointerEvents="none" style={styles.overlay}>
            {popups.map((popup) => (
              <ScorePopup key={popup.id} x={popup.x} y={popup.y} label={popup.label} />
            ))}
          </View>
        </View>

        {combo >= 2 ? (
          <Animated.View key={combo} entering={ZoomIn.duration(260).easing(Easing.out(Easing.back(2)))} style={styles.comboBanner}>
            <Ionicons name="sparkles" size={16} color="#FFE585" />
            <Text style={styles.comboText}>COMBO x{combo}!</Text>
          </Animated.View>
        ) : (
          <View style={styles.helper}>
            <View style={styles.helperIcon}>
              <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.helperText}>TAP TWO ADJACENT CANDIES TO SWAP</Text>
          </View>
        )}
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
            {PIECES.slice(0, 4).map((piece) => (
              <View key={piece.name} style={[styles.logoDot, { backgroundColor: piece.color }]} />
            ))}
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LEVEL 01</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.kicker}>MATCH • CLEAR • COMBO</Text>
          <Text style={styles.title}>CANDY<Text style={styles.titleAccent}>.</Text>{`\n`}CRUSH</Text>
          <Text style={styles.subtitle}>Match three sweets.{`\n`}Chase juicy combos.</Text>
          <View style={styles.miniBoard}>
            {[0, 1, 2, 3, 4, 5, 0, 2, 4].map((type, i) => (
              <View key={i} style={[styles.miniPiece, { backgroundColor: PIECES[type].color }]}>
                <View style={[styles.miniCore, { backgroundColor: PIECES[type].light }]} />
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
  logoMark: { flexDirection: "row", flexWrap: "wrap", width: 40, gap: 4 },
  logoDot: { width: 17, height: 17, borderRadius: 9 },
  levelBadge: { borderRadius: 12, borderWidth: 1, borderColor: "#FFFFFF66", backgroundColor: "#FFFFFF22", paddingHorizontal: 12, paddingVertical: 8 },
  levelBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  hero: { flex: 1, justifyContent: "center", paddingBottom: 20 },
  kicker: { color: "#FFFFFFDD", fontWeight: "900", fontSize: 12, letterSpacing: 2.1, marginBottom: 14 },
  title: { color: "#FFFFFF", fontSize: 55, lineHeight: 53, fontWeight: "900", letterSpacing: -2, textShadowColor: "#00000030", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 6 },
  titleAccent: { color: "#FFE585" },
  subtitle: { color: "#FFFFFFDD", fontSize: 18, lineHeight: 27, marginTop: 22 },
  miniBoard: { flexDirection: "row", flexWrap: "wrap", width: 128, gap: 7, marginTop: 32, transform: [{ rotate: "-7deg" }] },
  miniPiece: { width: 35, height: 35, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  miniCore: { width: 15, height: 15, borderRadius: 8 },
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

  boardShell: { alignSelf: "center", backgroundColor: "#FFFFFF1F", padding: PAD, borderRadius: 24, borderWidth: 1, borderColor: "#FFFFFF33", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
  board: { width: SIZE * CELL + (SIZE - 1) * GAP, height: SIZE * CELL + (SIZE - 1) * GAP, flexDirection: "row", flexWrap: "wrap", gap: GAP },
  overlay: { position: "absolute", left: PAD, top: PAD, width: SIZE * CELL + (SIZE - 1) * GAP, height: SIZE * CELL + (SIZE - 1) * GAP },
  cellWrap: { width: CELL, height: CELL },
  cell: { width: CELL, height: CELL, borderRadius: 22, alignItems: "center", justifyContent: "center", shadowOpacity: 0.4, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  cellSelected: { borderWidth: 3, borderColor: "#FFFFFF", transform: [{ scale: 1.08 }] },
  cellPressed: { opacity: 0.8 },
  candyCore: { width: 20, height: 20, borderRadius: 10, opacity: 0.9 },
  candyShine: { position: "absolute", top: 8, left: 9, width: 13, height: 8, borderRadius: 6, backgroundColor: "#FFFFFFB0" },

  popup: { position: "absolute", width: 90, alignItems: "center" },
  popupText: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", letterSpacing: 0.5, textShadowColor: "#00000066", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },

  comboBanner: { flexDirection: "row", alignItems: "center", alignSelf: "center", gap: 8, marginTop: 24, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, backgroundColor: "#FFFFFF22", borderWidth: 1, borderColor: "#FFE58588" },
  comboText: { color: "#FFE585", fontSize: 16, fontWeight: "900", letterSpacing: 1.2 },
  helper: { flexDirection: "row", alignItems: "center", alignSelf: "center", gap: 9, marginTop: 25 },
  helperIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#FFFFFF22", alignItems: "center", justifyContent: "center" },
  helperText: { color: "#FFFFFFCC", fontSize: 10, fontWeight: "900", letterSpacing: 1 },

  resultIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#FFFFFF22", alignItems: "center", justifyContent: "center", marginBottom: 28 },
  resultTitle: { color: "#FFFFFF", fontSize: 39, fontWeight: "900", letterSpacing: -1, marginBottom: 28, textAlign: "center" },
  resultCard: { width: "100%", backgroundColor: "#FFFFFF1A", borderRadius: 24, padding: 25, alignItems: "center", borderWidth: 1, borderColor: "#FFFFFF33", marginBottom: 28 },
  finalScore: { color: "#FFFFFF", fontSize: 68, fontWeight: "900", marginTop: 2 },
  resultMessage: { color: "#FFFFFFDD", fontSize: 14, marginTop: 8, textAlign: "center" },
});
