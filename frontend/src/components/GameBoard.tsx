import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import LevelModal from './game/LevelModal';
import { VectorBird } from './game/VectorBird';
import { BoosterType, BoardCoord, MatchEngine, Tile } from '../game/engine';
import { LEVELS_CONFIG, LevelTarget } from '../game/levels';
import { gameState } from '../game/gameState';
import { soundManager } from '../game/soundManager';

type StarterBooster = Exclude<BoosterType, 'extraMoves'>;

interface GameBoardProps {
  levelId: number;
  startingBoosters: StarterBooster[];
  onBack: () => void;
  onLevelComplete: (stars: number) => void;
}

const TARGETS: Record<LevelTarget['type'], { icon: string; title: string }> = {
  score: { icon: '⭐', title: 'Score' },
  break_wood: { icon: '🟫', title: 'Wood' },
  clear_jelly: { icon: '🧊', title: 'Ice' },
  rescue_bears: { icon: '🐻', title: 'Bears' },
  collect_color: { icon: '💎', title: 'Candy' },
};

const BOOSTERS: { id: BoosterType; icon: string; label: string }[] = [
  { id: 'hammer', icon: '🍭', label: 'Hammer' },
  { id: 'striped', icon: '🪄', label: 'Row clear' },
  { id: 'colorBomb', icon: '🌈', label: 'Color bomb' },
  { id: 'extraMoves', icon: '➕', label: 'Extra moves' },
];

