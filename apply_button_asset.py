import re

file_path = "frontend/app/index.tsx"
with open(file_path, "r") as f:
    text = f.read()

# 1. Level button image require statement add karna
img_require = "const LEVEL_BUTTON_IMG = require('../assets/images/level_button_base.png');"

# 2. Map component with the actual 3D image asset and centered level text
new_map_code = f"""{img_require}

const MAP_ROAD_POINTS = [
  {{ level: 1,  x: 64, y: 92 }},
  {{ level: 2,  x: 58, y: 84 }},
  {{ level: 3,  x: 43, y: 78 }},
  {{ level: 4,  x: 28, y: 71 }},
  {{ level: 5,  x: 21, y: 63 }},
  {{ level: 6,  x: 24, y: 54 }},
  {{ level: 7,  x: 36, y: 47 }},
  {{ level: 8,  x: 52, y: 44 }},
  {{ level: 9,  x: 72, y: 48 }},
  {{ level: 10, x: 74, y: 39 }},
  {{ level: 11, x: 62, y: 34 }},
  {{ level: 12, x: 44, y: 29 }},
  {{ level: 13, x: 38, y: 22 }},
  {{ level: 14, x: 76, y: 15 }},
];

const LevelRoadMap = ({{
  unlockedLevel = 1,
  onSelectLevel,
}}: {{
  unlockedLevel: number;
  onSelectLevel: (lvl: number) => void;
}}) => {{
  return (
    <View style={{StyleSheet.absoluteFillObject}} pointerEvents="box-none">
      {{MAP_ROAD_POINTS.map((pt) => {{
        const isUnlocked = pt.level <= unlockedLevel;
        const isCurrent = pt.level === unlockedLevel;

        return (
          <Pressable
            key={{`candy-btn-${{pt.level}}`}}
            disabled={{!isUnlocked}}
            onPress={{() => {{
              if (isUnlocked) onSelectLevel(pt.level);
            }}}}
            style={{({{ pressed }}) => ({{
              position: "absolute",
              left: `${{pt.x}}%`,
              top: `${{pt.y}}%`,
              transform: [
                {{ translateX: -24 }},
                {{ translateY: -24 }},
                {{ scale: pressed && isUnlocked ? 0.92 : 1.0 }},
              ],
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              zIndex: isCurrent ? 50 : 20,
            }})}}
          >
            {{/* Active Level Indicator */}}
            {{isCurrent && (
              <View
                style={{{{
                  position: "absolute",
                  top: -24,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  borderWidth: 2,
                  borderColor: "#E11D48",
                  elevation: 8,
                  zIndex: 60,
                }}}}
              >
                <Text style={{{{ fontSize: 16 }}}}>👑</Text>
              </View>
            )}}

            {{/* Original 3D Button Asset */}}
            <View
              style={{{{
                width: 46,
                height: 46,
                alignItems: "center",
                justifyContent: "center",
                opacity: isUnlocked ? 1.0 : 0.6,
              }}}}
            >
              <Image
                source={{LEVEL_BUTTON_IMG}}
                style={{{{
                  width: 46,
                  height: 46,
                  position: "absolute",
                }}}}
                resizeMode="contain"
              />

              {{/* Centered Level Number */}}
              {{isUnlocked ? (
                <Text
                  style={{{{
                    color: "#FFFFFF",
                    fontWeight: "900",
                    fontSize: 16,
                    textShadowColor: "rgba(0, 0, 0, 0.8)",
                    textShadowOffset: {{ width: 1, height: 1.5 }},
                    textShadowRadius: 2,
                  }}}}
                >
                  {{pt.level}}
                </Text>
              ) : (
                <View
                  style={{{{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                  }}}}
                />
              )}}
            </View>
          </Pressable>
        );
      }})}}
    </View>
  );
}};
"""

# Purane map definitions clean karna
text = re.sub(r"const\s+LEVEL_BUTTON_IMG\s*=.*?;", "", text)
text = re.sub(r"const\s+MAP_ROAD_POINTS[\s\S]*?\];\s*", "", text)
text = re.sub(r"(?:export\s+)?const\s+LevelRoadMap\s*=[\s\S]*?\n\};\s*", "", text)

# Home screen se pehle add karna
target = "if (screen === 'home')"
if target in text:
    text = text.replace(target, new_map_code + "\n\n" + target, 1)

with open(file_path, "w") as f:
    f.write(text)

print("LEVEL_BUTTON_ASSET_INTEGRATED_SUCCESSFULLY!")
