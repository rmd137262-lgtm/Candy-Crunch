import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

type Screen = "home" | "game" | "complete" | "over";
type Piece = { id: number; type: number };

const SIZE = 7;
const TARGET = 500;
const STARTING_MOVES = 20;
const PIECES = [
  { name: "Coral", color: "#F04E68", light: "#FF8A9B", icon: "◆" },
  { name: "Azure", color: "#3B82F6", light: "#84B8FF", icon: "●" },
  { name: "Mint", color: "#12B88A", light: "#76E7C6", icon: "✦" },
  { name: "Sun", color: "#F4B63E", light: "#FFE08A", icon: "★" },
  { name: "Violet", color: "#8B5CF6", light: "#C4AEFF", icon: "●" },
  { name: "Pink", color: "#EC4899", light: "#FF9DCC", icon: "◆" },
];

const indexOf = (row: number, col: number) => row * SIZE + col;
const areNeighbors = (a: number, b: number) => {
  const ar = Math.floor(a / SIZE); const ac = a % SIZE;
  const br = Math.floor(b / SIZE); const bc = b % SIZE;
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
      board.push({ id: nextId, type }); nextId += 1;
    }
  }
  return board;
}

function resolveBoard(input: Piece[]) {
  let board: (Piece | null)[] = [...input];
  let gained = 0; let cascade = 0;
  while (true) {
    const matches = findMatches(board);
    if (matches.size === 0) break;
    cascade += 1;
    gained += matches.size * 20 + (cascade - 1) * 25;
    matches.forEach((index) => { board[index] = null; });
    for (let col = 0; col < SIZE; col += 1) {
      const filled: Piece[] = [];
      for (let row = SIZE - 1; row >= 0; row -= 1) {
        const piece = board[indexOf(row, col)]; if (piece) filled.push(piece);
      }
      for (let row = SIZE - 1; row >= 0; row -= 1) board[indexOf(row, col)] = filled[SIZE - 1 - row] ?? { id: Math.random(), type: Math.floor(Math.random() * PIECES.length) };
    }
  }
  return { board: board as Piece[], gained };
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>("home");
  const [board, setBoard] = useState<Piece[]>(() => createBoard());
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(STARTING_MOVES);
  const [lastGain, setLastGain] = useState(0);
  const boardRef = useRef(board);
  const selectedRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const movesRef = useRef(STARTING_MOVES);

  const startGame = () => {
    const freshBoard = createBoard();
    boardRef.current = freshBoard;
    selectedRef.current = null;
    scoreRef.current = 0;
    movesRef.current = STARTING_MOVES;
    setBoard(freshBoard); setScore(0); setMoves(STARTING_MOVES); setSelected(null); setLastGain(0); setScreen("game");
  };

  const handleCell = (index: number) => {
    if (screen !== "game") return;
    const currentSelected = selectedRef.current;
    if (currentSelected === null) { selectedRef.current = index; setSelected(index); return; }
    if (currentSelected === index) { selectedRef.current = null; setSelected(null); return; }
    if (!areNeighbors(currentSelected, index)) { selectedRef.current = index; setSelected(index); return; }
    const currentBoard = boardRef.current;
    const swapped = [...currentBoard]; [swapped[currentSelected], swapped[index]] = [swapped[index], swapped[currentSelected]];
    const matches = findMatches(swapped);
    if (matches.size === 0) {
      const nextMoves = movesRef.current - 1;
      movesRef.current = nextMoves; selectedRef.current = null;
      setMoves(nextMoves); setSelected(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      if (nextMoves <= 0) setScreen("over");
      return;
    }
    const result = resolveBoard(swapped);
    const nextScore = scoreRef.current + result.gained; const nextMoves = movesRef.current - 1;
    boardRef.current = result.board; scoreRef.current = nextScore; movesRef.current = nextMoves; selectedRef.current = null;
    setBoard(result.board); setScore(nextScore); setMoves(nextMoves); setSelected(null); setLastGain(result.gained);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (nextScore >= TARGET) setScreen("complete"); else if (nextMoves <= 0) setScreen("over");
  };

  if (screen === "home") return <Home onPlay={startGame} />;
  if (screen === "complete") return <Result title="LEVEL COMPLETE" eyebrow="YOU DID IT" score={score} message="Level 1 target reached." button="PLAY AGAIN" onPress={startGame} success />;
  if (screen === "over") return <Result title="GAME OVER" eyebrow="OUT OF MOVES" score={score} message="Try a new strategy and beat 500." button="RETRY" onPress={startGame} />;
  return <Game board={board} selected={selected} score={score} moves={moves} lastGain={lastGain} onCell={handleCell} />;
}

function Home({ onPlay }: { onPlay: () => void }) {
  return <SafeAreaView style={styles.safe}><LinearGradient colors={["#211844", "#0F1117"]} style={styles.container}><View style={styles.logoRow}><View style={styles.logoMark}>{PIECES.slice(0, 4).map((piece) => <View key={piece.name} style={[styles.logoDot, { backgroundColor: piece.color }]} />)}</View><View style={styles.levelBadge}><Text style={styles.levelBadgeText}>LEVEL 01</Text></View></View><View style={styles.hero}><Text style={styles.kicker}>MATCH • CLEAR • SCORE</Text><Text style={styles.title}>COLOR<Text style={styles.titleAccent}>.</Text>{`\n`}CRUSH</Text><Text style={styles.subtitle}>Find the matches.{`\n`}Make every move count.</Text><View style={styles.miniBoard}>{[0, 1, 2, 3, 4, 5, 0, 2, 4].map((type, i) => <View key={i} style={[styles.miniPiece, { backgroundColor: PIECES[type].color }]} />)}</View></View><View><View style={styles.goalCard}><Ionicons name="flag" size={22} color="#F4B63E" /><View><Text style={styles.statLabel}>LEVEL 1 GOAL</Text><Text style={styles.goalValue}>500 POINTS</Text></View></View><Pressable testID="play-button" onPress={onPlay} style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}><Text style={styles.playText}>PLAY LEVEL 1</Text><Ionicons name="arrow-forward" size={23} color="#11101A" /></Pressable></View></LinearGradient></SafeAreaView>;
}