export const GameBoard: React.FC<GameBoardProps> = ({
  levelId,
  startingBoosters,
  onBack,
  onLevelComplete,
}) => {
  const levelConfig = LEVELS_CONFIG[levelId] ?? LEVELS_CONFIG[1];
  const engineRef = useRef(new MatchEngine(levelConfig));
  const engine = engineRef.current;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const boardSize = Math.max(252, Math.min(windowWidth - 28, 456, (windowHeight - 290) * 0.87));
  const cellSize = (boardSize - 12) / engine.cols;

  const [revision, setRevision] = useState(0);
  const [playerData, setPlayerData] = useState(() => gameState.getState());
  const [activeBooster, setActiveBooster] = useState<BoosterType | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [freeCharges, setFreeCharges] = useState<Record<BoosterType, number>>(() => ({
    hammer: startingBoosters.filter((item) => item === 'hammer').length,
    striped: startingBoosters.filter((item) => item === 'striped').length,
    colorBomb: startingBoosters.filter((item) => item === 'colorBomb').length,
    extraMoves: 0,
  }));
  const [toast, setToast] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [outOfMoves, setOutOfMoves] = useState(false);
  const [showInGameShop, setShowInGameShop] = useState(false);

  const handleBuyExtraMovesWithCoins = () => {
    if (gameState.coins >= 20) {
      gameState.addCoins(-20);
      engine.movesRemaining += 5;
      completionHandled.current = false;
      setOutOfMoves(false);
      updatePlayer();
      setToast('Added +5 Extra Moves!');
    } else {
      setShowInGameShop(true);
    }
  };

  const handleAdExtraMoves = () => {
    engine.movesRemaining += 3;
    completionHandled.current = false;
    setOutOfMoves(false);
    updatePlayer();
    setToast('Watched Ad: +3 Extra Moves added!');
  };
  const [starsEarned, setStarsEarned] = useState(1);
  const completionHandled = useRef(false);

  // Animation values per tile
  const animOffsets = useRef<{ [key: string]: Animated.ValueXY }>({}).current;
  const animScales = useRef<{ [key: string]: Animated.Value }>({}).current;

  const getTileAnim = (r: number, c: number) => {
    const key = `${r}_${c}`;
    if (!animOffsets[key]) animOffsets[key] = new Animated.ValueXY({ x: 0, y: 0 });
    if (!animScales[key]) animScales[key] = new Animated.Value(1);
    return { pos: animOffsets[key], scale: animScales[key] };
  };

  const objectiveValues = useMemo(
    () => levelConfig.targets.map((target) => engine.getTargetProgress(target)),
    [engine, levelConfig.targets, revision],
  );

  useEffect(() => {
    soundManager.playBGM();
  }, []);

  const showFeedback = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 1100);
  };

  const updatePlayer = () => setPlayerData({ ...gameState.getState(), boosters: { ...gameState.getState().boosters } });

  const checkEndState = () => {
    if (completionHandled.current) return;
    if (engine.hasCompletedObjectives()) {
      completionHandled.current = true;
      const movesRatio = engine.movesRemaining / levelConfig.moves;
      const stars = movesRatio >= 0.5 ? 3 : movesRatio >= 0.2 ? 2 : 1;
      setStarsEarned(stars);
      gameState.completeLevel(levelId, stars);
      updatePlayer();
      soundManager.playWin();
      setTimeout(() => setShowResult(true), 350);
    } else if (engine.movesRemaining <= 0) {
      completionHandled.current = true;
      gameState.loseLife();
      updatePlayer();
      soundManager.playOver();
      setTimeout(() => setOutOfMoves(true), 250);
    }
  };

  // Video jaisa Animated Swipe
  const executeAnimatedSwap = (r1: number, c1: number, r2: number, c2: number) => {
    if (isAnimating || completionHandled.current) return;
    setIsAnimating(true);

    const anim1 = getTileAnim(r1, c1).pos;
    const anim2 = getTileAnim(r2, c2).pos;

    const dx = (c2 - c1) * cellSize;
    const dy = (r2 - r1) * cellSize;

    soundManager.playSwap();

    // 1. Pehle goti slide hokar aage badhegi
    Animated.parallel([
      Animated.timing(anim1, { toValue: { x: dx, y: dy }, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(anim2, { toValue: { x: -dx, y: -dy }, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      // 2. Ab check karo match valid hai ya nahi
      const valid = engine.swap(r1, c1, r2, c2);

      if (valid) {
        // Valid move: positions reset karo aur drop effect play karo
        anim1.setValue({ x: 0, y: 0 });
        anim2.setValue({ x: 0, y: 0 });
        soundManager.playPop();
        if (engine.score > 0) soundManager.playBlast();
        
        // Falling animation (upar se girna)
        triggerDropAnimation(() => {
          setIsAnimating(false);
          setRevision((curr) => curr + 1);
          checkEndState();
        });
      } else {
        // 3. Galat Swap: Bounce wapas original jagah
        Animated.parallel([
          Animated.timing(anim1, { toValue: { x: 0, y: 0 }, duration: 160, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim2, { toValue: { x: 0, y: 0 }, duration: 160, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]).start(() => {
          setIsAnimating(false);
          showFeedback('Try a swap that makes a match');
        });
      }
    });
  };

  const triggerDropAnimation = (onDone: () => void) => {
    const drops: Animated.CompositeAnimation[] = [];
    for (let r = 0; r < engine.rows; r++) {
      for (let c = 0; c < engine.cols; c++) {
        const anim = getTileAnim(r, c).pos;
        anim.setValue({ x: 0, y: -cellSize * 1.2 });
        drops.push(
          Animated.spring(anim, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          })
        );
      }
    }
    Animated.parallel(drops).start(() => onDone());
  };

  const handleBoosterClick = (r: number, c: number) => {
    if (!activeBooster) return;
    if (activeBooster === 'extraMoves') return;
    const applied = engine.applyBooster(activeBooster, r, c);
    setActiveBooster(null);
    if (applied) {
      soundManager.playBlast();
      triggerDropAnimation(() => {
        setRevision((curr) => curr + 1);
        checkEndState();
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.game}>
        {/* HUD Top Bar */}
        <View style={styles.hudRow}>
          <View style={styles.movePlaque}>
            <Text style={styles.moveLabel}>MOVE</Text>
            <Text style={styles.moveCount}>{engine.movesRemaining}</Text>
          </View>

          <View style={styles.objectivesBar}>
            {levelConfig.targets.map((target, index) => {
              const progress = objectiveValues[index] ?? 0;
              return (
                <View key={index} style={styles.objectivePill}>
                  <Text style={styles.objectiveIcon}>{TARGETS[target.type].icon}</Text>
                  <Text style={styles.objectiveNumber}>{Math.min(progress, target.count)}/{target.count}</Text>
                </View>
              );
            })}
          </View>

          <Pressable onPress={() => setShowSettings(true)} style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        {/* Board View with Smooth Pan Gesture */}
        <View style={styles.playfield}>
          <View style={[styles.boardFrame, { width: boardSize, height: boardSize }]}>
            {engine.grid.map((row, r) => (
              <View key={`row-${r}`} style={styles.boardRow}>
                {row.map((tile, c) => {
                  if (!tile) return <View key={`empty-${r}-${c}`} style={{ width: cellSize, height: cellSize }} />;

                  const { pos, scale } = getTileAnim(r, c);

                  return (
                    <TileItem
                      key={tile.id}
                      tile={tile}
                      r={r}
                      c={c}
                      cellSize={cellSize}
                      pos={pos}
                      scale={scale}
                      onSwipe={executeAnimatedSwap}
                      onPress={() => handleBoosterClick(r, c)}
                    />
                  );
                })}
              </View>
            ))}
          </View>
          {toast ? <View pointerEvents="none" style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View> : null}
        </View>

        {/* Level Complete / Game Over Modals */}
        <LevelModal
          visible={showResult}
          finalLevel={levelId === 50}
          levelName={`Level ${levelId}`}
          score={engine.score}
          starsEarned={starsEarned}
          objectives={levelConfig.targets.map((target) => ({
            icon: TARGETS[target.type].icon,
            progress: engine.getTargetProgress(target),
            count: target.count,
          }))}
          onContinue={() => onLevelComplete(starsEarned)}
        />
      </View>
    
      {/* OUT OF MOVES & SHOP TRIGGER MODAL */}
      <Modal visible={outOfMoves} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 340, backgroundColor: '#2B1A3D', borderRadius: 24, padding: 22, alignItems: 'center', borderWidth: 2.5, borderColor: '#FFB703' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#FF3366', marginBottom: 6 }}>OUT OF MOVES!</Text>
            <Text style={{ fontSize: 13, color: '#DDD', textAlign: 'center', marginBottom: 18 }}>Don't give up! Continue playing to reach your goal.</Text>
            
            {/* CONTINUE WITH COINS */}
            <Pressable
              onPress={handleBuyExtraMovesWithCoins}
              style={{ backgroundColor: '#06D6A0', width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 15 }}>+5 MOVES FOR 20 🪙</Text>
            </Pressable>

            {/* WATCH AD FOR MOVES */}
            <Pressable
              onPress={handleAdExtraMoves}
              style={{ backgroundColor: '#FFB703', width: '100%', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginBottom: 10 }}
            >
              <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 14 }}>🎬 Watch Ad (+3 Moves)</Text>
            </Pressable>

            {/* OPEN SHOP DIRECTLY */}
            <Pressable
              onPress={() => setShowInGameShop(true)}
              style={{ backgroundColor: '#FF85A1', width: '100%', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginBottom: 14 }}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>🛍️ Open Coin Shop</Text>
            </Pressable>

            {/* GIVE UP / LOSE LIFE */}
            <Pressable
              onPress={() => {
                setOutOfMoves(false);
                onBack();
              }}
              style={{ paddingVertical: 6 }}
            >
              <Text style={{ color: '#AAA', fontSize: 13, fontWeight: 'bold' }}>Give Up (Lose 1 Life)</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* IN-GAME COIN BILLING SHOP MODAL */}
      <Modal visible={showInGameShop} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 340, backgroundColor: '#221530', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: '#FF85A1' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ color: '#FFBE0B', fontSize: 18, fontWeight: 'bold' }}>🪙 In-Game Coin Store</Text>
              <Pressable onPress={() => setShowInGameShop(false)}>
                <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold' }}>✕</Text>
              </Pressable>
            </View>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>100 Coins</Text>
                <Text style={{ color: '#AAA', fontSize: 11 }}>Starter Coin Pack</Text>
              </View>
              <Pressable
                onPress={() => alert('🔒 Google Play Billing Locked\nPrice: ₹49\n\nProduction live hone par active hogi.')}
                style={{ backgroundColor: '#FF3366', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>₹49</Text>
              </Pressable>
            </View>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>500 Coins</Text>
                <Text style={{ color: '#06D6A0', fontSize: 11 }}>Most Popular Pack</Text>
              </View>
              <Pressable
                onPress={() => alert('🔒 Google Play Billing Locked\nPrice: ₹199\n\nProduction live hone par active hogi.')}
                style={{ backgroundColor: '#06D6A0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
              >
                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13 }}>₹199</Text>
              </Pressable>
            </View>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>2,000 Coins</Text>
                <Text style={{ color: '#FFBE0B', fontSize: 11 }}>Best Value Pack</Text>
              </View>
              <Pressable
                onPress={() => alert('🔒 Google Play Billing Locked\nPrice: ₹599\n\nProduction live hone par active hogi.')}
                style={{ backgroundColor: '#FF3366', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>₹599</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setShowInGameShop(false)}
              style={{ backgroundColor: '#444', width: '100%', paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>Close Store</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>

  );
};

// Har Candy Goti ka PanResponder component (Smooth Touch & Drag)
const TileItem = ({ tile, r, c, cellSize, pos, scale, onSwipe, onPress }: any) => {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8,
      onPanResponderRelease: (_, gesture) => {
        const { dx, dy } = gesture;
        if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
          onPress();
          return;
        }
        if (Math.abs(dx) > Math.abs(dy)) {
          onSwipe(r, c, r, c + (dx > 0 ? 1 : -1));
        } else {
          onSwipe(r, c, r + (dy > 0 ? 1 : -1), c);
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.cell,
        {
          width: cellSize,
          height: cellSize,
          transform: [{ translateX: pos.x }, { translateY: pos.y }, { scale: scale }],
        },
      ]}
    >
      <VectorBird color={tile.color} size={cellSize * 0.85} />
      {tile.woodHealth > 0 ? (
        <View style={styles.woodLayer}>
          <Text style={styles.woodHealth}>{tile.woodHealth === 1 ? '╳' : ''}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5D66B' },
  game: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: '#EAB18E' },
  hudRow: { height: 90, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F2D76C' },
  movePlaque: { width: 75, height: 70, backgroundColor: '#FFF1CE', borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  moveLabel: { color: '#9D6D54', fontSize: 11, fontWeight: '900' },
  moveCount: { color: '#7F4D33', fontSize: 26, fontWeight: '900' },
  objectivesBar: { flexDirection: 'row', gap: 8 },
  objectivePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18 },
  objectiveIcon: { fontSize: 18, marginRight: 4 },
  objectiveNumber: { fontWeight: 'bold', color: '#555' },
  settingsButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#4DB7E6', alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { color: '#FFF', fontSize: 20 },
  playfield: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  boardFrame: { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 16, padding: 6, overflow: 'hidden' },
  boardRow: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center' },
  woodLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(160,82,45,0.85)', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  woodHealth: { color: '#FFF', fontWeight: 'bold' },
  toast: { position: 'absolute', bottom: 30, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  toastText: { color: '#FFF', fontWeight: 'bold' }
});
