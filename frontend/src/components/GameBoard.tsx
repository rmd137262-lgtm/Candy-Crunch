import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing, Alert, Modal, ScrollView } from 'react-native';
import { BIRD_ASSETS, GOAL_ASSETS } from '../constants/assets';

const { width } = Dimensions.get('window');
const GRID_SIZE = 7;
const BOARD_WIDTH = Math.min(width - 32, 380);
const TILE_SIZE = BOARD_WIDTH / GRID_SIZE;

const STORAGE_KEY = 'candy_crunch_highest_unlocked_level';

const getSavedLevel = (): number => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) return parseInt(saved, 10);
    }
  } catch (e) {}
  return 1;
};

const saveUnlockedLevel = (level: number) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, level.toString());
    }
  } catch (e) {}
};

interface LevelConfig {
  levelNumber: number;
  title: string;
  targetGoal: number;
  totalMoves: number;
  targetBirdGif: any;
  hasDragonBooster: boolean;
  cagePattern: (row: number, col: number) => { isCaged: boolean; cageType: 'iron' | 'gold'; health: number };
}

const TOTAL_LEVELS = 15;

const generateLevelConfig = (lvl: number): LevelConfig => {
  return {
    levelNumber: lvl,
    title: `Level ${lvl} - Bird Sanctuary`,
    targetGoal: Math.min(6 + lvl * 2, 24),
    totalMoves: Math.max(22 - Math.floor(lvl / 2), 12),
    targetBirdGif: GOAL_ASSETS.targets.bird01,
    hasDragonBooster: lvl >= 2,
    cagePattern: (r, c) => {
      if (lvl === 1) {
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        return { isCaged: isCenter, cageType: 'iron', health: 1 };
      } else if (lvl % 2 === 0) {
        const isPattern = (r + c) % 2 === 0;
        const isGold = (r === 3 || c === 3);
        return { isCaged: isPattern, cageType: isGold ? 'gold' : 'iron', health: isGold ? 2 : 1 };
      } else {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6 || (r === 3 && c === 3);
        return { isCaged: isBorder, cageType: 'gold', health: 2 };
      }
    }
  };
};

const ALL_LEVELS: LevelConfig[] = Array.from({ length: TOTAL_LEVELS }, (_, i) => generateLevelConfig(i + 1));

interface Tile {
  id: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';
  isCaged: boolean;
  cageType: 'iron' | 'gold';
  health: number;
}

