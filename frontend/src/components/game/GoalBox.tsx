import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import type { GoalProgress, LevelConfig } from "@/src/game/levels";

type GoalBoxProps = {
  level: LevelConfig;
  progress: GoalProgress;
};

export default function GoalBox({ level, progress }: GoalBoxProps) {
  const pulse = useSharedValue(1);
  const rows = [
    ...(level.foodGoal ? [{ ...level.foodGoal, value: progress.food }] : []),
    ...(level.boosterGoal ? [{ ...level.boosterGoal, value: progress.boosters }] : []),
    ...(level.trappedGoal ? [{ ...level.trappedGoal, value: progress.trapped }] : []),
  ];

  useEffect(() => {
    pulse.value = withSequence(
      withTiming(1.045, { duration: 120, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 170, easing: Easing.out(Easing.quad) }),
    );
  }, [progress.food, progress.boosters, progress.trapped, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View accessibilityLabel={`Level goal: ${level.name}`} style={[styles.box, animatedStyle]}>
      <View style={styles.heading}>
        <Text style={styles.headingText}>LEVEL {level.id} GOAL</Text>
        <Text style={styles.levelName}>{level.name}</Text>
      </View>
      <View style={styles.goals}>
        {rows.map((goal) => {
          const count = Math.min(goal.value, goal.target);
          const ratio = Math.min(1, goal.value / goal.target);
          return (
            <View key={goal.label} style={styles.goalRow}>
              <View style={styles.iconBadge}>
                <Text style={styles.icon}>{goal.icon}</Text>
              </View>
              <Text numberOfLines={1} style={styles.goalLabel}>{goal.label}</Text>
              <Text accessibilityLabel={`${count} of ${goal.target}`} style={styles.counter}>
                {count} <Text style={styles.counterDivider}>/</Text> {goal.target}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 11,
    shadowColor: "#311064",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7 },
  headingText: { color: "#8756B9", fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  levelName: { color: "#9A7AAE", fontSize: 10, fontWeight: "800" },
  goals: { gap: 6 },
  goalRow: { minHeight: 31, flexDirection: "row", alignItems: "center", gap: 8 },
  iconBadge: { width: 27, height: 27, borderRadius: 10, backgroundColor: "#FFF3C9", alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 17 },
  goalLabel: { flex: 1, color: "#43265E", fontSize: 12, fontWeight: "800" },
  counter: { color: "#5A2587", minWidth: 54, textAlign: "right", fontSize: 13, fontWeight: "900" },
  counterDivider: { color: "#B9A6C6", fontWeight: "700" },
  track: { width: 48, height: 7, overflow: "hidden", borderRadius: 5, backgroundColor: "#EEE6F5" },
  fill: { height: "100%", borderRadius: 5, backgroundColor: "#FFC943" },
});