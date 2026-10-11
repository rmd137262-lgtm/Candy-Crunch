import re

file_path = "frontend/app/index.tsx"
with open(file_path, "r") as f:
    text = f.read()

# Candy Road ke curve ke hisaab se exact surface points
# scale factor se door wale chote aur paas wale bade lagenge taaki hawa me na tairte lagein
perfect_grounded_code = """const LEVEL_BUTTON_IMG = require('../assets/images/level_button_base.png');

interface RoadPoint {
  level: number;
  x: number;
  y: number;
  scale: number;
}

const MAP_ROAD_POINTS: RoadPoint[] = [
  { level: 1,  x: 64, y: 91, scale: 1.05 },
  { level: 2,  x: 58, y: 83, scale: 1.0 },
  { level: 3,  x: 43, y: 77, scale: 0.95 },
  { level: 4,  x: 32, y: 70, scale: 0.92 },
  { level: 5,  x: 21, y: 64, scale: 0.88 },
  { level: 6,  x: 26, y: 55, scale: 0.85 },
  { level: 7,  x: 39, y: 49, scale: 0.82 },
  { level: 8,  x: 53, y: 45, scale: 0.80 },
  { level: 9,  x: 69, y: 44, scale: 0.78 },
  { level: 10, x: 74, y: 37, scale: 0.75 },
  { level: 11, x: 62, y: 31, scale: 0.72 },
  { level: 12, x: 44, y: 26, scale: 0.70 },
  { level: 13, x: 34, y: 20, scale: 0.68 },
  { level: 14, x: 42, y: 13, scale: 0.65 },
];

const LevelRoadMap = ({
  unlockedLevel = 1,
  onSelectLevel,
}: {
  unlockedLevel: number;
  onSelectLevel: (lvl: number) => void;
}) => {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {MAP_ROAD_POINTS.map((pt) => {
        const isUnlocked = pt.level <= unlockedLevel;
        const isCurrent = pt.level === unlockedLevel;
        const btnSize = 46 * pt.scale;

        return (
          <Pressable
            key={`candy-btn-${pt.level}`}
            disabled={!isUnlocked}
            onPress={() => {
              if (isUnlocked) onSelectLevel(pt.level);
            }}
            style={({ pressed }) => ({
              position: "absolute",
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              transform: [
                { translateX: -btnSize / 2 },
                { translateY: -btnSize / 2 },
                { scale: pressed && isUnlocked ? 0.92 : 1.0 },
              ],
              alignItems: "center",
              justifyContent: "center",
              width: btnSize,
              height: btnSize,
              zIndex: isCurrent ? 50 : 20,
            })}
          >
            {/* 1. Road Surface Contact Shadow - Button ko zameen par chipkane ke liye */}
            <View
              style={{
                position: "absolute",
                bottom: -4 * pt.scale,
                width: btnSize * 0.95,
                height: btnSize * 0.38,
                borderRadius: btnSize * 0.5,
                backgroundColor: "rgba(

cat << 'EOF' > fix_grounded_buttons.py
import re

file_path = "frontend/app/index.tsx"
with open(file_path, "r") as f:
    text = f.read()

# Candy Road ke curve ke hisaab se exact surface points
# scale factor se door wale chote aur paas wale bade lagenge taaki hawa me na tairte lagein
perfect_grounded_code = """const LEVEL_BUTTON_IMG = require('../assets/images/level_button_base.png');

interface RoadPoint {
  level: number;
  x: number;
  y: number;
  scale: number;
}

const MAP_ROAD_POINTS: RoadPoint[] = [
  { level: 1,  x: 64, y: 91, scale: 1.05 },
  { level: 2,  x: 58, y: 83, scale: 1.0 },
  { level: 3,  x: 43, y: 77, scale: 0.95 },
  { level: 4,  x: 32, y: 70, scale: 0.92 },
  { level: 5,  x: 21, y: 64, scale: 0.88 },
  { level: 6,  x: 26, y: 55, scale: 0.85 },
  { level: 7,  x: 39, y: 49, scale: 0.82 },
  { level: 8,  x: 53, y: 45, scale: 0.80 },
  { level: 9,  x: 69, y: 44, scale: 0.78 },
  { level: 10, x: 74, y: 37, scale: 0.75 },
  { level: 11, x: 62, y: 31, scale: 0.72 },
  { level: 12, x: 44, y: 26, scale: 0.70 },
  { level: 13, x: 34, y: 20, scale: 0.68 },
  { level: 14, x: 42, y: 13, scale: 0.65 },
];