export default function GameBoard() {
  const [highestUnlocked, setHighestUnlocked] = useState<number>(1);
  const [currentLevelNum, setCurrentLevelNum] = useState<number>(1);
  const [showLevelMap, setShowLevelMap] = useState<boolean>(false);

  useEffect(() => {
    const saved = getSavedLevel();
    setHighestUnlocked(saved);
    setCurrentLevelNum(saved);
  }, []);

  const currentLevel = ALL_LEVELS[currentLevelNum - 1] || ALL_LEVELS[0];
  const [rescuedCount, setRescuedCount] = useState(0);
  const [remainingMoves, setRemainingMoves] = useState(currentLevel.totalMoves);

  const flyAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [isFlying, setIsFlying] = useState(false);

  const [dragonActive, setDragonActive] = useState(false);
  const [fireBlasting, setFireBlasting] = useState(false);
  const dragonPos = useRef(new Animated.ValueXY({ x: width / 2 - 40, y: 40 })).current;
  const dragonScale = useRef(new Animated.Value(1)).current;
  const fireScale = useRef(new Animated.Value(0.2)).current;
  const fireOpacity = useRef(new Animated.Value(0)).current;

  const generateBoard = (lvl: LevelConfig): Tile[][] => {
    const colors: ('blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow')[] = [
      'blue', 'green', 'orange', 'purple', 'red', 'yellow'
    ];
    return Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) => {
        const info = lvl.cagePattern(r, c);
        return {
          id: `${lvl.levelNumber}-${r}-${c}`,
          color: colors[Math.floor(Math.random() * colors.length)],
          isCaged: info.isCaged,
          cageType: info.cageType,
          health: info.health,
        };
      })
    );
  };

  const [board, setBoard] = useState<Tile[][]>(() => generateBoard(currentLevel));

  const loadSpecificLevel = (lvlNum: number) => {
    const lvl = ALL_LEVELS[lvlNum - 1];
    setCurrentLevelNum(lvlNum);
    setRescuedCount(0);
    setRemainingMoves(lvl.totalMoves);
    setBoard(generateBoard(lvl));
    setShowLevelMap(false);
  };

  const handleRescueBird = (row: number, col: number) => {
    if (remainingMoves <= 0 || dragonActive) return;

    const cell = board[row][col];
    let rescued = 0;

    const nextBoard = board.map((r, rIdx) =>
      r.map((t, cIdx) => {
        if (rIdx === row && cIdx === col && t.isCaged) {
          if (t.health > 1) {
            return { ...t, health: t.health - 1, cageType: 'iron' as const };
          } else {
            rescued = 1;
            return { ...t, isCaged: false, health: 0 };
          }
        }
        return t;
      })
    );

    setBoard(nextBoard);
    const newMoves = remainingMoves - 1;
    setRemainingMoves(newMoves);

    if (rescued > 0) {
      setIsFlying(true);
      flyAnim.setValue({ x: col * TILE_SIZE + 20, y: row * TILE_SIZE + 160 });

      Animated.timing(flyAnim, {
        toValue: { x: width / 2 - 25, y: 55 },
        duration: 650,
        useNativeDriver: false,
      }).start(() => {
        setIsFlying(false);
        const newRescued = rescuedCount + 1;
        setRescuedCount(newRescued);

        if (newRescued >= currentLevel.targetGoal) {
          const nextLvlNum = currentLevelNum + 1;
          const updatedHighest = Math.max(highestUnlocked, nextLvlNum);
          
          setHighestUnlocked(updatedHighest);
          saveUnlockedLevel(updatedHighest);

          setTimeout(() => {
            Alert.alert(
              `🎉 LEVEL ${currentLevelNum} PASSED!`,
              `Shabash! Agla Level ${nextLvlNum} unlock ho gaya hai!`,
              [
                { text: "Map", onPress: () => setShowLevelMap(true) },
                { text: "Next Level", onPress: () => loadSpecificLevel(nextLvlNum) }
              ]
            );
          }, 200);
        }
      });
    }

    if (newMoves <= 0 && rescuedCount + rescued < currentLevel.targetGoal) {
      setTimeout(() => {
        Alert.alert("Moves Khatam!", "Chidiyan abhi bhi kaid hain. Phir se koshish karein!", [
          { text: "Retry", onPress: () => loadSpecificLevel(currentLevelNum) }
        ]);
      }, 400);
    }
  };

  const triggerDragonBlast = () => {
    if (dragonActive || remainingMoves <= 0) return;
    setDragonActive(true);

    Animated.parallel([
      Animated.timing(dragonPos, {
        toValue: { x: width / 2 - 45, y: 220 },
        duration: 750,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: false,
      }),
      Animated.timing(dragonScale, { toValue: 1.8, duration: 750, useNativeDriver: false }),
    ]).start(() => {
      setFireBlasting(true);
      fireScale.setValue(0.2);
      fireOpacity.setValue(1);

      Animated.parallel([
        Animated.timing(fireScale, { toValue: 2.6, duration: 600, useNativeDriver: false }),
        Animated.timing(fireOpacity, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]).start(() => {
        setFireBlasting(false);

        let blastRescued = 0;
        const nextBoard = board.map((r, rIdx) =>
          r.map((cell, cIdx) => {
            if (rIdx >= 2 && rIdx <= 4 && cIdx >= 2 && cIdx <= 4 && cell.isCaged) {
              blastRescued++;
              return { ...cell, isCaged: false, health: 0 };
            }
            return cell;
          })
        );

        setBoard(nextBoard);
        const newRescued = Math.min(rescuedCount + blastRescued, currentLevel.targetGoal);
        setRescuedCount(newRescued);

        Animated.parallel([
          Animated.timing(dragonPos, { toValue: { x: width / 2 - 40, y: 40 }, duration: 600, useNativeDriver: false }),
          Animated.timing(dragonScale, { toValue: 1, duration: 600, useNativeDriver: false }),
        ]).start(() => {
          setDragonActive(false);
          if (newRescued >= currentLevel.targetGoal) {
            const nextLvlNum = currentLevelNum + 1;
            const updatedHighest = Math.max(highestUnlocked, nextLvlNum);
            setHighestUnlocked(updatedHighest);
            saveUnlockedLevel(updatedHighest);

            Alert.alert("🔥 DRAGON FIRE WIN!", `Dragon ne Level ${currentLevelNum} clear kar diya!`, [
              { text: "Next Level", onPress: () => loadSpecificLevel(nextLvlNum) }
            ]);
          }
        });
      });
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.levelStatusRow}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setShowLevelMap(true)} style={styles.levelBadgeBtn}>
          <Text style={styles.levelBadgeText}>LEVEL {currentLevel.levelNumber} 🗺️ MAP</Text>
        </TouchableOpacity>
        <Text style={styles.movesLeftText}>Moves: {remainingMoves}</Text>
      </View>

      <View style={styles.goalSection}>
        <Image source={GOAL_ASSETS.frames.boardHeader} style={styles.boardHeader} resizeMode="contain" />
        <View style={styles.goalBox}>
          <Image source={GOAL_ASSETS.targets.foodBowl} style={styles.targetIcon} resizeMode="contain" />
          <Text style={styles.goalText}>{rescuedCount}/{currentLevel.targetGoal}</Text>
          <Image source={currentLevel.targetBirdGif} style={styles.targetGif} resizeMode="contain" />

          {currentLevel.hasDragonBooster && (
            <TouchableOpacity activeOpacity={0.8} onPress={triggerDragonBlast} style={styles.dragonBoosterBtn}>
              <Image source={GOAL_ASSETS.targets.dragon} style={styles.dragonThumbnail} resizeMode="contain" />
              <Text style={styles.boosterBadge}>FIRE</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.boardWrapper, { width: BOARD_WIDTH, height: BOARD_WIDTH }]}>
        <Image source={GOAL_ASSETS.frames.boardFrame} style={StyleSheet.absoluteFillObject} resizeMode="stretch" />
        <View style={styles.grid}>
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <TouchableOpacity
                key={cell.id}
                activeOpacity={0.7}
                onPress={() => handleRescueBird(rIdx, cIdx)}
                style={[styles.tile, { width: TILE_SIZE, height: TILE_SIZE }]}
              >
                <Image source={BIRD_ASSETS[cell.color]} style={styles.birdImage} resizeMode="contain" />

                {cell.isCaged && (
                  <View style={styles.cageOverlay} pointerEvents="none">
                    <Image
                      source={cell.cageType === 'gold' ? GOAL_ASSETS.cages.gold : GOAL_ASSETS.cages.iron}
                      style={styles.cageImage}
                      resizeMode="stretch"
                    />
                    <Image source={GOAL_ASSETS.cages.dome} style={styles.cageDome} resizeMode="contain" />
                    {cell.health > 1 && <View style={styles.crackIndicator} />}
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {fireBlasting && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.fireBlastRing,
              { opacity: fireOpacity, transform: [{ scale: fireScale }] },
            ]}
          >
            <View style={styles.fireCore} />
          </Animated.View>
        )}
      </View>

      {isFlying && (
        <Animated.View style={[styles.flyingBirdContainer, flyAnim.getLayout()]} pointerEvents="none">
          <Image source={BIRD_ASSETS.flyGif} style={styles.flyingBirdGif} resizeMode="contain" />
        </Animated.View>
      )}

      {dragonActive && (
        <Animated.View
          pointerEvents="none"
          style={[styles.flyingDragonContainer, dragonPos.getLayout(), { transform: [{ scale: dragonScale }] }]}
        >
          <Image source={GOAL_ASSETS.targets.dragon} style={styles.dragonFlyingImg} resizeMode="contain" />
        </Animated.View>
      )}

      <Modal visible={showLevelMap} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SELECT LEVEL</Text>
            <Text style={styles.modalSubtitle}>Highest Cleared: Level {highestUnlocked}</Text>

            <ScrollView contentContainerStyle={styles.levelGrid}>
              {ALL_LEVELS.map((lvl) => {
                const isUnlocked = lvl.levelNumber <= highestUnlocked;
                const isCurrent = lvl.levelNumber === currentLevelNum;

                return (
                  <TouchableOpacity
                    key={lvl.levelNumber}
                    disabled={!isUnlocked}
                    onPress={() => loadSpecificLevel(lvl.levelNumber)}
                    style={[
                      styles.levelCard,
                      isUnlocked ? styles.levelUnlockedCard : styles.levelLockedCard,
                      isCurrent && styles.levelCurrentCard,
                    ]}
                  >
                    <Text style={[styles.levelCardNum, !isUnlocked && styles.lockedText]}>
                      {lvl.levelNumber}
                    </Text>
                    <Text style={styles.levelStatusIcon}>
                      {isUnlocked ? '🔓' : '🔒'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity onPress={() => setShowLevelMap(false)} style={styles.closeModalBtn}>
              <Text style={styles.closeModalBtnText}>RESUME GAME</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  levelStatusRow: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelBadgeBtn: {
    backgroundColor: '#ff1493',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    elevation: 3,
  },
  levelBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  movesLeftText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  boardHeader: {
    width: 220,
    height: 46,
  },
  goalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: -6,
    elevation: 4,
  },
  targetIcon: {
    width: 24,
    height: 24,
    marginRight: 6,
  },
  targetGif: {
    width: 30,
    height: 30,
    marginLeft: 6,
  },
  goalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  dragonBoosterBtn: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#ff1744',
  },
  dragonThumbnail: {
    width: 26,
    height: 26,
  },
  boosterBadge: {
    fontSize: 8,
    fontWeight: '900',
    color: '#d50000',
  },
  boardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    position: 'relative',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
  },
  tile: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  birdImage: {
    width: '80%',
    height: '80%',
  },
  cageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cageImage: {
    width: '92%',
    height: '92%',
    opacity: 0.95,
  },
  cageDome: {
    position: 'absolute',
    top: 2,
    width: '80%',
    height: 10,
  },
  crackIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffd700',
  },
  fireBlastRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 69, 0, 0.4)',
    borderWidth: 4,
    borderColor: '#ffeb3b',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 998,
  },
  fireCore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.7)',
  },
  flyingBirdContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
  flyingBirdGif: {
    width: 48,
    height: 48,
  },
  flyingDragonContainer: {
    position: 'absolute',
    zIndex: 10000,
  },
  dragonFlyingImg: {
    width: 60,
    height: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '95%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#d81b60',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 16,
  },
  levelCard: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  levelUnlockedCard: {
    backgroundColor: '#4caf50',
  },
  levelLockedCard: {
    backgroundColor: '#e0e0e0',
  },
  levelCurrentCard: {
    borderWidth: 3,
    borderColor: '#ffeb3b',
    backgroundColor: '#e91e63',
  },
  levelCardNum: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  lockedText: {
    color: '#888',
  },
  levelStatusIcon: {
    fontSize: 12,
  },
  closeModalBtn: {
    marginTop: 12,
    backgroundColor: '#ff1493',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  closeModalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
