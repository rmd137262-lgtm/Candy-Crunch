import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  ImageBackground,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface HomeScreenProps {
  onPlay: (level?: number) => void;
}

const TOTAL_LEVELS = [
  { level: 10, stars: 0, locked: true },
  { level: 9, stars: 0, locked: true },
  { level: 8, stars: 0, locked: true },
  { level: 7, stars: 0, locked: true },
  { level: 6, stars: 0, locked: true },
  { level: 5, stars: 0, locked: true },
  { level: 4, stars: 0, locked: true },
  { level: 3, stars: 0, locked: true },
  { level: 2, stars: 2, locked: false },
  { level: 1, stars: 3, locked: false },
];

export default function HomeScreen({ onPlay }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<"map" | "events" | "friends" | "shop">("map");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [bgmMuted, setBgmMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);

  const currentUnlocked = 2;

  // Gentle wave curve for the road alignment
  const getOffset = (idx: number) => {
    const curve = [25, -20, -40, -15, 20, 40, 18, -18, -35, 0];
    return curve[idx % curve.length];
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* 1. TOP CANDY HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          {/* Hearts / Lives */}
          <View style={styles.pillCard}>
            <Ionicons name="heart" size={17} color="#FF1E6D" />
            <Text style={styles.pillNum}>5</Text>
            <Text style={styles.pillMuted}>Full</Text>
          </View>

          {/* Gold Bars */}
          <View style={[styles.pillCard, { marginLeft: 8 }]}>
            <Ionicons name="sparkles" size={15} color="#FFA000" />
            <Text style={styles.pillNum}>40</Text>
          </View>
        </View>

        {/* Settings ⚙️ Button */}
        <TouchableOpacity
          style={styles.settingsIconBtn}
          onPress={() => setSettingsVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-sharp" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* 2. MAIN BODY (MAP OR SHOP) */}
      {activeTab === "map" ? (
        <ImageBackground
        source={{ uri: "https://picsum.photos/800/1600" }}
          
          
          
          style={styles.mapBackground}
          resizeMode="cover"
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {TOTAL_LEVELS.map((item, index) => {
              const isCurrent = item.level === currentUnlocked;
              const isLocked = item.locked;
              const xShift = getOffset(index);

              return (
                <View
                  key={item.level}
                  style={[
                    styles.nodeRow,
                    { transform: [{ translateX: xShift }] },
                  ]}
                >
                  {/* Subtle Stepping Connector */}
                  {index < TOTAL_LEVELS.length - 1 && (
                    <View style={styles.trailConnector} />
                  )}

                  {/* Level Button */}
                  <TouchableOpacity
                    style={[
                      styles.nodeCircle,
                      isLocked ? styles.nodeLocked : styles.nodePassed,
                      isCurrent && styles.nodeActive,
                    ]}
                    disabled={isLocked}
                    onPress={() => onPlay(item.level)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.shineCap} />

                    {isLocked ? (
                      <Ionicons name="lock-closed" size={15} color="#8A99AD" />
                    ) : (
                      <>
                        {!isCurrent && (
                          <View style={styles.crownTop}>
                            <Ionicons name="ribbon" size={11} color="#FFD700" />
                          </View>
                        )}

                        <Text style={styles.levelNumber}>{item.level}</Text>

                        {/* 3 Gold Stars */}
                        <View style={styles.starRow}>
                          {[1, 2, 3].map((s) => (
                            <Ionicons
                              key={s}
                              name={s <= item.stars ? "star" : "star-outline"}
                              size={8}
                              color={s <= item.stars ? "#FFE814" : "#FFF"}
                            />
                          ))}
                        </View>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Current Active Indicator */}
                  {isCurrent && (
                    <View style={styles.activeTag}>
                      <Text style={styles.activeTagText}>PLAY</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </ImageBackground>
      ) : activeTab === "shop" ? (
        /* SHOP SCREEN */
        <ScrollView style={styles.shopContainer} showsVerticalScrollIndicator={false}>
          {/* Weekly Deal Card */}
          <View style={styles.dealCard}>
            <View style={styles.dealContentRow}>
              <View style={styles.itemBox}>
                <Ionicons name="sparkles" size={28} color="#FFB800" />
                <Text style={styles.itemQuantity}>10</Text>
              </View>
              <View style={styles.dealRight}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-50%</Text>
                </View>
                <TouchableOpacity style={styles.priceBtn}>
                  <Text style={styles.priceBtnText}>₹20.00</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.dealTitle}>Weekly Deal</Text>
          </View>

          {/* Daily Deal Combo Card */}
          <View style={[styles.dealCard, styles.dailyCard]}>
            <View style={styles.dailyTimerRow}>
              <Ionicons name="time-outline" size={14} color="#D97706" />
              <Text style={styles.timerText}>08h 38m</Text>
            </View>
            <View style={styles.dealContentRow}>
              <View style={styles.comboItem}>
                <Ionicons name="sparkles" size={24} color="#FFB800" />
                <Text style={styles.comboQty}>10</Text>
              </View>
              <View style={styles.comboItem}>
                <Ionicons name="disc" size={24} color="#EC4899" />
                <Text style={styles.comboQty}>x1</Text>
              </View>
              <View style={styles.comboItem}>
                <Ionicons name="heart" size={24} color="#EF4444" />
                <Text style={styles.comboQty}>15m</Text>
              </View>
              <TouchableOpacity style={[styles.priceBtn, { marginTop: 10 }]}>
                <Text style={styles.priceBtnText}>₹70.00</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular Daily Deal</Text>
            </View>
          </View>

          {/* Gold Packs Grid */}
          <View style={styles.goldGrid}>
            <View style={styles.goldPackCard}>
              <Ionicons name="sparkles" size={28} color="#FFB800" />
              <Text style={styles.goldCount}>10</Text>
              <TouchableOpacity style={styles.smallPriceBtn}>
                <Text style={styles.priceBtnText}>₹35.00</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.goldPackCard}>
              <Ionicons name="sparkles" size={34} color="#F59E0B" />
              <Text style={styles.goldCount}>50</Text>
              <TouchableOpacity style={styles.smallPriceBtn}>
                <Text style={styles.priceBtnText}>₹140.00</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* More Offers Button */}
          <TouchableOpacity style={styles.moreOffersBtn}>
            <Text style={styles.moreOffersText}>More Offers +</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.centerTabScreen}>
          <Text style={styles.placeholderTabHeading}>{activeTab.toUpperCase()}</Text>
          <Text style={styles.placeholderTabSub}>Event updates coming soon!</Text>
        </View>
      )}

      {/* 3. BOTTOM CANDY BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("map")}
        >
          <View
            style={[
              styles.tabIconBg,
              activeTab === "map" && { backgroundColor: "#00B4D8" },
            ]}
          >
            <Ionicons
              name="map"
              size={17}
              color={activeTab === "map" ? "#FFF" : "#777"}
            />
          </View>
          <Text style={activeTab === "map" ? styles.tabTextSelected : styles.tabText}>
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("events")}
        >
          <View
            style={[
              styles.tabIconBg,
              activeTab === "events" && { backgroundColor: "#00B4D8" },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={17}
              color={activeTab === "events" ? "#FFF" : "#777"}
            />
          </View>
          <Text style={activeTab === "events" ? styles.tabTextSelected : styles.tabText}>
            Events
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("friends")}
        >
          <View
            style={[
              styles.tabIconBg,
              activeTab === "friends" && { backgroundColor: "#00B4D8" },
            ]}
          >
            <Ionicons
              name="people-outline"
              size={17}
              color={activeTab === "friends" ? "#FFF" : "#777"}
            />
          </View>
          <Text style={activeTab === "friends" ? styles.tabTextSelected : styles.tabText}>
            Friends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("shop")}
        >
          <View
            style={[
              styles.tabIconBg,
              activeTab === "shop" && { backgroundColor: "#FF3366" },
            ]}
          >
            <Ionicons
              name="cart"
              size={17}
              color={activeTab === "shop" ? "#FFF" : "#777"}
            />
          </View>
          <Text style={activeTab === "shop" ? styles.tabTextSelected : styles.tabText}>
            Shop
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. SETTINGS MODAL */}
      <Modal visible={settingsVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#888" />
              </TouchableOpacity>
            </View>

            {/* BGM Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <Ionicons name="musical-notes" size={20} color="#E11D48" />
                <Text style={styles.settingLabel}>Music</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  bgmMuted ? styles.toggleOff : styles.toggleOn,
                ]}
                onPress={() => setBgmMuted(!bgmMuted)}
              >
                <Text style={styles.toggleText}>{bgmMuted ? "OFF" : "ON"}</Text>
              </TouchableOpacity>
            </View>

            {/* SFX Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <Ionicons name="volume-high" size={20} color="#F59E0B" />
                <Text style={styles.settingLabel}>Sound FX</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  sfxMuted ? styles.toggleOff : styles.toggleOn,
                ]}
                onPress={() => setSfxMuted(!sfxMuted)}
              >
                <Text style={styles.toggleText}>{sfxMuted ? "OFF" : "ON"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FCE4EC",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FF5E98",
    borderBottomWidth: 3,
    borderBottomColor: "#E0407B",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  pillCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#F48FB1",
    gap: 4,
  },
  pillNum: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#222",
  },
  pillMuted: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888",
    marginLeft: 3,
  },
  settingsIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF2A7A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  mapBackground: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingVertical: 32,
    alignItems: "center",
  },
  nodeRow: {
    alignItems: "center",
    marginVertical: 12,
  },
  trailConnector: {
    position: "absolute",
    top: 40,
    width: 5,
    height: 26,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    zIndex: -1,
  },
  nodeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  shineCap: {
    position: "absolute",
    top: 2,
    width: 20,
    height: 7,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  crownTop: {
    position: "absolute",
    top: -6,
  },
  nodePassed: {
    backgroundColor: "#FFA000",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  nodeActive: {
    backgroundColor: "#E91E63",
    borderWidth: 3.5,
    borderColor: "#FFEB3B",
    transform: [{ scale: 1.15 }],
  },
  nodeLocked: {
    backgroundColor: "#CAD4E0",
    borderWidth: 2.5,
    borderColor: "#E2E8F0",
  },
  levelNumber: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  starRow: {
    flexDirection: "row",
    marginTop: 1,
    gap: 0.5,
  },
  activeTag: {
    position: "absolute",
    top: -9,
    backgroundColor: "#00C853",
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  activeTagText: {
    fontSize: 7.5,
    fontWeight: "900",
    color: "#FFF",
  },

  /* Shop Screen */
  shopContainer: {
    flex: 1,
    backgroundColor: "#EDE9FE",
    padding: 14,
  },
  dealCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#FDE68A",
  },
  dailyCard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
  },
  dealContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemBox: {
    alignItems: "center",
  },
  itemQuantity: {
    fontWeight: "bold",
    color: "#92400E",
  },
  dealRight: {
    alignItems: "flex-end",
  },
  discountBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  discountText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 10,
  },
  priceBtn: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
  },
  priceBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  dealTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "800",
    color: "#D97706",
  },
  dailyTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  timerText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#D97706",
  },
  comboItem: {
    alignItems: "center",
  },
  comboQty: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#475569",
    marginTop: 2,
  },
  popularBadge: {
    marginTop: 8,
  },
  popularText: {
    color: "#DB2777",
    fontWeight: "900",
    fontSize: 13,
  },
  goldGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  goldPackCard: {
    width: "48%",
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "#FDE68A",
  },
  goldCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#78350F",
    marginVertical: 6,
  },
  smallPriceBtn: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  moreOffersBtn: {
    backgroundColor: "#EC4899",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#F472B6",
  },
  moreOffersText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 15,
  },
  centerTabScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
  },
  placeholderTabHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7E22CE",
  },
  placeholderTabSub: {
    color: "#6B7280",
    marginTop: 4,
  },

  /* Bottom Bar */
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FF5E98",
    paddingVertical: 5,
    borderTopWidth: 3,
    borderTopColor: "#E0407B",
  },
  tabItem: {
    alignItems: "center",
  },
  tabIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  tabText: {
    color: "#FFF",
    fontSize: 9.5,
    fontWeight: "600",
    marginTop: 2,
  },
  tabTextSelected: {
    color: "#FFE600",
    fontSize: 9.5,
    fontWeight: "900",
    marginTop: 2,
  },

  /* Settings Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  settingsCard: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  settingRowLeft: {
    flexDirection
    : "row",
    alignItems: "center",
    gap: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleOn: {
    backgroundColor: "#16A34A",
  },
  toggleOff: {
    backgroundColor: "#94A3B8",
  },
  toggleText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
});
