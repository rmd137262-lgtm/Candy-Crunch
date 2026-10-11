import re

file_path = "app/index.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Back Button ko update karna
old_btn_pattern = r'<Pressable[^>]*accessibilityLabel="Return to home screen"[^>]*>[\s\S]*?<\/Pressable>'
new_back_btn = '''<Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to home screen"
          onPress={() => { soundManager.playPop(); setScreen('home'); }}
          style={[styles.homeButton, { backgroundColor: "#FF3366", borderColor: "#FFF", borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 12, minWidth: 70, height: 38, borderRadius: 19 }]}
        >
          <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "900", marginRight: 4 }}>◀</Text>
          <Text style={{ color: "#FFF", fontSize: 13, fontWeight: "bold" }}>Back</Text>
        </Pressable>'''

content = re.sub(old_btn_pattern, new_back_btn, content)
print("✓ Back Button injected!")

# 2. Booster Bar create karna (Hand, Bomb, Energy)
booster_bar_jsx = '''
        {/* Bottom Booster / Power-up Bar */}
        <View style={{
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          width: "92%",
          maxWidth: 380,
          marginTop: 12,
          marginBottom: 10,
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: "rgba(20, 10, 40, 0.88)",
          borderRadius: 24,
          borderWidth: 2,
          borderColor: "#FFD700",
          alignSelf: "center",
        }}>
          {/* Booster 1: Haath ka panja */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              soundManager.playPop();
              alert("🖐️ Hand Booster: Kisi bhi do candies ko swap karein!");
            }}
            style={{ alignItems: "center", justifyContent: "center" }}
          >
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "#7B2CBF",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#E0AAFF",
            }}>
              <Text style={{ fontSize: 26 }}>🖐️</Text>
              <View style={{
                position: "absolute",
                top: -4,
                right: -4,
                backgroundColor: "#FF007F",
                borderRadius: 10,
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderWidth: 1,
                borderColor: "#FFF"
              }}>
                <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "bold" }}>3</Text>
              </View>
            </View>
            <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "bold", marginTop: 4 }}>Hand</Text>
          </TouchableOpacity>

          {/* Booster 2: Colour Bomb */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              soundManager.playBomb();
              alert("💣 Color Bomb: Ek color ki saari candies clear karein!");
            }}
            style={{ alignItems: "center", justifyContent: "center" }}
          >
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#D90429",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2.5,
              borderColor: "#FFD166",
            }}>
              <Text style={{ fontSize: 28 }}>💣</Text>
              <View style={{
                position: "absolute",
                top: -4,
                right: -4,
                backgroundColor: "#06D6A0",
                borderRadius: 10,
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderWidth: 1,
                borderColor: "#000"
              }}>
                <Text style={{ color: "#000", fontSize: 10, fontWeight: "bold" }}>2</Text>
              </View>
            </View>
            <Text style={{ color: "#FFD166", fontSize: 11, fontWeight: "900", marginTop: 4 }}>Bomb</Text>
          </TouchableOpacity>

          {/* Booster 3: Energy */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              soundManager.playLaser();
              alert("⚡ Energy Zap: Powerful line blast blast karein!");
            }}
            style={{ alignItems: "center", justifyContent: "center" }}
          >
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "#0077B6",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#90E0EF",
            }}>
              <Text style={{ fontSize: 26 }}>⚡</Text>
              <View style={{
                position: "absolute",
                top: -4,
                right: -4,
                backgroundColor: "#FFB703",
                borderRadius: 10,
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderWidth: 1,
                borderColor: "#FFF"
              }}>
                <Text style={{ color: "#000", fontSize: 10, fontWeight: "bold" }}>5</Text>
              </View>
            </View>
            <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "bold", marginTop: 4 }}>Energy</Text>
          </TouchableOpacity>
        </View>
'''

# Board ke container ke baad inject karna
needle = "{/* Level Complete"
if needle in content:
    content = content.replace(needle, booster_bar_jsx + "\n    " + needle)
    print("✓ Booster Bar added before modals!")
else:
    # Fallback to gameField container
    pattern_field = r'(<View style=\{styles\.gameField\}>[\s\S]*?<\/View>\s*<\/View>)'
    content = re.sub(pattern_field, r'\1' + booster_bar_jsx, content, count=1)
    print("✓ Booster Bar added after gameField!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("SUCCESS: Sabhi UI components lag chuke hain!")
