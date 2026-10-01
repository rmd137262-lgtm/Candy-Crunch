import { Image, type ImageSourcePropType, StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

const BOARD_SIZE = 7;
const CELL_STEP = 48;
const CELL_SIZE = 45;
const BOARD_WIDTH = (BOARD_SIZE - 1) * CELL_STEP + CELL_SIZE;

export type FoodFlightData = { id: number; index: number; icon: string };
export type LayoutPoint = { x: number; y: number; width: number; height: number };

export function FoodFlight({
  flight,
  board,
  goal,
}: {
  flight: FoodFlightData;
  board: LayoutPoint;
  goal: LayoutPoint;
}) {
  const progress = useSharedValue(0);
  const row = Math.floor(flight.index / BOARD_SIZE);
  const col = flight.index % BOARD_SIZE;
  const startX = board.x + 7 + col * CELL_STEP + CELL_SIZE / 2;
  const startY = board.y + 7 + row * CELL_STEP + CELL_SIZE / 2;
  const endX = goal.x + goal.width * 0.78;
  const endY = goal.y + goal.height / 2;

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 760, easing: Easing.out(Easing.cubic) });
  }, [flight.id, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.72, 1], [1, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: (endX - startX) * progress.value },
      { translateY: (endY - startY) * progress.value - Math.sin(progress.value * Math.PI) * 36 },
      { scale: interpolate(progress.value, [0, 0.65, 1], [1.1, 0.86, 0.5], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.foodFlight, { left: startX - 14, top: startY - 14 }, animatedStyle]}>
      <Text style={styles.foodFlightIcon}>{flight.icon}</Text>
    </Animated.View>
  );
}

export function BigBirdSweep({ eventId, source }: { eventId: number; source: ImageSourcePropType }) {
  const progress = useSharedValue(0);
  const flap = useSharedValue(1);

  useEffect(() => {
    if (eventId === 0) return;
    progress.value = 0;
    flap.value = 1;
    progress.value = withTiming(1, { duration: 760, easing: Easing.inOut(Easing.cubic) });
    flap.value = withRepeat(
      withSequence(
        withTiming(0.76, { duration: 95, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.2, { duration: 95, easing: Easing.inOut(Easing.quad) }),
      ),
      4,
      true,
    );
  }, [eventId, flap, progress]);

  const sweepStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 0.84, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-105, BOARD_WIDTH + 105]) },
      { translateY: interpolate(progress.value, [0, 0.22, 0.58, 1], [190, 15, 105, -70]) },
      { rotate: `${interpolate(progress.value, [0, 0.3, 0.72, 1], [-8, 6, -3, 8])}deg` },
      { scale: flap.value },
    ],
  }));

  if (eventId === 0) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.bigBird, sweepStyle]}>
      <Image source={source} resizeMode="contain" style={styles.bigBirdImage} />
      <Text style={styles.blastSpark}>✦</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  foodFlight: { position: "absolute", width: 28, height: 28, zIndex: 80, alignItems: "center", justifyContent: "center" },
  foodFlightIcon: { fontSize: 22, textShadowColor: "#FFFFFF", textShadowRadius: 8 },
  bigBird: { position: "absolute", top: 0, left: 0, width: 98, height: 98, zIndex: 60, alignItems: "center", justifyContent: "center" },
  bigBirdImage: { width: 92, height: 92 },
  blastSpark: { position: "absolute", right: 7, top: 7, color: "#FFE15C", fontSize: 30, fontWeight: "900", textShadowColor: "#FFFFFF", textShadowRadius: 10 },
});