import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";

import type { RevenueCatShopState, ShopProductId } from "@/src/billing/shopCatalog";

type ShopModalProps = {
  visible: boolean;
  outOfMoves: boolean;
  shop: RevenueCatShopState;
  busy: boolean;
  message: string;
  promoRedeemed: boolean;
  boosterCount: number;
  unlimitedLivesActive: boolean;
  onBuy: (id: ShopProductId) => void;
  onRedeem: (code: string) => void;
  onUseBooster: () => void;
  onTryAgain: () => void;
  onClose: () => void;
};

export default function ShopModal({
  visible,
  outOfMoves,
  shop,
  busy,
  message,
  promoRedeemed,
  boosterCount,
  unlimitedLivesActive,
  onBuy,
  onRedeem,
  onUseBooster,
  onTryAgain,
  onClose,
}: ShopModalProps) {
  const [promo, setPromo] = useState("");
  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(160)} style={styles.scrim}>
      <Animated.View entering={ZoomIn.duration(230)} style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerIcon}><Text style={styles.headerEmoji}>🪶</Text></View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{outOfMoves ? "LEVEL PAUSED" : "POWER UP YOUR FLOCK"}</Text>
            <Text style={styles.title}>{outOfMoves ? "Out of Moves!" : "Flock Shop"}</Text>
          </View>
          <Pressable accessibilityLabel="Close shop" onPress={onClose} style={styles.close}>
            <Ionicons name="close" size={20} color="#67417C" />
          </Pressable>
        </View>

        {outOfMoves ? (
          <Text style={styles.pauseMessage}>Get 5 Extra Moves to continue playing!</Text>
        ) : (
          <Text style={styles.subheading}>Choose a boost and get back to the birds.</Text>
        )}

        <ScrollView style={styles.offerList} contentContainerStyle={styles.offerListContent} showsVerticalScrollIndicator={false}>
          {shop.offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerIcon}><Text style={styles.offerEmoji}>{offer.icon}</Text></View>
              <View style={styles.offerCopy}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerDescription}>{offer.description}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => onBuy(offer.id)}
                style={({ pressed }) => [styles.buyButton, pressed && styles.pressed, busy && styles.disabled]}
              >
                <Text style={styles.price}>{offer.price}</Text>
                <Text style={styles.buyText}>{busy ? "WAIT…" : "BUY"}</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {shop.message ? (
          <View style={styles.setupNotice}>
            <Ionicons name="information-circle-outline" size={17} color="#8458A5" />
            <Text style={styles.setupText}>{shop.message}</Text>
          </View>
        ) : null}

        {outOfMoves && boosterCount > 0 ? (
          <Pressable onPress={onUseBooster} style={({ pressed }) => [styles.boosterButton, pressed && styles.pressed]}>
            <Text style={styles.boosterText}>USE BAGULA BLAST  ·  {boosterCount} LEFT</Text>
            <Ionicons name="flash" size={17} color="#FFFFFF" />
          </Pressable>
        ) : null}

        {outOfMoves ? (
          <Pressable onPress={onTryAgain} style={styles.tryAgain}>
            <Text style={styles.tryAgainText}>{unlimitedLivesActive ? "RETRY LEVEL · FREE LIFE ACTIVE" : "TRY AGAIN"}</Text>
          </Pressable>
        ) : null}

        <View style={styles.promoSection}>
          <Text style={styles.promoLabel}>JUDGE / TEST PROMO CODE</Text>
          <View style={styles.promoRow}>
            <TextInput
              accessibilityLabel="Redeem promo code"
              autoCapitalize="characters"
              editable={!promoRedeemed && !busy}
              onChangeText={setPromo}
              onSubmitEditing={() => onRedeem(promo)}
              placeholder="Enter promo code"
              placeholderTextColor="#AA98B5"
              returnKeyType="done"
              style={styles.promoInput}
              value={promo}
            />
            <Pressable disabled={promoRedeemed || busy || !promo.trim()} onPress={() => onRedeem(promo)} style={[styles.redeemButton, (promoRedeemed || !promo.trim()) && styles.disabled]}>
              <Text style={styles.redeemText}>{promoRedeemed ? "USED" : "REDEEM"}</Text>
            </Pressable>
          </View>
          <Text style={styles.promoHint}>SHIPATON2026 grants test moves and boosters on this device.</Text>
          {message ? <Text accessibilityLiveRegion="polite" style={styles.statusText}>{message}</Text> : null}
        </View>

        <Text style={styles.legal}>Purchases are processed securely by RevenueCat. Promo rewards are for judge testing only.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, zIndex: 110, backgroundColor: "#21093BCC", alignItems: "center", justifyContent: "center", padding: 16 },
  sheet: { width: "100%", maxWidth: 440, maxHeight: "94%", borderRadius: 28, backgroundColor: "#FFFDFE", paddingHorizontal: 19, paddingTop: 18, paddingBottom: 14, shadowColor: "#18052A", shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  headerIcon: { width: 45, height: 45, borderRadius: 16, backgroundColor: "#F1E5FA", alignItems: "center", justifyContent: "center" },
  headerEmoji: { fontSize: 23 },
  headerCopy: { flex: 1 },
  eyebrow: { color: "#A07CB5", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#41205E", fontSize: 25, fontWeight: "900", marginTop: 2 },
  close: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#F4EFF7", alignItems: "center", justifyContent: "center" },
  pauseMessage: { color: "#7C527E", fontSize: 13, lineHeight: 19, fontWeight: "700", marginTop: 10 },
  subheading: { color: "#8A7696", fontSize: 12, marginTop: 10 },
  offerList: { flexGrow: 0, marginTop: 13 },
  offerListContent: { gap: 8, paddingBottom: 2 },
  offerCard: { minHeight: 72, borderRadius: 17, borderWidth: 1, borderColor: "#EFE6F4", backgroundColor: "#FFFEFF", padding: 9, flexDirection: "row", alignItems: "center", gap: 9 },
  offerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFF2D0", alignItems: "center", justifyContent: "center" },
  offerEmoji: { fontSize: 22 },
  offerCopy: { flex: 1 },
  offerTitle: { color: "#462660", fontSize: 12, fontWeight: "900" },
  offerDescription: { color: "#927DA0", fontSize: 10, lineHeight: 14, marginTop: 3 },
  buyButton: { minWidth: 72, minHeight: 46, borderRadius: 13, backgroundColor: "#713AA9", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  price: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  buyText: { color: "#EBD9F9", fontSize: 8, letterSpacing: 1.2, fontWeight: "900", marginTop: 2 },
  setupNotice: { flexDirection: "row", alignItems: "flex-start", gap: 7, backgroundColor: "#F6F0FA", borderRadius: 12, padding: 9, marginTop: 9 },
  setupText: { flex: 1, color: "#76578C", fontSize: 10, lineHeight: 14 },
  boosterButton: { minHeight: 42, borderRadius: 14, backgroundColor: "#D94F77", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 9 },
  boosterText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  tryAgain: { minHeight: 35, alignItems: "center", justifyContent: "center", marginTop: 4 },
  tryAgainText: { color: "#795394", fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  promoSection: { borderTopWidth: 1, borderTopColor: "#F0E9F4", marginTop: 8, paddingTop: 10 },
  promoLabel: { color: "#9A7AAA", fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginBottom: 6 },
  promoRow: { flexDirection: "row", gap: 8 },
  promoInput: { minWidth: 0, flex: 1, height: 40, borderWidth: 1, borderColor: "#E8DDEC", borderRadius: 12, paddingHorizontal: 12, color: "#49295E", fontSize: 12, fontWeight: "700" },
  redeemButton: { minWidth: 83, borderRadius: 12, backgroundColor: "#F4CC60", alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  redeemText: { color: "#573479", fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  promoHint: { color: "#A28FAE", fontSize: 9, marginTop: 5 },
  statusText: { color: "#7D488E", fontSize: 10, fontWeight: "800", marginTop: 5 },
  legal: { color: "#B0A2B9", fontSize: 8, lineHeight: 11, textAlign: "center", marginTop: 8 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.55 },
});