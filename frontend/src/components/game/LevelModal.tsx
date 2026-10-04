import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

type LevelModalProps = {
  visible: boolean;
  finalLevel: boolean;
  levelName: string;
  score: number;
  starsEarned: number;
  objectives: { icon: string; progress: number; count: number }[];
  onContinue: () => void;
};

export default function LevelModal({
  visible,
  finalLevel,
  levelName,
  score,
  starsEarned,
  objectives,
  onContinue,
}: LevelModalProps) {
  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.scrim}>
      <Animated.View entering={ZoomIn.duration(250)} style={styles.card}>
        <View style={styles.confetti}><Text style={styles.confettiText}>✦  ✨  ✦</Text></View>
        <View style={styles.titlePlate}>
          <Text style={styles.title}>{finalLevel ? "All Levels Complete!" : levelName}</Text>
        </View>
        <Text style={styles.eyebrow}>{finalLevel ? "AMAZING!" : "MISSION COMPLETE"}</Text>
        <Text style={styles.stars}>{'★'.repeat(starsEarned)}{'☆'.repeat(Math.max(0, 3 - starsEarned))}</Text>
        <Text style={styles.description}>
          {finalLevel ? "You cleared every level!" : "Great work! Your goals are complete."}
        </Text>
        <View style={styles.objectives}>
          {objectives.map((objective, index) => (
            <View key={`${objective.icon}-${index}`} style={styles.objective}>
              <Text style={styles.objectiveIcon}>{objective.icon}</Text>
              <Text style={styles.objectiveCount}>{objective.count}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#48B947" />
            </View>
          ))}
        </View>
        <View style={styles.scorePill}>
          <Text style={styles.scoreCaption}>LEVEL SCORE</Text>
          <Text style={styles.score}>{score}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onContinue} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>{finalLevel ? "PLAY AGAIN" : "CONTINUE"}</Text>
          <Ionicons name={finalLevel ? "refresh" : "arrow-forward"} size={19} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: "#21093BBF", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 390, overflow: "visible", alignItems: "center", borderRadius: 36, borderWidth: 5, borderColor: "#F4C87D", backgroundColor: "#0BA798", padding: 22, paddingTop: 76, shadowColor: "#18052A", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 },
  confetti: { position: "absolute", top: 12, right: 18 },
  confettiText: { color: "#E9B736", fontSize: 18 },
  titlePlate: { position: "absolute", top: -18, left: 24, right: 24, minHeight: 74, borderRadius: 34, borderWidth: 5, borderColor: "#F4C87D", backgroundColor: "#087F77", alignItems: "center", justifyContent: "center", paddingHorizontal: 14, shadowColor: "#543322", shadowOpacity: 0.3, shadowRadius: 5, elevation: 7 },
  eyebrow: { color: "#FFF4D7", fontSize: 14, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#FFFDF0", fontSize: 28, lineHeight: 34, fontWeight: "900", textAlign: "center", textShadowColor: "#254D48", textShadowRadius: 2 },
  stars: { color: "#FFD62E", fontSize: 48, lineHeight: 58, letterSpacing: 2, textShadowColor: "#BD7A00", textShadowRadius: 3, marginTop: 4 },
  description: { color: "#F8F4E6", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 3, marginBottom: 13, fontWeight: "700" },
  objectives: { width: "100%", minHeight: 68, borderRadius: 20, backgroundColor: "#FFE6C5", borderWidth: 3, borderColor: "#F0B66D", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, padding: 8, marginBottom: 12 },
  objective: { flexDirection: "row", alignItems: "center", gap: 2 },
  objectiveIcon: { fontSize: 28 },
  objectiveCount: { color: "#6E442A", fontSize: 14, fontWeight: "900", marginRight: 2 },
  scorePill: { width: "100%", borderRadius: 17, backgroundColor: "#087F77", alignItems: "center", padding: 8, marginBottom: 12 },
  scoreCaption: { color: "#D8F6E9", fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  score: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", marginTop: 1 },
  button: { width: "100%", minHeight: 58, borderRadius: 18, backgroundColor: "#56D328", borderWidth: 4, borderColor: "#B3EF81", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});