const LevelRoadMap = ({
  unlockedLevel = 1,
  onSelectLevel,
}: {
  unlockedLevel: number;
  onSelectLevel: (lvl: number) => void;
}) => {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {MAP_ROAD_POINTS.map((pt) => {
        const isUnlocked = pt.level <= unlockedLevel;
        const isCurrent = pt.level === unlockedLevel;
        const btnSize = 46 * pt.scale;

        return (
          <Pressable
            key={`candy-btn-${pt.level}`}
            disabled={!isUnlocked}
            onPress={() => {
              if (isUnlocked) onSelectLevel(pt.level);
            }}
            style={({ pressed }) => ({
              position: "absolute",
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              transform: [
                { translateX: -btnSize / 2 },
                { translateY: -btnSize / 2 },
                { scale: pressed && isUnlocked ? 0.92 : 1.0 },
              ],
              alignItems: "center",
              justifyContent: "center",
              width: btnSize,
              height: btnSize,
              zIndex: isCurrent ? 50 : 20,
            })}
          >
            {/* 1. Road Surface Contact Shadow - Button ko zameen par chipkane ke liye */}
            <View
              style={{
                position: "absolute",
                bottom: -4 * pt.scale,
                width: btnSize * 0.95,
                height: btnSize * 0.38,
                borderRadius: btnSize * 0.5,
                backgroundColor: "rgba(

cat << 'EOF' > fix_grounded_buttons.py
import re

file_path = "frontend/app/index.tsx"
with open(file_path, "r") as f:
    text = f.read()

# Candy Road ke curve ke hisaab se exact surface points
# scale factor se door wale chote aur paas wale bade lagenge taaki hawa me na tairte lagein
perfect_grounded_code = """const LEVEL_BUTTON_IMG = require('../assets/images/level_button_base.png');

interface RoadPoint {
  level: number;
  x: number;
  y: number;
  scale: number;
}

const MAP_ROAD_POINTS: RoadPoint[] = [
  { level: 1,  x: 64, y: 91, scale: 1.05 },
  { level: 2,  x: 58, y: 83, scale: 1.0 },
  { level: 3,  x: 43, y: 77, scale: 0.95 },
  { level: 4,  x: 32, y: 70, scale: 0.92 },
  { level: 5,  x: 21, y: 64, scale: 0.88 },
  { level: 6,  x: 26, y: 55, scale: 0.85 },
  { level: 7,  x: 39, y: 49, scale: 0.82 },
  { level: 8,  x: 53, y: 45, scale: 0.80 },
  { level: 9,  x: 69, y: 44, scale: 0.78 },
  { level: 10, x: 74, y: 37, scale: 0.75 },
  { level: 11, x: 62, y: 31, scale: 0.72 },
  { level: 12, x: 44, y: 26, scale: 0.70 },
  { level: 13, x: 34, y: 20, scale: 0.68 },
  { level: 14, x: 42, y: 13, scale: 0.65 },
];

const LevelRoadMap = ({
  unlockedLevel = 1,
  onSelectLevel,
}: {
  unlockedLevel: number;
  onSelectLevel: (lvl: number) => void;
}) => {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {MAP_ROAD_POINTS.map((pt) => {
        const isUnlocked = pt.level <= unlockedLevel;
        const isCurrent = pt.level === unlockedLevel;
        const btnSize = 46 * pt.scale;

        return (
          <Pressable
            key={`candy-btn-${pt.level}`}
            disabled={!isUnlocked}
            onPress={() => {
              if (isUnlocked) onSelectLevel(pt.level);
            }}
            style={({ pressed }) => ({
              position: "absolute",
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              transform: [
                { translateX: -btnSize / 2 },
                { translateY: -btnSize / 2 },
                { scale: pressed && isUnlocked ? 0.92 : 1.0 },
              ],
              alignItems: "center",
              justifyContent: "center",
              width: btnSize,
              height: btnSize,
              zIndex: isCurrent ? 50 : 20,
            })}
          >
            {/* 1. Road Surface Contact Shadow - Button ko zameen par chipkane ke liye */}
            <View
              style={{
                position: "absolute",
                bottom: -4 * pt.scale,
                width: btnSize * 0.95,
                height: btnSize * 0.38,
                borderRadius: btnSize * 0.5,
                backgroundColor: "rgba(0, 0, 0, 0.35)",
                transform: [{ scaleY: 0.6 }],
                zIndex: -1,
              }}
            />

            {/* 2. Active Level Crown Marker */}
            {isCurrent && (
              <View
                style={{
                  position: "absolute",
                  top: -24 * pt.scale,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  borderWidth: 2,
                  borderColor: "#E11D48",
                  elevation: 8,
                  zIndex: 60,
                }}
              >
                <Text style={{ fontSize: 16 * pt.scale }}>👑</Text>
              </View>
            )}

            {/* 3. Button Body - Tilted 3D Ground Perspective */}
            <View
              style={{
                width: btnSize,
                height: btnSize,
                alignItems: "center",
                justifyContent: "center",
                opacity: isUnlocked ? 1.0 : 0.65,
              }}
            >
              <Image
                source={LEVEL_BUTTON_IMG}
                style={{
                  width: btnSize,
                  height: btnSize,
                  position: "absolute",
                }}
                resizeMode="contain"
              />

              {/* Center Level Number */}
              {isUnlocked && (
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "900",
                    fontSize: 16 * pt.scale,
                    textShadowColor: "rgba(0, 0, 0, 0.8)",
                    textShadowOffset: { width: 1, height: 1.5 },
                    textShadowRadius: 2,
                  }}
                >
                  {pt.level}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};"""

text = re.sub(r"const\s+LEVEL_BUTTON_IMG\s*=[\s\S]*?(?:export\s+)?const\s+LevelRoadMap\s*=[\s\S]*?\n\};\s*", "", text)
text = re.sub(r"const\s+MAP_ROAD_POINTS[\s\S]*?\];\s*", "", text)
text = re.sub(r"interface\s+RoadPoint[\s\S]*?\}", "", text)

anchor = "if (screen === 'home')"
if anchor in text:
    text = text.replace(anchor, perfect_grounded_code + "\n\n" + anchor, 1)

with open(file_path, "w") as f:
    f.write(text)

print("BUTTONS_PERFECTLY_GROUNDED_ON_ROAD!")
