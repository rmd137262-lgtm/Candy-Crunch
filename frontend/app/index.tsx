import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

type Screen = "home" | "game" | "over";
type Settings = { sound: boolean; vibration: boolean };
type ColorChoice = { name: string; hex: string; glow: string };

const BEST_KEY = "color-tap-best-score";
const SETTINGS_KEY = "color-tap-settings";
const COLORS: ColorChoice[] = [
  { name: "RED", hex: "#F0445E", glow: "#FF7183" },
  { name: "BLUE", hex: "#3B82F6", glow: "#67A5FF" },
  { name: "GREEN", hex: "#16C79A", glow: "#5CE8C4" },
  { name: "YELLOW", hex: "#F6B83F", glow: "#FFD875" },
  { name: "PURPLE", hex: "#8B5CF6", glow: "#B599FF" },
  { name: "PINK", hex: "#EC4899", glow: "#F979B9" },
];

export default function Index() {
  const [screen, setScreen] = useState<Screen>("home");
  const [best, setBest] = useState(0);
  const [settings, setSettings] = useState<Settings>({ sound: true, vibration: true });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<ColorChoice>(COLORS[0]);
  const [choices, setChoices] = useState<ColorChoice[]>(COLORS.slice(0, 4));
  const [timeLeft, setTimeLeft] = useState(100);
  const [levelUp, setLevelUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const savedBest = await AsyncStorage.getItem(BEST_KEY);
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedBest) setBest(Number(savedBest));
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    })();
  }, []);

  const roundsPerLevel = 5;
  const makeRound = useCallback((currentLevel: number) => {
    const count = Math.min(4 + Math.floor((currentLevel - 1) / 2), COLORS.length);
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5).slice(0, count);
    const nextTarget = shuffled[Math.floor(Math.random() * shuffled.length)];
    setChoices(shuffled);
    setTarget(nextTarget);
    setTimeLeft(100);
  }, []);

  const endGame = useCallback((finalScore: number) => {
    if (timer.current) clearInterval(timer.current);
    if (finalScore > best) {
      setBest(finalScore);
      AsyncStorage.setItem(BEST_KEY, String(finalScore));
    }
    setScore(finalScore);
    setScreen("over");
  }, [best]);

  const loseLife = useCallback(() => {
    setLives((current) => {
      const next = current - 1;
      if (next <= 0) endGame(score);
      return next;
    });
  }, [endGame, score]);

  useEffect(() => {
    if (screen !== "game" || levelUp) return;
    const duration = Math.max(820, 2600 - level * 180);
    const step = 100 / (duration / 100);
    timer.current = setInterval(() => {
      setTimeLeft((current) => {
        if (current - step <= 0) {
          loseLife();
          makeRound(level);
          return 100;
        }
        return current - step;
      });
    }, 100);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [screen, level, levelUp, loseLife, makeRound]);

  const startGame = () => {
    if (timer.current) clearInterval(timer.current);
    setScore(0); setLives(3); setLevel(1); setRound(0); setLevelUp(false);
    makeRound(1); setScreen("game");
  };

  const tapChoice = (choice: ColorChoice) => {
    if (choice.name !== target.name) {
      if (settings.vibration) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      loseLife();
      makeRound(level);
      return;
    }
    if (settings.vibration) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextScore = score + 1;
    const nextRound = round + 1;
    setScore(nextScore);
    if (nextRound >= roundsPerLevel) {
      const nextLevel = level + 1;
      setRound(0); setLevel(nextLevel); setLevelUp(true);
      if (timer.current) clearInterval(timer.current);
      setTimeout(() => { setLevelUp(false); makeRound(nextLevel); }, 1100);
    } else {
      setRound(nextRound); makeRound(level);
    }
  };

  const saveSetting = (key: keyof Settings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next); AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  if (screen === "home") return <Home best={best} onPlay={startGame} onSettings={() => setShowSettings(true)} showSettings={showSettings} settings={settings} onToggle={saveSetting} onClose={() => setShowSettings(false)} />;
  if (screen === "over") return <GameOver score={score} best={best} onPlay={startGame} />;
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#17152B", "#0F1117"]} style={styles.container}>
        <View style={styles.gameHeader}>
          <View><Text style={styles.statLabel}>SCORE</Text><Text style={styles.statValue}>{score}</Text></View>
          <View style={styles.levelPill}><Text style={styles.levelText}>LEVEL {level}</Text></View>
          <View style={styles.lifeBox}><Text style={styles.statLabel}>LIVES</Text><Text style={styles.lives}>{"♥".repeat(lives)}<Text style={styles.emptyLives}>{"♥".repeat(3 - lives)}</Text></Text></View>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${timeLeft}%` }]} /></View>
        <View style={styles.instruction}><Text style={styles.overline}>FIND THE COLOR</Text><Text style={[styles.target, { color: target.glow }]}>TAP {target.name}</Text><Text style={styles.roundText}>{round}/{roundsPerLevel} TO LEVEL UP</Text></View>
        <View style={styles.grid}>{choices.map((choice) => <Pressable key={choice.name} testID={`color-${choice.name.toLowerCase()}`} onPress={() => tapChoice(choice)} style={({ pressed }) => [styles.colorButton, { backgroundColor: choice.hex, shadowColor: choice.glow, transform: [{ scale: pressed ? 0.94 : 1 }] }]}><View style={styles.buttonShine} /></Pressable>)}</View>
        <Text style={styles.tip}>QUICK! THE CLOCK IS TICKING</Text>
        <Modal visible={levelUp} transparent animationType="fade"><View style={styles.modalBackdrop}><View style={styles.transitionCard}><Text style={styles.transitionOverline}>NICE WORK</Text><Text style={styles.transitionTitle}>LEVEL {level}</Text><Text style={styles.transitionBody}>Get ready. It’s getting faster.</Text></View></View></Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

function Home({ best, onPlay, onSettings, showSettings, settings, onToggle, onClose }: { best: number; onPlay: () => void; onSettings: () => void; showSettings: boolean; settings: Settings; onToggle: (key: keyof Settings) => void; onClose: () => void }) {
  return <SafeAreaView style={styles.safe}><LinearGradient colors={["#211844", "#0F1117"]} style={styles.container}><View style={styles.homeTop}><View style={styles.logoMark}><View style={[styles.logoDot, { backgroundColor: COLORS[0].hex }]} /><View style={[styles.logoDot, { backgroundColor: COLORS[3].hex }]} /><View style={[styles.logoDot, { backgroundColor: COLORS[2].hex }]} /><View style={[styles.logoDot, { backgroundColor: COLORS[1].hex }]} /></View><Pressable testID="settings-button" onPress={onSettings} style={styles.iconButton}><Ionicons name="settings-outline" size={24} color="#F8FAFC" /></Pressable></View><View style={styles.hero}><Text style={styles.kicker}>REACTION GAME</Text><Text style={styles.title}>COLOR{`\n`}TAP<Text style={styles.titleAccent}>.</Text></Text><Text style={styles.subtitle}>Trust your eyes.{`\n`}Beat your best.</Text></View><View style={styles.homeBottom}><View style={styles.bestCard}><Ionicons name="trophy" size={22} color="#F6B83F" /><View><Text style={styles.statLabel}>BEST SCORE</Text><Text style={styles.bestValue}>{best}</Text></View></View><Pressable testID="play-button" onPress={onPlay} style={({ pressed }) => [styles.playButton, pressed && { transform: [{ scale: 0.97 }] }]}><Text style={styles.playText}>PLAY</Text><Ionicons name="arrow-forward" size={24} color="#0F1117" /></Pressable></View><SettingsModal visible={showSettings} settings={settings} onToggle={onToggle} onClose={onClose} /></LinearGradient></SafeAreaView>;
}

function GameOver({ score, best, onPlay }: { score: number; best: number; onPlay: () => void }) { return <SafeAreaView style={styles.safe}><LinearGradient colors={["#281832", "#0F1117"]} style={[styles.container, styles.center]}><Text style={styles.kicker}>RUN COMPLETE</Text><Text style={styles.gameOverTitle}>GAME OVER</Text><View style={styles.scoreCard}><Text style={styles.statLabel}>FINAL SCORE</Text><Text style={styles.finalScore}>{score}</Text><View style={styles.divider} /><View style={styles.bestRow}><Text style={styles.statLabel}>BEST SCORE</Text><Text style={styles.bestScoreSmall}>{best}</Text></View></View><Pressable testID="play-again-button" onPress={onPlay} style={styles.playButton}><Text style={styles.playText}>PLAY AGAIN</Text><Ionicons name="refresh" size={23} color="#0F1117" /></Pressable></LinearGradient></SafeAreaView>; }

function SettingsModal({ visible, settings, onToggle, onClose }: { visible: boolean; settings: Settings; onToggle: (key: keyof Settings) => void; onClose: () => void }) { return <Modal visible={visible} transparent animationType="slide"><View style={styles.modalBackdrop}><View style={styles.settingsCard}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsScroll}><View style={styles.modalHeader}><Text style={styles.modalTitle}>SETTINGS</Text><Pressable testID="close-settings" onPress={onClose} style={styles.close}><Ionicons name="close" size={24} color="#F8FAFC" /></Pressable></View>{([ ["sound", "Sound", "volume-high"], ["vibration", "Vibration", "phone-portrait"] ] as const).map(([key, label, icon]) => <Pressable key={key} testID={`${key}-toggle`} onPress={() => onToggle(key)} style={styles.settingRow}><View style={styles.settingName}><Ionicons name={icon} size={22} color="#A99BFF" /><Text style={styles.settingText}>{label}</Text></View><View style={[styles.toggle, settings[key] && styles.toggleOn]}><View style={[styles.toggleKnob, settings[key] && styles.toggleKnobOn]} /></View></Pressable>)}<Text style={styles.settingsFoot}>Your preferences are saved automatically.</Text></ScrollView></View></View></Modal>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F1117" }, container: { flex: 1, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 28 }, center: { alignItems: "center", justifyContent: "center" },
  homeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, logoMark: { flexDirection: "row", flexWrap: "wrap", width: 40, gap: 4 }, logoDot: { width: 17, height: 17, borderRadius: 6 }, iconButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#FFFFFF12", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FFFFFF14" },
  hero: { flex: 1, justifyContent: "center", paddingBottom: 50 }, kicker: { color: "#A99BFF", fontWeight: "800", fontSize: 13, letterSpacing: 2.2, marginBottom: 15 }, title: { color: "#F8FAFC", fontSize: 58, lineHeight: 54, fontWeight: "900", letterSpacing: -2 }, titleAccent: { color: "#F0445E" }, subtitle: { color: "#94A3B8", fontSize: 18, lineHeight: 27, fontWeight: "500", marginTop: 24 }, homeBottom: { gap: 16 }, bestCard: { flexDirection: "row", alignItems: "center", gap: 13, padding: 18, backgroundColor: "#FFFFFF0D", borderRadius: 20, borderWidth: 1, borderColor: "#FFFFFF12" }, statLabel: { color: "#94A3B8", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 }, bestValue: { color: "#F8FAFC", fontSize: 24, fontWeight: "900", marginTop: 2 }, playButton: { minHeight: 62, borderRadius: 20, backgroundColor: "#A99BFF", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 12, shadowColor: "#8B5CF6", shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }, playText: { color: "#0F1117", fontSize: 17, fontWeight: "900", letterSpacing: 1.5 },
  gameHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, statValue: { color: "#F8FAFC", fontSize: 25, fontWeight: "900", marginTop: 2 }, levelPill: { backgroundColor: "#A99BFF22", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: "#A99BFF55" }, levelText: { color: "#C9C1FF", fontSize: 12, fontWeight: "900", letterSpacing: 1 }, lifeBox: { alignItems: "flex-end" }, lives: { color: "#F0445E", fontSize: 19, letterSpacing: 3, marginTop: 3 }, emptyLives: { color: "#FFFFFF22" }, progressTrack: { height: 6, borderRadius: 4, backgroundColor: "#FFFFFF12", marginTop: 25, overflow: "hidden" }, progressFill: { height: "100%", backgroundColor: "#A99BFF", borderRadius: 4 }, instruction: { alignItems: "center", marginTop: 55, marginBottom: 38 }, overline: { color: "#94A3B8", fontWeight: "800", fontSize: 12, letterSpacing: 2 }, target: { fontSize: 38, fontWeight: "900", letterSpacing: 1, marginTop: 10 }, roundText: { color: "#64748B", fontSize: 12, fontWeight: "800", letterSpacing: 1.2, marginTop: 9 }, grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 18, maxWidth: 360, alignSelf: "center" }, colorButton: { width: 145, height: 145, borderRadius: 44, shadowOpacity: 0.5, shadowRadius: 14, elevation: 10, alignItems: "center", justifyContent: "center" }, buttonShine: { width: 62, height: 16, borderRadius: 10, backgroundColor: "#FFFFFF30", transform: [{ rotate: "-35deg" }], marginTop: -55, marginLeft: -50 }, tip: { textAlign: "center", color: "#475569", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginTop: "auto" },
  gameOverTitle: { color: "#F8FAFC", fontSize: 40, fontWeight: "900", letterSpacing: -1, marginBottom: 35 }, scoreCard: { width: "100%", backgroundColor: "#FFFFFF0D", borderRadius: 24, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#FFFFFF12", marginBottom: 28 }, finalScore: { color: "#F8FAFC", fontSize: 68, fontWeight: "900", marginTop: 5 }, divider: { height: 1, backgroundColor: "#FFFFFF16", width: "100%", marginVertical: 18 }, bestRow: { flexDirection: "row", width: "100%", justifyContent: "space-between", alignItems: "center" }, bestScoreSmall: { color: "#F6B83F", fontSize: 21, fontWeight: "900" },
  modalBackdrop: { flex: 1, backgroundColor: "#080812CC", justifyContent: "flex-end" }, settingsCard: { maxHeight: "82%", backgroundColor: "#1A1D26", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingTop: 16, paddingBottom: 24, borderWidth: 1, borderColor: "#FFFFFF18" }, settingsScroll: { paddingBottom: 8 }, modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, modalTitle: { color: "#F8FAFC", fontSize: 22, fontWeight: "900", letterSpacing: 1 }, close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, settingRow: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#FFFFFF0D" }, settingName: { flexDirection: "row", gap: 14, alignItems: "center" }, settingText: { color: "#F8FAFC", fontSize: 16, fontWeight: "700" }, toggle: { width: 50, height: 30, borderRadius: 20, backgroundColor: "#475569", padding: 3 }, toggleOn: { backgroundColor: "#8B5CF6" }, toggleKnob: { width: 24, height: 24, backgroundColor: "#CBD5E1", borderRadius: 12 }, toggleKnobOn: { backgroundColor: "#FFFFFF", alignSelf: "flex-end" }, settingsFoot: { color: "#64748B", textAlign: "center", fontSize: 12, marginTop: 14 }, transitionCard: { backgroundColor: "#1A1D26", alignItems: "center", padding: 35, borderRadius: 28, margin: 24, borderWidth: 1, borderColor: "#A99BFF44" }, transitionOverline: { color: "#A99BFF", fontWeight: "900", letterSpacing: 2 }, transitionTitle: { color: "#F8FAFC", fontSize: 45, fontWeight: "900", marginTop: 8 }, transitionBody: { color: "#94A3B8", fontSize: 15, marginTop: 8 }
});
