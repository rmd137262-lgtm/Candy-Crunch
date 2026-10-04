import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import LevelModal from './game/LevelModal';
import { VectorBird } from './game/VectorBird';
import { BoosterType, BoardCoord, MatchEngine } from '../game/engine';
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

const WOOD_CELLS = Array.from({ length: 4 }, (_, row) => row);

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
  const [selectedCoord, setSelectedCoord] = useState<BoardCoord | null>(null);
  const [activeBooster, setActiveBooster] = useState<BoosterType | null>(null);
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
  const [starsEarned, setStarsEarned] = useState(1);
  const completionHandled = useRef(false);
  const touchStart = useRef<{ x: number; y: number; coord: BoardCoord } | null>(null);
  const swiped = useRef(false);

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

  const refreshBoard = () => {
    setRevision((current) => current + 1);
    setSelectedCoord(null);
    checkEndState();
  };

  const spendBooster = (type: BoosterType): boolean => {
    if (freeCharges[type] > 0) {
      setFreeCharges((current) => ({ ...current, [type]: current[type] - 1 }));
      return true;
    }
    if (!gameState.useBooster(type)) {
      showFeedback('No boosters left');
      updatePlayer();
      return false;
    }
    updatePlayer();
    return true;
  };

  const activateBooster = (type: BoosterType) => {
    const available = freeCharges[type] + playerData.boosters[type];
    if (available < 1) {
      showFeedback('No boosters left');
      return;
    }

    if (type === 'extraMoves') {
      if (!spendBooster(type)) return;
      engine.applyBooster(type, 0, 0);
      soundManager.playPop();
      refreshBoard();
      showFeedback('+5 moves');
      return;
    }
    setActiveBooster((current) => current === type ? null : type);
    showFeedback(activeBooster === type ? 'Booster cancelled' : 'Choose a candy');
  };

  const handleCell = (r: number, c: number) => {
    if (completionHandled.current) return;
    const tile = engine.grid[r]?.[c];
    if (!tile) return;

    if (activeBooster) {
      if (!spendBooster(activeBooster)) {
        setActiveBooster(null);
        return;
      }
      const applied = engine.applyBooster(activeBooster, r, c);
      setActiveBooster(null);
      if (applied) {
        soundManager.playBlast();
        refreshBoard();
      } else {
        showFeedback('Choose an open candy');
      }
      return;
    }

    if (tile.woodHealth > 0) {
      showFeedback('Match candies beside the crate');
      return;
    }
    if (!selectedCoord) {
      setSelectedCoord([r, c]);
      return;
    }

    const [sr, sc] = selectedCoord;
    if (sr === r && sc === c) {
      setSelectedCoord(null);
      return;
    }
    if (Math.abs(sr - r) + Math.abs(sc - c) === 1) {
      const valid = engine.swap(sr, sc, r, c);
      setSelectedCoord(null);
      soundManager.playSwap();
      if (valid) {
        soundManager.playPop();
        if (engine.score > 0) soundManager.playBlast();
        refreshBoard();
      } else {
        setRevision((current) => current + 1);
        showFeedback('Try a swap that makes a match');
      }
      return;
    }
    setSelectedCoord([r, c]);
  };

  const startPointer = (r: number, c: number, event: any) => {
    const native = event?.nativeEvent ?? event;
    const point = native.touches?.[0] ?? native.changedTouches?.[0] ?? native;
    const pageX = point.pageX ?? point.clientX ?? 0;
    const pageY = point.pageY ?? point.clientY ?? 0;
    touchStart.current = { x: pageX, y: pageY, coord: [r, c] };
    swiped.current = false;
  };

  const movePointer = (event: any) => {
    const start = touchStart.current;
    if (!start || swiped.current) return;
    const native = event?.nativeEvent ?? event;
    const pageX = native.pageX ?? native.clientX ?? native.touches?.[0]?.pageX;
    const pageY = native.pageY ?? native.clientY ?? native.touches?.[0]?.pageY;
    if (typeof pageX !== 'number' || typeof pageY !== 'number') return;
    const dx = pageX - start.x;
    const dy = pageY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;

    swiped.current = true;
    touchStart.current = null;
    const [r, c] = start.coord;
    const target: BoardCoord = Math.abs(dx) > Math.abs(dy)
      ? [r, c + (dx > 0 ? 1 : -1)]
      : [r + (dy > 0 ? 1 : -1), c];
    if (target[0] < 0 || target[0] >= engine.rows || target[1] < 0 || target[1] >= engine.cols) return;

    const valid = engine.swap(r, c, target[0], target[1]);
    soundManager.playSwap();
    if (valid) {
      soundManager.playPop();
      soundManager.playBlast();
      setSelectedCoord(null);
      refreshBoard();
    } else {
      setRevision((current) => current + 1);
    }
  };

  const restartLevel = () => {
    engineRef.current = new MatchEngine(levelConfig);
    completionHandled.current = false;
    setOutOfMoves(false);
    setShowResult(false);
    setSelectedCoord(null);
    setActiveBooster(null);
    setRevision((current) => current + 1);
  };

  const cellObjectiveIcon = (type: LevelTarget['type']) => TARGETS[type].icon;
  const boosterCount = (type: BoosterType) => playerData.boosters[type] + freeCharges[type];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.game}>
        <View style={[styles.kitchen, { height: Math.min(228, Math.max(174, windowHeight * 0.255)) }]}>
          <View style={styles.kitchenDecorLeft}><Text style={styles.decorCandy}>✿</Text><Text style={styles.decorLeaf}>⌁</Text></View>
          <View style={styles.kitchenDecorRight}><Text style={styles.decorCandy}>✿</Text><Text style={styles.decorLeaf}>⌁</Text></View>
          <View style={styles.hudRow}>
            <View style={styles.movePlaque}>
              <View style={styles.plaqueCord} />
              <Text style={styles.moveLabel}>MOVE</Text>
              <Text style={styles.moveCount}>{engine.movesRemaining}</Text>
              <View style={styles.plaqueStars}><Text style={styles.plaqueStar}>★</Text><Text style={styles.plaqueStar}>★</Text><Text style={styles.plaqueStar}>★</Text></View>
            </View>
            <View style={styles.kitchenClock}><View style={styles.clockFace}><Text style={styles.clockHands}>◷</Text></View></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Game settings" onPress={() => setShowSettings(true)} style={styles.settingsButton}>
              <Text style={styles.settingsIcon}>⚙</Text>
            </Pressable>
          </View>
          <View pointerEvents="none" style={styles.mascot}>
            <Text style={styles.mascotHair}>👧🏼</Text>
            <Text style={styles.mascotCaption}>SWEET!</Text>
          </View>
          <View style={styles.objectivesBar}>
            {levelConfig.targets.map((target, index) => {
              const progress = objectiveValues[index] ?? 0;
              const complete = progress >= target.count;
              return (
                <View key={`${target.type}-${index}`} style={styles.objectivePill}>
                  <Text style={styles.objectiveIcon}>{cellObjectiveIcon(target.type)}</Text>
                  <Text style={styles.objectiveNumber}>{Math.min(progress, target.count)}/{target.count}</Text>
                  {complete ? <Text style={styles.objectiveCheck}>✓</Text> : null}
                </View>
              );
            })}
          </View>
          <View style={styles.counterRuffle}>
            {Array.from({ length: 20 }, (_, index) => (
              <View key={index} style={[styles.ruffleSquare, index % 2 === 0 && styles.ruffleAlternate]} />
            ))}
          </View>
        </View>

        <View
          style={styles.playfield}
          onPointerMove={movePointer}
          onTouchMove={movePointer}
        >
          <View style={[styles.boardFrame, { width: boardSize, height: boardSize }]}>
            {engine.grid.map((row, r) => (
              <View key={`row-${r}`} style={styles.boardRow}>
                {row.map((tile, c) => {
                  if (!tile) {
                    return <View key={`cell-${r}-${c}`} style={[styles.blockedCell, { width: cellSize, height: cellSize }]} />;
                  }
                  const isSelected = selectedCoord?.[0] === r && selectedCoord?.[1] === c;
                  const isTargeted = activeBooster !== null;
                  return (
                    <Pressable
                      key={tile.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${tile.color} candy${tile.hasJelly ? ', on ice' : ''}${tile.woodHealth ? ', in a crate' : ''}`}
                      onPress={() => {
                        if (swiped.current) {
                          swiped.current = false;
                          return;
                        }
                        handleCell(r, c);
                      }}
                      onPointerDown={(event) => startPointer(r, c, event)}
                      onTouchStart={(event) => startPointer(r, c, event)}
                      style={[
                        styles.cell,
                        { width: cellSize, height: cellSize },
                        isSelected && styles.selectedCell,
                        isTargeted && styles.targetCell,
                      ]}
                    >
                      <View pointerEvents="none" style={styles.candy}>
                        <VectorBird color={tile.color} size={cellSize * 0.84} />
                        {tile.special !== 'none' ? (
                          <View style={styles.specialBadge}>
                            <Text style={styles.specialText}>{tile.special === 'disco' ? '🌈' : tile.special === 'wrapped' ? '💥' : '✦'}</Text>
                          </View>
                        ) : null}
                        {tile.hasBear ? <Text style={styles.bearBadge}>🐻</Text> : null}
                        {tile.hasJelly ? <View style={styles.jellyLayer} /> : null}
                        {tile.woodHealth > 0 ? (
                          <View style={styles.woodLayer}>
                            <View style={styles.woodHorizontal} />
                            <View style={styles.woodVertical} />
                            <Text style={styles.woodHealth}>{tile.woodHealth === 1 ? '╳' : ''}</Text>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
          {toast ? <View pointerEvents="none" style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View> : null}
        </View>

        <View style={styles.bottomDock}>
          {BOOSTERS.map((booster) => (
            <Pressable
              key={booster.id}
              accessibilityRole="button"
              accessibilityLabel={`${booster.label}, ${boosterCount(booster.id)} available`}
              accessibilityState={{ selected: activeBooster === booster.id }}
              onPress={() => activateBooster(booster.id)}
              style={[styles.boosterButton, activeBooster === booster.id && styles.boosterActive]}
            >
              <Text style={styles.boosterIcon}>{booster.icon}</Text>
              <View style={styles.boosterCount}><Text style={styles.boosterCountText}>{boosterCount(booster.id)}</Text></View>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel="Return to level map" onPress={onBack} style={styles.mapButton}>
            <Text style={styles.mapButtonText}>MAP</Text>
          </Pressable>
        </View>

        <LevelModal
          visible={showResult}
          finalLevel={levelId === 50}
          levelName={`Level ${levelId}`}
          score={engine.score}
          starsEarned={starsEarned}
          objectives={levelConfig.targets.map((target) => ({
            icon: cellObjectiveIcon(target.type),
            progress: engine.getTargetProgress(target),
            count: target.count,
          }))}
          onContinue={() => onLevelComplete(starsEarned)}
        />

        <Modal visible={outOfMoves} transparent animationType="fade" onRequestClose={() => setOutOfMoves(false)}>
          <View style={styles.modalScrim}>
            <View style={styles.pauseCard}>
              <Text style={styles.pauseTitle}>OUT OF MOVES</Text>
              <Text style={styles.pauseDescription}>Try the level again to finish the goals.</Text>
              <Text style={styles.livesText}>❤️ {playerData.lives} lives left</Text>
              <Pressable onPress={restartLevel} style={styles.modalPrimary}><Text style={styles.modalPrimaryText}>TRY AGAIN</Text></Pressable>
              <Pressable onPress={onBack} style={styles.modalSecondary}><Text style={styles.modalSecondaryText}>LEVEL MAP</Text></Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
          <View style={styles.modalScrim}>
            <View style={styles.pauseCard}>
              <Text style={styles.pauseTitle}>PAUSE</Text>
              <Text style={styles.pauseDescription}>Level {levelId} · {engine.movesRemaining} moves remaining</Text>
              <Pressable onPress={() => soundManager.toggleMute()} style={styles.modalSecondary}>
                <Text style={styles.modalSecondaryText}>{soundManager.getMuted() ? 'TURN SOUND ON' : 'MUTE SOUND'}</Text>
              </Pressable>
              <Pressable onPress={() => setShowSettings(false)} style={styles.modalPrimary}><Text style={styles.modalPrimaryText}>RESUME</Text></Pressable>
              <Pressable onPress={onBack} style={styles.modalSecondary}><Text style={styles.modalSecondaryText}>LEVEL MAP</Text></Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5D66B' },
  game: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', overflow: 'hidden', backgroundColor: '#EAB18E' },
  kitchen: { width: '100%', backgroundColor: '#F2D76C', overflow: 'hidden', borderBottomWidth: 3, borderBottomColor: '#D69969' },
  kitchenDecorLeft: { position: 'absolute', top: 34, left: 20, width: 66, height: 76, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  kitchenDecorRight: { position: 'absolute', top: 27, right: 86, width: 60, height: 66, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' },
  decorCandy: { color: '#FFE79A', fontSize: 35 },
  decorLeaf: { position: 'absolute', bottom: 4, color: '#8BA751', fontSize: 35, transform: [{ rotate: '28deg' }] },
  hudRow: { zIndex: 2, height: 96, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  movePlaque: { width: 93, height: 90, marginLeft: 4, backgroundColor: '#FFF1CE', borderColor: '#098C83', borderWidth: 5, borderTopWidth: 0, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'center', paddingTop: 13, shadowColor: '#674420', shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  plaqueCord: { position: 'absolute', top: -1, left: 16, right: 16, height: 12, borderBottomWidth: 3, borderColor: '#C69849' },
  moveLabel: { color: '#9D6D54', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  moveCount: { color: '#7F4D33', fontSize: 34, lineHeight: 37, fontWeight: '900' },
  plaqueStars: { flexDirection: 'row', gap: 2, marginTop: -1 },
  plaqueStar: { color: '#F7C629', fontSize: 15, textShadowColor: '#AA7409', textShadowRadius: 2 },
  kitchenClock: { position: 'absolute', left: '45%', top: 34, width: 56, height: 56, borderRadius: 29, borderWidth: 5, borderColor: '#70C5A7', backgroundColor: '#FFF7DF', alignItems: 'center', justifyContent: 'center' },
  clockFace: { width: 42, height: 42, borderRadius: 22, backgroundColor: '#FEF5D8', alignItems: 'center', justifyContent: 'center' },
  clockHands: { color: '#7C9B62', fontSize: 32, lineHeight: 36 },
  settingsButton: { width: 43, height: 43, borderRadius: 23, marginTop: 12, backgroundColor: '#4DB7E6', borderWidth: 4, borderColor: '#FFF4C7', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  settingsIcon: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  mascot: { position: 'absolute', right: 18, top: 47, width: 108, height: 119, alignItems: 'center', justifyContent: 'flex-end', zIndex: 1 },
  mascotHair: { fontSize: 69, lineHeight: 82 },
  mascotCaption: { color: '#9D5D65', backgroundColor: '#FFF5DB', borderRadius: 9, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 2, fontSize: 9, fontWeight: '900' },
  objectivesBar: { position: 'absolute', bottom: 21, left: 17, right: 124, zIndex: 3, flexDirection: 'row', justifyContent: 'flex-start', gap: 8 },
  objectivePill: { minWidth: 82, height: 43, borderRadius: 15, borderWidth: 2, borderColor: '#E8B773', backgroundColor: '#FFF5DB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, gap: 4, elevation: 3 },
  objectiveIcon: { fontSize: 23 },
  objectiveNumber: { color: '#7B4B34', fontSize: 13, fontWeight: '900' },
  objectiveCheck: { color: '#3DB653', fontSize: 17, fontWeight: '900' },
  counterRuffle: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#F2A6A0', borderTopWidth: 3, borderColor: '#FFF5E2' },
  ruffleSquare: { flex: 1, backgroundColor: '#FFF8E7', borderRightWidth: 1, borderRightColor: '#F0BBB1', transform: [{ skewX: '-12deg' }] },
  ruffleAlternate: { backgroundColor: '#F18889' },
  playfield: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAB18E', paddingVertical: 5 },
  boardFrame: { padding: 5, borderRadius: 15, borderWidth: 3, borderColor: '#547B9F', backgroundColor: '#344D70', shadowColor: '#55351D', shadowOpacity: 0.27, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  boardRow: { flexDirection: 'row' },
  blockedCell: { backgroundColor: 'transparent' },
  cell: { borderRadius: 8, backgroundColor: '#526F8F', borderColor: 'rgba(234,246,255,0.24)', borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  selectedCell: { borderWidth: 3, borderColor: '#FFE34E', zIndex: 2, transform: [{ scale: 1.05 }] },
  targetCell: { borderColor: '#F8D33C' },
  candy: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  specialBadge: { position: 'absolute', top: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: '#E86AD3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF' },
  specialText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  bearBadge: { position: 'absolute', top: -3, left: -3, fontSize: 17, zIndex: 2 },
  jellyLayer: { ...StyleSheet.absoluteFillObject, borderRadius: 8, backgroundColor: 'rgba(90, 204, 244, 0.30)', borderWidth: 2, borderColor: 'rgba(211,246,255,0.72)', zIndex: 3 },
  woodLayer: { ...StyleSheet.absoluteFillObject, borderRadius: 7, borderWidth: 3, borderColor: '#814614', backgroundColor: 'rgba(184, 112, 35, 0.96)', alignItems: 'center', justifyContent: 'center', zIndex: 4, overflow: 'hidden' },
  woodHorizontal: { position: 'absolute', top: '44%', left: -3, right: -3, height: 5, backgroundColor: '#D69A50', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#89531F' },
  woodVertical: { position: 'absolute', top: -3, bottom: -3, left: '45%', width: 5, backgroundColor: '#D69A50', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#89531F' },
  woodHealth: { position: 'absolute', color: '#4D2D18', fontSize: 24, fontWeight: '900' },
  toast: { position: 'absolute', top: 12, alignSelf: 'center', borderRadius: 20, backgroundColor: 'rgba(7,108,101,0.94)', borderWidth: 2, borderColor: '#B5EBD0', paddingHorizontal: 18, paddingVertical: 9, zIndex: 20 },
  toastText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  bottomDock: { minHeight: 78, paddingHorizontal: 13, paddingTop: 8, paddingBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', gap: 7, backgroundColor: '#078E84', borderTopWidth: 4, borderTopColor: '#59C9A4' },
  boosterButton: { width: 54, height: 54, borderRadius: 28, borderWidth: 4, borderColor: '#B8F1C1', backgroundColor: '#54C957', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  boosterActive: { backgroundColor: '#F6C533', borderColor: '#FFF4BD', transform: [{ scale: 1.08 }] },
  boosterIcon: { fontSize: 26 },
  boosterCount: { position: 'absolute', right: -5, bottom: -4, minWidth: 20, height: 20, borderRadius: 11, backgroundColor: '#E14E48', borderColor: '#FFF1D1', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  boosterCountText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  mapButton: { minWidth: 52, height: 44, borderRadius: 16, borderWidth: 2, borderColor: '#B9F2D1', backgroundColor: '#08756F', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  mapButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  modalScrim: { flex: 1, backgroundColor: 'rgba(31, 24, 36, 0.74)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  pauseCard: { width: '100%', maxWidth: 360, borderWidth: 4, borderColor: '#F2C779', borderRadius: 32, backgroundColor: '#0C9A8E', padding: 24, alignItems: 'center' },
  pauseTitle: { color: '#FFF8E5', fontSize: 27, fontWeight: '900', textAlign: 'center' },
  pauseDescription: { color: '#E0F7EA', fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 9, marginBottom: 15 },
  livesText: { color: '#FFF2D2', fontSize: 13, fontWeight: '800', marginBottom: 11 },
  modalPrimary: { width: '100%', minHeight: 52, borderRadius: 18, backgroundColor: '#5AD527', borderWidth: 3, borderColor: '#B8F184', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  modalPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  modalSecondary: { width: '100%', minHeight: 44, borderRadius: 15, backgroundColor: '#087B75', alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  modalSecondaryText: { color: '#FFF4D9', fontSize: 13, fontWeight: '900' },
});