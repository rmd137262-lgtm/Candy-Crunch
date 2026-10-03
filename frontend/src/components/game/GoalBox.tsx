import React, { useEffect } from "react";
import { StyleSheet, Text, View, Image, ImageBackground } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import type { GoalProgress, LevelConfig } from "@/src/game/levels";

const GOAL_ICONS = {
  food: require("../../../assets/images/goals/food_bowl.png"),
  trapped: require("../../../assets/images/goals/cage_dome.png"),
  booster: require("../../../assets/images/goals/nest_eggs.png"),
};

const HEADER_BG = require("../../../assets/images/goals/board_header.png");

type GoalBoxProps = {
  level: LevelConfig;
  progress: GoalProgress;
};

export default function GoalBox({ level, progress }: GoalBoxProps) {
  const pulse = useSharedValue(1);

  const rows = [
    ...(level.foodGoal ? [{ key: "food", target: level.foodGoal.target, value: progress.food, icon: GOAL_ICONS.food }] : []),
    ...(level.boosterGoal ? [{ key: "booster", target: level.boosterGoal.target, value: progress.boosters, icon: GOAL_ICONS.booster }] : []),
    ...(level.trappedGoal ? [{ key: "trapped", target: level.trappedGoal.target, value: progress.trapped, icon: GOAL_ICONS.trapped }] : []),
  ];

  useEffect(() => {
    pulse.value = withSequence(
      withTiming(1.06, { duration: 120, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 170, easing: Easing.out(Easing.quad) })
    );
  }, [progress.food, progress.boosters, progress.trapped, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <ImageBackground source={HEADER_BG} style={styles.headerBackground} imageStyle={styles.headerImage}>
        <Text style={styles.headingText}>LEVEL {level.id} GOAL</Text>
        <Text style={styles.levelName}>{level.name}</Text>
      </ImageBackground>

      <View style={styles.goalsContainer}>
        {rows.map((goal) => {
          const count = Math.min(goal.value, goal.target);
          return (
            <View key={goal.key} style={styles.goalRow}>
              <View style={styles.iconWrapper}>
                <Image source={goal.icon} style={styles.goalIcon} resizeMode="contain" />
              </View>
              <Text style={styles.counter}>
                {count}
                <Text style={styles.counterDivider}>/{goal.target}</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  headerBackground: {
    width: 220,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 4,
  },
  headerImage: {
    resizeMode: "stretch",
  },
  headingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  levelName: {
    color: "#FFF275",
    fontSize: 10,
    fontWeight: "800",
  },
  goalsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#D97706",
  },
  iconWrapper: {
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  goalIcon: {
    width: 24,
    height: 24,
  },
  counter: {
    color: "#78350F",
    fontSize: 15,
    fontWeight: "900",
  },
  counterDivider: {
    color: "#B45309",
    fontWeight: "700",
    fontSize: 13,
  },
});