function Game({ board, selected, score, moves, lastGain, onCell }: { board: Piece[]; selected: number | null; score: number; moves: number; lastGain: number; onCell: (index: number) => void }) {
  return <SafeAreaView style={styles.safe}><LinearGradient colors={["#17152B", "#0F1117"]} style={styles.container}><View style={styles.gameTop}><View><Text style={styles.statLabel}>SCORE</Text><Text testID="score-value" style={styles.statValue}>{score}</Text></View><View style={styles.levelPill}><Text style={styles.levelText}>LEVEL 1</Text></View><View style={styles.movesBox}><Text style={styles.statLabel}>MOVES</Text><Text testID="moves-value" style={styles.movesValue}>{moves}</Text></View></View><View style={styles.goalLine}><Text style={styles.goalText}>TARGET <Text style={styles.goalStrong}>{TARGET}</Text></Text><View style={styles.goalTrack}><View style={[styles.goalFill, { width: `${Math.min(100, (score / TARGET) * 100)}%` }]} /></View></View><View style={styles.boardShell}><View style={styles.board}>{board.map((piece, index) => <Pressable key={piece.id} testID={`cell-${index}`} onPress={() => onCell(index)} style={({ pressed }) => [styles.cell, { backgroundColor: PIECES[piece.type].color, shadowColor: PIECES[piece.type].light }, selected === index && styles.cellSelected, pressed && styles.cellPressed]}><Text style={[styles.pieceSymbol, { color: PIECES[piece.type].light }]}>{PIECES[piece.type].icon}</Text></Pressable>)}</View></View><View style={styles.helper}><View style={styles.helperIcon}><Ionicons name="swap-horizontal" size={19} color="#A99BFF" /></View><Text style={styles.helperText}>TAP TWO ADJACENT PIECES TO SWAP</Text></View>{lastGain > 0 && <Text style={styles.gain}>+{lastGain} POINTS</Text>}</LinearGradient></SafeAreaView>;
}

