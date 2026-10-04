import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { LevelConfig } from '../../game/levels';
import type { BoosterType } from '../../game/engine';
import type { PlayerState } from '../../game/gameState';

type BoosterKey = Exclude<BoosterType, 'extraMoves'>;

const BOOSTERS: { id: BoosterKey; icon: string; title: string }[] = [
  { id: 'hammer', icon: '🍭', title: 'Hammer' },
  { id: 'striped', icon: '🪄', title: 'Striped candy' },
  { id: 'colorBomb', icon: '🌈', title: 'Color bomb' },
];

const objectiveIcon = (type: string) => {
  if (type === 'break_wood') return '🟫';
  if (type === 'clear_jelly') return '🧊';
  if (type === 'rescue_bears') return '🐻';
  return '⭐';
};

type Props = {
  visible: boolean;
  level: LevelConfig;
  inventory: PlayerState['boosters'];
  selected: BoosterKey[];
  onToggle: (booster: BoosterKey) => void;
  onStart: () => void;
  onClose: () => void;
};

export default function LevelStartModal({
  visible,
  level,
  inventory,
  selected,
  onToggle,
  onStart,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <View style={styles.titlePlate}>
            <Text style={styles.title}>Level {level.id}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close level preview" onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          <View style={styles.objectives}>
            {level.targets.map((target) => (
              <View key={target.type} style={styles.objective}>
                <Text style={styles.objectiveIcon}>{objectiveIcon(target.type)}</Text>
                <Text style={styles.objectiveCount}>{target.count}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>SELECT BOOSTERS</Text>
          <View style={styles.boosterRow}>
            {BOOSTERS.map((booster) => {
              const count = inventory[booster.id];
              const isSelected = selected.includes(booster.id);
              return (
                <Pressable
                  key={booster.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${booster.title}, ${count} available`}
                  accessibilityState={{ selected: isSelected, disabled: count < 1 }}
                  disabled={count < 1}
                  onPress={() => onToggle(booster.id)}
                  style={[styles.booster, isSelected && styles.boosterSelected, count < 1 && styles.boosterDisabled]}
                >
                  <Text style={styles.boosterIcon}>{booster.icon}</Text>
                  <View style={styles.countBadge}><Text style={styles.countText}>{count}</Text></View>
                  {isSelected ? <View style={styles.check}><Text style={styles.checkText}>✓</Text></View> : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.moves}>{level.moves} moves</Text>
          <Pressable accessibilityRole="button" onPress={onStart} style={({ pressed }) => [styles.play, pressed && styles.pressed]}>
            <Text style={styles.playText}>PLAY</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(25, 16, 24, 0.76)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  card: { width: '100%', maxWidth: 400, borderWidth: 5, borderColor: '#F5C77A', borderRadius: 38, backgroundColor: '#0BA798', padding: 22, paddingTop: 78, alignItems: 'center', shadowColor: '#25121A', shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 18 },
  titlePlate: { position: 'absolute', top: -18, left: 30, right: 30, height: 78, borderRadius: 34, borderWidth: 5, borderColor: '#F5C77A', backgroundColor: '#087F77', alignItems: 'center', justifyContent: 'center', shadowColor: '#543322', shadowOpacity: 0.3, shadowRadius: 5, elevation: 7 },
  title: { color: '#FFFDF0', fontSize: 34, lineHeight: 42, fontWeight: '900', textShadowColor: '#254D48', textShadowRadius: 2 },
  close: { position: 'absolute', top: 42, right: 14, width: 44, height: 44, borderRadius: 23, backgroundColor: '#F45142', borderWidth: 3, borderColor: '#FFD89E', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  closeText: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', lineHeight: 34 },
  objectives: { width: '100%', minHeight: 95, borderRadius: 24, backgroundColor: '#FFE6C5', borderWidth: 3, borderColor: '#F0B66D', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, padding: 12 },
  objective: { minWidth: 58, minHeight: 58, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  objectiveIcon: { fontSize: 37, lineHeight: 46 },
  objectiveCount: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, marginLeft: -8, marginBottom: 2, textShadowColor: '#523421', textShadowRadius: 3 },
  sectionTitle: { color: '#FFF8E8', fontSize: 16, fontWeight: '900', marginTop: 18, marginBottom: 11, textShadowColor: '#126B62', textShadowRadius: 2 },
  boosterRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-evenly' },
  booster: { width: 76, height: 76, borderRadius: 27, backgroundColor: '#F6C548', borderWidth: 4, borderColor: '#FFE9A2', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  boosterSelected: { borderColor: '#FFFFFF', backgroundColor: '#F5A93D', transform: [{ scale: 1.05 }] },
  boosterDisabled: { opacity: 0.45 },
  boosterIcon: { fontSize: 37 },
  countBadge: { position: 'absolute', bottom: -7, right: -5, minWidth: 28, height: 28, borderRadius: 15, backgroundColor: '#EA514A', borderWidth: 2, borderColor: '#FFF1CF', alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  check: { position: 'absolute', top: -8, left: -7, width: 24, height: 24, borderRadius: 13, backgroundColor: '#2FB94F', borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', lineHeight: 17 },
  moves: { color: '#FFF7E4', fontWeight: '800', fontSize: 14, marginTop: 14 },
  play: { width: '100%', minHeight: 63, borderRadius: 22, marginTop: 16, backgroundColor: '#58D624', borderWidth: 4, borderColor: '#B2F27D', alignItems: 'center', justifyContent: 'center', shadowColor: '#28551C', shadowOpacity: 0.35, shadowRadius: 5, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  playText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', textShadowColor: '#367C16', textShadowRadius: 3 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});