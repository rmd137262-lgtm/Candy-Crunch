import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated
} from 'react-native';
import { MatchEngine } from '../game/engine';
import { LEVELS_CONFIG } from '../game/levels';
import { gameState } from '../game/gameState';
import { soundManager } from '../game/soundManager';
import { VectorBird } from './game/VectorBird';

interface GameBoardProps {
  levelId: number;
  onBack: () => void;
  onLevelComplete: (stars: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ levelId, onBack, onLevelComplete }) => {
  const levelConfig = LEVELS_CONFIG[levelId] || LEVELS_CONFIG[1];
  const engineRef = useRef<MatchEngine>(new MatchEngine(levelConfig));
  const [, setTick] = useState(0);
  const [selectedCoord, setSelectedCoord] = useState<[number, number] | null>(null);
  const [popupText, setPopupText] = useState<string | null>(null);
  
  const touchStartRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);
  const hasSwipedRef = useRef(false);

  useEffect(() => {
    soundManager.playBGM();
  }, []);

  const showTastyPopup = (text: string) => {
    setPopupText(text);
    setTimeout(() => setPopupText(null), 1200);
  };

  const doSwap = (r1: number, c1: number, r2: number, c2: number) => {
    const engine = engineRef.current;
    if (r2 < 0 || r2 >= engine.rows || c2 < 0 || c2 >= engine.cols) return;

    soundManager.playPop();
    const swapped = engine.swap(r1, c1, r2, c2);

    if (swapped) {
      soundManager.playBlast();
      const phrases = ['Tasty!', 'Delicious!', 'Juicy!', 'Sweet!'];
      showTastyPopup(phrases[Math.floor(Math.random() * phrases.length)]);
      setTick(t => t + 1);

      if (engine.score >= levelConfig.targetScore) {
        soundManager.playWin();
        gameState.completeLevel(levelId, 3);
        setTimeout(() => {
          Alert.alert('🌟 MISSION COMPLETED! 🌟', 'Tasty! You earned 3 Stars!', [
            { text: 'Next Level', onPress: () => onLevelComplete(3) }
          ]);
        }, 500);
      } else if (engine.movesRemaining <= 0) {
        setTimeout(() => {
          Alert.alert('Out of Moves 😢', 'Try again to pass the level!', [
            {
              text: 'Retry',
              onPress: () => {
                engineRef.current = new MatchEngine(levelConfig);
                setTick(t => t + 1);
              }
            }
          ]);
        }, 500);
      }
    } else {
      setTick(t => t + 1);
    }
  };

  // Touch & Pointer Start
  const handleStart = (r: number, c: number, e: any) => {
    const pageX = e.nativeEvent?.pageX ?? (e.nativeEvent?.touches && e.nativeEvent.touches[0]?.pageX) ?? 0;
    const pageY = e.nativeEvent?.pageY ?? (e.nativeEvent?.touches && e.nativeEvent.touches[0]?.pageY) ?? 0;
    touchStartRef.current = { r, c, x: pageX, y: pageY };
    hasSwipedRef.current = false;
  };

  // Touch & Pointer Move (Instant Swipe Drag)
  const handleMove = (e: any) => {
    if (!touchStartRef.current || hasSwipedRef.current) return;
    const pageX = e.nativeEvent?.pageX ?? (e.nativeEvent?.touches && e.nativeEvent.touches[0]?.pageX) ?? 0;
    const pageY = e.nativeEvent?.pageY ?? (e.nativeEvent?.touches && e.nativeEvent.touches[0]?.pageY) ?? 0;

    const dx = pageX - touchStartRef.current.x;
    const dy = pageY - touchStartRef.current.y;
    const threshold = 16;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      hasSwipedRef.current = true;
      const { r, c } = touchStartRef.current;
      touchStartRef.current = null;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) doSwap(r, c, r, c + 1);
        else doSwap(r, c, r, c - 1);
      } else {
        if (dy > 0) doSwap(r, c, r + 1, c);
        else doSwap(r, c, r - 1, c);
      }
      setSelectedCoord(null);
    }
  };

  // Touch & Pointer End (Tap fallback)
  const handleEnd = (r: number, c: number) => {
    if (hasSwipedRef.current) {
      hasSwipedRef.current = false;
      touchStartRef.current = null;
      return;
    }
    touchStartRef.current = null;

    if (!selectedCoord) {
      setSelectedCoord([r, c]);
    } else {
      const [sr, sc] = selectedCoord;
      const isAdj = (Math.abs(sr - r) === 1 && sc === c) || (Math.abs(sc - c) === 1 && sr === r);
      if (isAdj) {
        doSwap(sr, sc, r, c);
        setSelectedCoord(null);
      } else {
        setSelectedCoord([r, c]);
      }
    }
  };

  const engine = engineRef.current;
  const isGoalMet = engine.score >= levelConfig.targetScore;

  return (
    <View style={styles.container}>
      {/* 1. TOP CANDY STORE HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>⬅ Map</Text>
        </TouchableOpacity>

        {/* Vintage Move Badge (Sweet Candy Puzzle Style) */}
        <View style={styles.moveBadge}>
          <Text style={styles.moveBadgeLabel}>Move</Text>
          <Text style={styles.moveBadgeNumber}>{engine.movesRemaining}</Text>
        </View>

        {/* Target Goals Container */}
        <View style={styles.goalPillsRow}>
          <View style={[styles.targetBox, isGoalMet && styles.targetBoxDone]}>
            <Text style={styles.targetIcon}>🎯</Text>
            <Text style={styles.targetVal}>{isGoalMet ? '✓' : `${engine.score}/${levelConfig.targetScore}`}</Text>
          </View>
          <View style={styles.targetBox}>
            <Text style={styles.targetIcon}>🍧</Text>
            <Text style={styles.targetVal}>Jelly</Text>
          </View>
        </View>

        {/* Cute Mascot Girl / Bear Avatar */}
        <View style={styles.mascotHolder}>
          <Text style={{ fontSize: 32 }}>👩‍🍳</Text>
        </View>
      </View>

      {/* 2. CHEQUERED CLOTH SHELF BAR */}
      <View style={styles.clothRibbon}>
        <Text style={styles.ribbonLevelText}>LEVEL {levelId} - SWEET CANDY MATCH</Text>
      </View>

      {/* Floating Tasty Popup Banner */}
      {popupText && (
        <View style={styles.floatingTasty}>
          <Text style={styles.tastyText}>{popupText}</Text>
        </View>
      )}

      {/* 3. CANDY BOARD */}
      <View
        style={styles.boardWrapper}
        // @ts-ignore
        onPointerMove={handleMove}
        onTouchMove={handleMove}
      >
        <View style={styles.boardCard}>
          {engine.grid.map((row, rIdx) => (
            <View key={`row_${rIdx}`} style={styles.boardRow}>
              {row.map((tile, cIdx) => {
                const isSelected = selectedCoord?.[0] === rIdx && selectedCoord?.[1] === cIdx;
                const isAlt = (rIdx + cIdx) % 2 === 0;

                return (
                  <View
                    key={`slot_${rIdx}_${cIdx}`}
                    // @ts-ignore
                    onPointerDown={(e) => handleStart(rIdx, cIdx, e)}
                    // @ts-ignore
                    onPointerUp={() => handleEnd(rIdx, cIdx)}
                    onTouchStart={(e) => handleStart(rIdx, cIdx, e)}
                    onTouchEnd={() => handleEnd(rIdx, cIdx)}
                    style={[
                      styles.slot,
                      isAlt ? styles.slotA : styles.slotB,
                      isSelected && styles.slotSelected,
                      tile?.hasJelly && styles.slotJelly
                    ]}
                  >
                    {tile ? (
                      <View style={styles.candyWrapper} pointerEvents="none">
                        <VectorBird color={tile.color} size={42} />

                        {tile.special === 'striped_h' && <View style={styles.stripedLineH} />}
                        {tile.special === 'striped_v' && <View style={styles.stripedLineV} />}
                        {tile.special === 'wrapped' && <Text style={styles.bombMark}>💥</Text>}
                        {tile.special === 'disco' && <Text style={styles.bombMark}>🌈</Text>}

                        {tile.woodHealth > 0 && (
                          <View style={styles.woodOverlay}>
                            <Text style={{ fontSize: 18 }}>🪵</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.emptySlot} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* 4. BOTTOM CIRCULAR BOOSTERS DOCK (Exact Video Style) */}
      <View style={styles.boostersDock}>
        <TouchableOpacity style={styles.boosterBtn} onPress={() => Alert.alert('Lollipop Hammer', 'Breaks any single candy instantly!')}>
          <Text style={styles.boosterIcon}>🍭</Text>
          <View style={styles.boosterBadge}><Text style={styles.badgeNumber}>3</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.boosterBtn} onPress={() => Alert.alert('Magic Wand', 'Swaps adjacent candies without a move!')}>
          <Text style={styles.boosterIcon}>🪄</Text>
          <View style={styles.boosterBadge}><Text style={styles.badgeNumber}>2</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.boosterBtn} onPress={() => Alert.alert('Color Bomb', 'Clears all candies of one color!')}>
          <Text style={styles.boosterIcon}>💣</Text>
          <View style={styles.boosterBadge}><Text style={styles.badgeNumber}>1</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.boosterBtn} onPress={() => Alert.alert('Shuffle', 'Shuffles all candies on the board!')}>
          <Text style={styles.boosterIcon}>🔀</Text>
          <View style={styles.boosterBadge}><Text style={styles.badgeNumber}>5</Text></View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEAA7',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    userSelect: 'none'
  },
  topHeader: {
    flexDirection: 'row',
    width: '95%',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  backBtn: {
    backgroundColor: '#0984E3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13
  },
  moveBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#00CEC9',
    alignItems: 'center',
    elevation: 5
  },
  moveBadgeLabel: {
    color: '#E17055',
    fontSize: 11,
    fontWeight: 'bold'
  },
  moveBadgeNumber: {
    color: '#2D3436',
    fontSize: 22,
    fontWeight: '900'
  },
  goalPillsRow: {
    flexDirection: 'row',
    gap: 6
  },
  targetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FD9644',
    gap: 4,
    elevation: 3
  },
  targetBoxDone: {
    borderColor: '#26DE81',
    backgroundColor: '#E8F8F5'
  },
  targetIcon: {
    fontSize: 14
  },
  targetVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2D3436'
  },
  mascotHolder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FD79A8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  clothRibbon: {
    width: '95%',
    backgroundColor: '#FF7675',
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    elevation: 2
  },
  ribbonLevelText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1
  },
  floatingTasty: {
    position: 'absolute',
    top: '45%',
    zIndex: 99,
    backgroundColor: 'rgba(255, 234, 167, 0.95)',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#E17055',
    elevation: 12
  },
  tastyText: {
    color: '#D63031',
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic'
  },
  boardWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  boardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    padding: 6,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#74B9FF',
    elevation: 10,
    shadowColor: '#0984E3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8
  },
  boardRow: {
    flexDirection: 'row'
  },
  slot: {
    width: 44,
    height: 44,
    margin: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  slotA: {
    backgroundColor: '#DFE6E9'
  },
  slotB: {
    backgroundColor: '#B2BEC3'
  },
  slotSelected: {
    borderWidth: 3,
    borderColor: '#F1C40F',
    backgroundColor: '#FFF275',
    transform: [{ scale: 1.08 }]
  },
  slotJelly: {
    backgroundColor: '#74B9FF',
    borderWidth: 1.5,
    borderColor: '#0984E3'
  },
  candyWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptySlot: {
    width: 40,
    height: 40
  },
  stripedLineH: {
    position: 'absolute',
    width: '90%',
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.85)'
  },
  stripedLineV: {
    position: 'absolute',
    width: 5,
    height: '90%',
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.85)'
  },
  bombMark: {
    position: 'absolute',
    top: -2,
    right: -2,
    fontSize: 14
  },
  woodOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(121, 85, 72, 0.85)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  boostersDock: {
    flexDirection: 'row',
    width: '92%',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#55EFC4',
    elevation: 6
  },
  boosterBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4
  },
  boosterIcon: {
    fontSize: 24
  },
  boosterBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#D63031',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  badgeNumber: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold'
  }
});
