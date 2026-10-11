import re

file_path = "frontend/app/index.tsx"
with open(file_path, "r") as f:
    text = f.read()

# Candy Crush original 3D metallic buttons aligned on new road
replacement = '''const MAP_ROAD_POINTS = [
  { level: 1,  x: 64, y: 92 },
  { level: 2,  x: 58, y: 84 },
  { level: 3,  x: 43, y: 78 },
  { level: 4,  x: 28, y: 71 },
  { level: 5,  x: 21, y: 63 },
  { level: 6,  x: 24, y: 54 },
  { level: 7,  x: 36, y: 47 },
  { level: 8,  x: 52, y: 44 },
  { level: 9,  x: 72, y: 48 },
  { level: 10, x: 74, y: 39 },
  { level: 11, x: 62, y: 34 },
  { level: 12, x: 44, y: 29 },
  { level: 13, x: 38, y: 22 },
  { level: 14, x: 76, y: 15 },
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
                { translateX: -24 },
                { translateY: -24 },
                { scale: pressed && isUnlocked ? 0.92 : 1.0 },
              ],
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              zIndex: isCurrent ? 50 : 20,
            })}
          >
            {isCurrent && (
              <View
                style={{
                  position: "absolute",
                  top: -26,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 14,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  borderWidth: 2,
                  borderColor: "#E11D48",
                  elevation: 9,
                  zIndex: 60,
                }}
              >
                <Text style={{ fontSize: 18 }}>👑</Text>
              </View>
            )}

            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: "#4B5563",
                paddingBottom: 4,
                alignItems: "center",
                justifyContent: "center",
                elevation: isUnlocked ? 6 : 2,
                opacity: isUnlocked ? 1.0 : 0.65,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: "#E5E7EB",
                  borderWidth: 2.5,
                  borderColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#9CA3AF",
                    borderTopWidth: 2,
                    borderTopColor: "rgba(255,255,255,0.9)",
                    borderBottomWidth: 2,
                    borderBottomColor: "rgba(0,0,0,0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "900",
                      fontSize: 16,
                      textShadowColor: "rgba(0, 0, 0, 0.75)",
                      textShadowOffset: { width: 1, height: 1.5 },
                      textShadowRadius: 2,
                    }}
                  >
                    {pt.level}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};
'''

text = re.sub(r"const\s+MAP_ROAD_POINTS[\s\S]*?\];\s*", "", text)
text = re.sub(r"(?:export\s+)?const\s+LevelRoadMap\s*=[\s\S]*?\n\};\s*", "", text)

anchor = "if (screen === 'home')"
if anchor in text:
    text = text.replace(anchor, replacement + "\n\n" + anchor, 1)

with open(file_path, "w") as f:
    f.write(text)

print("SUCCESSFULLY_INSTALLED_ORIGINAL_BUTTONS")
