import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

type LevelModalProps = {
  visible: boolean;
  finalLevel: boolean;
  levelName: string;
  score: number;
  onContinue: () => void;
};

export default function LevelModal({ visible, finalLevel, levelName, score, onContinue }: LevelModalProps) {
  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.scrim}>
      <Animated.View entering={ZoomIn.duration(250)} style={styles.card}>
        <View style={styles.confetti}><Text style={styles.confettiText}>✦  ✨  ✦</Text></View>
        <View style={styles.iconCircle}>
          <Ionicons name={finalLevel ? "trophy" : "star"} size={34} color="#6A36A0" />
        </View>
        <Text style={styles.eyebrow}>{finalLevel ? "THE FLOCK IS FREE" : "FLYING VICTORY"}</Text>
        <Text style={styles.title}>{finalLevel ? "All Levels Complete!" : "Level Complete!"}</Text>
        <Text style={styles.description}>
          {finalLevel ? "You cleared all four challenges. Amazing flying!" : `${levelName} is cleared. Ready for the next challenge?`}
        </Text>
        <View style={styles.scorePill}>
          <Text style={styles.scoreCaption}>LEVEL SCORE</Text>
          <Text style={styles.score}>{score}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onContinue} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>{finalLevel ? "PLAY AGAIN" : "NEXT LEVEL"}</Text>
          <Ionicons name={finalLevel ? "refresh" : "arrow-forward"} size={19} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: "#21093BBF", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 390, overflow: "hidden", alignItems: "center", borderRadius: 30, backgroundColor: "#FFFDFE", padding: 26, shadowColor: "#18052A", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16 },
  confetti: { position: "absolute", top: 12, right: 18 },
  confettiText: { color: "#E9B736", fontSize: 18 },
  iconCircle: { width: 70, height: 70, borderRadius: 24, backgroundColor: "#FFF0B9", alignItems: "center", justifyContent: "center", marginTop: 2, marginBottom: 18 },
  eyebrow: { color: "#9B6EBA", fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  title: { color: "#402158", fontSize: 29, lineHeight: 35, fontWeight: "900", textAlign: "center", marginTop: 8 },
  description: { color: "#826E8F", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 9, marginBottom: 18 },
  scorePill: { width: "100%", borderRadius: 17, backgroundColor: "#F5EFF9", alignItems: "center", padding: 11, marginBottom: 17 },
  scoreCaption: { color: "#9A7AAE", fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  score: { color: "#5A2587", fontSize: 24, fontWeight: "900", marginTop: 2 },
  button: { width: "100%", minHeight: 55, borderRadius: 18, backgroundColor: "#6B35A4", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});