function Result({ title, eyebrow, score, message, button, onPress, success = false }: { title: string; eyebrow: string; score: number; message: string; button: string; onPress: () => void; success?: boolean }) {
  return <SafeAreaView style={styles.safe}><LinearGradient colors={[success ? "#1E2941" : "#281832", "#0F1117"]} style={[styles.container, styles.center]}><View style={[styles.resultIcon, success && styles.successIcon]}><Ionicons name={success ? "trophy" : "refresh"} size={34} color={success ? "#F4B63E" : "#FF8A9B"} /></View><Text style={styles.kicker}>{eyebrow}</Text><Text style={styles.resultTitle}>{title}</Text><View style={styles.resultCard}><Text style={styles.statLabel}>FINAL SCORE</Text><Text style={styles.finalScore}>{score}</Text><Text style={styles.resultMessage}>{message}</Text></View><Pressable testID={button === "RETRY" ? "retry-button" : "play-again-button"} onPress={onPress} style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}><Text style={styles.playText}>{button}</Text><Ionicons name={button === "RETRY" ? "refresh" : "arrow-forward"} size={23} color="#11101A" /></Pressable></LinearGradient></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F1117" }, container: { flex: 1, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28 }, center: { alignItems: "center", justifyContent: "center" },
  logoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, logoMark: { flexDirection: "row", flexWrap: "wrap", width: 40, gap: 4 }, logoDot: { width: 17, height: 17, borderRadius: 6 }, levelBadge: { borderRadius: 12, borderWidth: 1, borderColor: "#A99BFF55", backgroundColor: "#A99BFF18", paddingHorizontal: 12, paddingVertical: 8 }, levelBadgeText: { color: "#C9C1FF", fontSize: 11, fontWeight: "900", letterSpacing: 1.4 }, hero: { flex: 1, justifyContent: "center", paddingBottom: 20 }, kicker: { color: "#A99BFF", fontWeight: "900", fontSize: 12, letterSpacing: 2.1, marginBottom: 14 }, title: { color: "#F8FAFC", fontSize: 55, lineHeight: 53, fontWeight: "900", letterSpacing: -2 }, titleAccent: { color: "#F04E68" }, subtitle: { color: "#94A3B8", fontSize: 18, lineHeight: 27, marginTop: 22 }, miniBoard: { flexDirection: "row", flexWrap: "wrap", width: 128, gap: 7, marginTop: 32, transform: [{ rotate: "-7deg" }] }, miniPiece: { width: 35, height: 35, borderRadius: 11 }, goalCard: { flexDirection: "row", alignItems: "center", gap: 13, padding: 18, backgroundColor: "#FFFFFF0D", borderRadius: 20, borderWidth: 1, borderColor: "#FFFFFF12", marginBottom: 15 }, statLabel: { color: "#94A3B8", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 }, goalValue: { color: "#F8FAFC", fontSize: 19, fontWeight: "900", marginTop: 3 }, playButton: { minHeight: 62, borderRadius: 20, backgroundColor: "#A99BFF", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12, shadowColor: "#8B5CF6", shadowOpacity: 0.45, shadowRadius: 16, elevation: 8, width: "100%" }, pressed: { transform: [{ scale: 0.97 }] }, playText: { color: "#11101A", fontSize: 16, fontWeight: "900", letterSpacing: 1.2 },
  gameTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, statValue: { color: "#F8FAFC", fontSize: 25, fontWeight: "900", marginTop: 3 }, levelPill: { backgroundColor: "#A99BFF22", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: "#A99BFF55" }, levelText: { color: "#C9C1FF", fontSize: 11, fontWeight: "900", letterSpacing: 1 }, movesBox: { alignItems: "flex-end" }, movesValue: { color: "#F4B63E", fontSize: 25, fontWeight: "900", marginTop: 3 }, goalLine: { marginTop: 23, marginBottom: 17 }, goalText: { color: "#94A3B8", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 8 }, goalStrong: { color: "#F8FAFC" }, goalTrack: { height: 7, borderRadius: 5, backgroundColor: "#FFFFFF12", overflow: "hidden" }, goalFill: { height: "100%", backgroundColor: "#A99BFF", borderRadius: 5 }, boardShell: { alignSelf: "center", backgroundColor: "#25233A", padding: 7, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 18, elevation: 9 }, board: { width: 336, height: 336, flexDirection: "row", flexWrap: "wrap", gap: 3 }, cell: { width: 45, height: 45, borderRadius: 13, alignItems: "center", justifyContent: "center", shadowOpacity: 0.35, shadowRadius: 5, elevation: 4 }, cellSelected: { borderWidth: 3, borderColor: "#FFFFFF", transform: [{ scale: 1.06 }] }, cellPressed: { opacity: 0.75 }, pieceSymbol: { fontSize: 19, fontWeight: "900" }, helper: { flexDirection: "row", alignItems: "center", alignSelf: "center", gap: 9, marginTop: 25 }, helperIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#A99BFF18", alignItems: "center", justifyContent: "center" }, helperText: { color: "#64748B", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, gain: { color: "#76E7C6", textAlign: "center", fontSize: 13, fontWeight: "900", letterSpacing: 1, marginTop: 15 },
  resultIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#F04E6822", alignItems: "center", justifyContent: "center", marginBottom: 28 }, successIcon: { backgroundColor: "#F4B63E22" }, resultTitle: { color: "#F8FAFC", fontSize: 39, fontWeight: "900", letterSpacing: -1, marginBottom: 28, textAlign: "center" }, resultCard: { width: "100%", backgroundColor: "#FFFFFF0D", borderRadius: 24, padding: 25, alignItems: "center", borderWidth: 1, borderColor: "#FFFFFF12", marginBottom: 28 }, finalScore: { color: "#F8FAFC", fontSize: 68, fontWeight: "900", marginTop: 2 }, resultMessage: { color: "#94A3B8", fontSize: 14, marginTop: 8 },
});