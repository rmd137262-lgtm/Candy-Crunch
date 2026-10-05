import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ImageBackground,
  SafeAreaView,
  Platform,
  Pressable,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { soundManager } from '../src/game/soundManager';

const COLS = 7;
const ROWS = 9;
const STARTING_MOVES = 24;

const CANDY_ASSETS = {
  blue: require('../assets/images/candy_blue.png'),
  green: require('../assets/images/candy_green.png'),
  red: require('../assets/images/candy_red.png'),
  star: require('../assets/images/candy_star.png'),
  bomb: require('../assets/images/candy_bomb.png'),
  egg: require('../assets/images/candy_egg.png'),
};

const BASE_CANDIES = ['blue', 'green', 'red', 'star'];
const CANDY_IMAGE_SCALE: Record<string, { width: number; height: number }> = {
  blue: { width: 1.1, height: 1.13 },
  green: { width: 1.31, height: 1.32 },
  red: { width: 1.1, height: 1.06 },
  star: { width: 1.12, height: 1.17 },
};

export default function App() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const tileSize = Math.max(
    32,
    Math.floor(Math.min(screenWidth * 0.8, 380, ((screenHeight - 280) * COLS) / ROWS) / COLS),
  );
  const boardWidth = tileSize * COLS;
  const boardHeight = tileSize * ROWS;
  const candyImageSize = (candy: string) => {
    const scale = CANDY_IMAGE_SCALE[candy] ?? { width: 1.12, height: 1.12 };
    return { width: tileSize * scale.width, height: tileSize * scale.height };
  };
  const [screen, setScreen] = useState<'home' | 'game'>('home');
  const [board, setBoard] = useState<string[]>([]);
  const [moves, setMoves] = useState<number>(STARTING_MOVES);
  const [crateCells, setCrateCells] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [swapTargetIndex, setSwapTargetIndex] = useState<number | null>(null);

  const boardRef = useRef<string[]>([]);
  const movesRef = useRef<number>(STARTING_MOVES);
  const crateRef = useRef<number[]>([]);
  const gameOverRef = useRef<boolean>(false);
  const touchStartRef = useRef<{ x: number; y: number; index: number } | null>(null);
  const dragPosition = useRef(new Animated.ValueXY()).current;
  const swapPosition = useRef(new Animated.ValueXY()).current;
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    movesRef.current = moves;
  }, [moves]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  const makeCrates = () => {
    const cells: number[] = [];
    for (let r = ROWS - 3; r < ROWS; r++) {
      for (let c = 2; c < 5; c++) cells.push(r * COLS + c);
    }
    return cells;
  };

  const resetGame = () => {
    const startingCrates = makeCrates();
    const crateSet = new Set(startingCrates);
    const newBoard: string[] = [];

    for (let index = 0; index < ROWS * COLS; index++) {
      const r = Math.floor(index / COLS);
      const c = index % COLS;
      let candy = BASE_CANDIES[Math.floor(Math.random() * BASE_CANDIES.length)];
      if (!crateSet.has(index)) {
        for (let attempt = 0; attempt < 16; attempt++) {
          candy = BASE_CANDIES[Math.floor(Math.random() * BASE_CANDIES.length)];
          const horizontal = c >= 2
            && !crateSet.has(index - 1)
            && !crateSet.has(index - 2)
            && newBoard[index - 1] === candy
            && newBoard[index - 2] === candy;
          const vertical = r >= 2
            && !crateSet.has(index - COLS)
            && !crateSet.has(index - COLS * 2)
            && newBoard[index - COLS] === candy
            && newBoard[index - COLS * 2] === candy;
          if (!horizontal && !vertical) break;
        }
      }
      newBoard.push(candy);
    }

    crateRef.current = startingCrates;
    setCrateCells(startingCrates);
    setBoard(newBoard);
    boardRef.current = newBoard;
    setMoves(STARTING_MOVES);
    movesRef.current = STARTING_MOVES;
    setGameOver(false);
    gameOverRef.current = false;
    setResult(null);
  };

  const getIndicesMatches = (currentBoard: string[], blockedCells = crateRef.current) => {
    let matched = new Set<number>();
    const blocked = new Set(blockedCells);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 2; c++) {
        let i = r * COLS + c;
        let candy = currentBoard[i];
        if (
          candy
          && !blocked.has(i)
          && !blocked.has(i + 1)
          && !blocked.has(i + 2)
          && candy === currentBoard[i + 1]
          && candy === currentBoard[i + 2]
        ) {
          matched.add(i);
          matched.add(i + 1);
          matched.add(i + 2);
        }
      }
    }

    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 2; r++) {
        let i = r * COLS + c;
        let candy = currentBoard[i];
        if (
          candy
          && !blocked.has(i)
          && !blocked.has(i + COLS)
          && !blocked.has(i + COLS * 2)
          && candy === currentBoard[i + COLS]
          && candy === currentBoard[i + COLS * 2]
        ) {
          matched.add(i);
          matched.add(i + COLS);
          matched.add(i + 2 * COLS);
        }
      }
    }
    return Array.from(matched);
  };

  const applyGravityAndFill = (currentBoard: string[], matchedIndices: number[], remainingMoves: number) => {
    soundManager.playPop();
    soundManager.playBlast();
    let newBoard = [...currentBoard];
    const remainingCrates = new Set(crateRef.current);
    let pending = matchedIndices;
    let cascade = 0;

    while (pending.length > 0 && cascade < 10) {
      const cleared = new Set(pending);
      cleared.forEach((idx) => {
        newBoard[idx] = '';
        const r = Math.floor(idx / COLS);
        const c = idx % COLS;
        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            remainingCrates.delete(nr * COLS + nc);
          }
        });
      });

      for (let c = 0; c < COLS; c++) {
        let row = ROWS - 1;
        while (row >= 0) {
          if (remainingCrates.has(row * COLS + c)) {
            row--;
            continue;
          }
          const segmentBottom = row;
          while (row >= 0 && !remainingCrates.has(row * COLS + c)) row--;
          const segmentTop = row + 1;
          const falling: string[] = [];
          for (let r = segmentBottom; r >= segmentTop; r--) {
            const candy = newBoard[r * COLS + c];
            if (candy) falling.push(candy);
          }
          let writeRow = segmentBottom;
          falling.forEach((candy) => {
            newBoard[writeRow * COLS + c] = candy;
            writeRow--;
          });
          while (writeRow >= segmentTop) {
            newBoard[writeRow * COLS + c] = BASE_CANDIES[Math.floor(Math.random() * BASE_CANDIES.length)];
            writeRow--;
          }
        }
      }

      cascade++;
      pending = getIndicesMatches(newBoard, Array.from(remainingCrates));
      if (pending.length > 0) {
        soundManager.playBlast();
      }
    }

    const updatedCrates = Array.from(remainingCrates);
    crateRef.current = updatedCrates;
    setCrateCells(updatedCrates);
    setMoves(remainingMoves);
    movesRef.current = remainingMoves;
    setBoard(newBoard);
    boardRef.current = newBoard;

    if (updatedCrates.length === 0) {
      setGameOver(true);
      gameOverRef.current = true;
      setResult('win');
      soundManager.playWin();
    } else if (remainingMoves <= 0) {
      setGameOver(true);
      gameOverRef.current = true;
      setResult('lose');
      soundManager.playOver();
    }
  };

  const getSwapCandidate = (startIndex: number, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOverRef.current || movesRef.current <= 0 || isAnimatingRef.current) return null;

    const row = Math.floor(startIndex / COLS);
    const col = startIndex % COLS;
    let targetIndex = -1;

    if (direction === 'LEFT' && col > 0) targetIndex = startIndex - 1;
    if (direction === 'RIGHT' && col < COLS - 1) targetIndex = startIndex + 1;
    if (direction === 'UP' && row > 0) targetIndex = startIndex - COLS;
    if (direction === 'DOWN' && row < ROWS - 1) targetIndex = startIndex + COLS;

    if (targetIndex === -1) return null;
    const blocked = new Set(crateRef.current);
    if (blocked.has(startIndex) || blocked.has(targetIndex)) return null;

    const swapped = [...boardRef.current];
    const temp = swapped[startIndex];
    swapped[startIndex] = swapped[targetIndex];
    swapped[targetIndex] = temp;

    const matches = getIndicesMatches(swapped);
    const matchUsesMovedCandy = matches.some((index) => index === startIndex || index === targetIndex);
    if (matches.length === 0 || !matchUsesMovedCandy) return null;
    return { targetIndex, swapped, matches };
  };

  const commitSwap = (candidate: NonNullable<ReturnType<typeof getSwapCandidate>>) => {
    soundManager.playSwap();
    const remainingMoves = movesRef.current - 1;
    setBoard(candidate.swapped);
    boardRef.current = candidate.swapped;
    applyGravityAndFill(candidate.swapped, candidate.matches, remainingMoves);
  };

  const getPointerPosition = (event: any) => {
    const native = event?.nativeEvent ?? event;
    const point = native.changedTouches?.[0] ?? native.touches?.[0] ?? native;
    return {
      x: point.pageX ?? point.clientX ?? 0,
      y: point.pageY ?? point.clientY ?? 0,
    };
  };

  const handlePointerDown = (event: any, index: number) => {
    if (gameOverRef.current || movesRef.current <= 0 || isAnimatingRef.current) return;
    const { x, y } = getPointerPosition(event);
    if (new Set(crateRef.current).has(index)) return;
    touchStartRef.current = { x, y, index };
    dragPosition.setValue({ x: 0, y: 0 });
    swapPosition.setValue({ x: 0, y: 0 });
    setSwapTargetIndex(null);
    setDraggedIndex(index);

    const pointerId = event?.nativeEvent?.pointerId ?? event?.pointerId;
    if (Platform.OS === 'web' && pointerId !== undefined) {
      event?.currentTarget?.setPointerCapture?.(pointerId);
    }
  };

  const handlePointerMove = (event: any) => {
    const start = touchStartRef.current;
    if (!start || isAnimatingRef.current) return;
    const { x, y } = getPointerPosition(event);
    dragPosition.setValue({ x: x - start.x, y: y - start.y });
  };

  const clearDrag = () => {
    dragPosition.setValue({ x: 0, y: 0 });
    swapPosition.setValue({ x: 0, y: 0 });
    setDraggedIndex(null);
    setSwapTargetIndex(null);
    isAnimatingRef.current = false;
  };

  const animateDragBack = () => {
    isAnimatingRef.current = true;
    Animated.parallel([
      Animated.timing(dragPosition, {
        toValue: { x: 0, y: 0 },
        duration: 140,
        useNativeDriver: false,
      }),
      Animated.timing(swapPosition, {
        toValue: { x: 0, y: 0 },
        duration: 140,
        useNativeDriver: false,
      }),
    ]).start(clearDrag);
  };

  const handlePointerUp = (event: any) => {
    const start = touchStartRef.current;
    if (!start) return;
    const { x, y } = getPointerPosition(event);
    const dx = x - start.x;
    const dy = y - start.y;
    touchStartRef.current = null;
    const threshold = 12;

    if (Math.abs(dx) <= threshold && Math.abs(dy) <= threshold) {
      animateDragBack();
      return;
    }

    const direction = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'RIGHT' : 'LEFT')
      : (dy > 0 ? 'DOWN' : 'UP');
    const candidate = getSwapCandidate(start.index, direction);
    if (!candidate) {
      animateDragBack();
      return;
    }

    const startRow = Math.floor(start.index / COLS);
    const startCol = start.index % COLS;
    const targetRow = Math.floor(candidate.targetIndex / COLS);
    const targetCol = candidate.targetIndex % COLS;
    const offsetX = (targetCol - startCol) * tileSize;
    const offsetY = (targetRow - startRow) * tileSize;
    setSwapTargetIndex(candidate.targetIndex);
    isAnimatingRef.current = true;

    Animated.parallel([
      Animated.timing(dragPosition, {
        toValue: { x: offsetX, y: offsetY },
        duration: 145,
        useNativeDriver: false,
      }),
      Animated.timing(swapPosition, {
        toValue: { x: -offsetX, y: -offsetY },
        duration: 145,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) commitSwap(candidate);
      clearDrag();
    });
  };

  const handlePointerCancel = () => {
    if (!touchStartRef.current) return;
    touchStartRef.current = null;
    animateDragBack();
  };

  const crateSet = new Set(crateCells);

  if (screen === 'home') {
    return (
      <SafeAreaView style={styles.homeContainer}>
        <ImageBackground
          source={require('../assets/images/map_bg.png')}
          resizeMode="cover"
          style={styles.homeBackground}
        >
          <View style={styles.homeShade}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isMuted ? 'Turn sound on' : 'Mute sound'}
              onPress={() => setIsMuted(soundManager.toggleMute())}
              style={styles.soundButton}
            >
              <Text style={styles.soundButtonText}>{isMuted ? '🔇' : '🔊'}</Text>
            </Pressable>
            <View style={styles.homeContent}>
              <Image
                source={require('../assets/images/candy-crunch-logo.png')}
                style={styles.homeLogo}
                resizeMode="contain"
              />
              <Text style={styles.homeTagline}>MATCH · POP · PLAY</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  resetGame();
                  soundManager.playBGM();
                  setScreen('game');
                }}
                style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
              >
                <Text style={styles.playButtonText}>PLAY</Text>
              </Pressable>
            </View>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.gameContainer}>
      <View style={styles.kitchenHeader}>
        <View style={styles.topTableBar}>
          <View style={styles.moveTag}>
            <Text style={styles.moveLabel}>MOVE</Text>
            <Text style={styles.moveCount}>{moves}</Text>
          </View>

          <View style={styles.targetPlate}>
            <View style={styles.targetCrateIcon}>
              <View style={styles.targetCrateInset} />
              <View style={styles.targetCrateCross} />
            </View>
            <View style={styles.numberBadge}>
              <Text style={styles.targetBadgeText}>{crateCells.length}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to home screen"
            onPress={() => setScreen('home')}
            style={styles.homeButton}
          >
            <Text style={styles.homeButtonText}>⌂</Text>
          </Pressable>
        </View>
        <View style={styles.checkeredTrim}>
          {Array.from({ length: 22 }, (_, index) => (
            <View key={index} style={[styles.trimSquare, index % 2 === 0 && styles.trimSquarePink]} />
          ))}
        </View>
      </View>

      <View style={styles.gameField}>
        <View style={[styles.boardContainer, { width: boardWidth + 10, height: boardHeight + 10 }]}>
        <View
          style={[styles.board, { width: boardWidth, height: boardHeight }]}
          // @ts-ignore
          onPointerMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          onPointerCancel={handlePointerCancel}
          onTouchCancel={handlePointerCancel}
          onPointerUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
        >
          {board.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tile,
                { width: tileSize, height: tileSize },
                Platform.OS === 'web' ? ({ touchAction: 'none', userSelect: 'none' } as any) : {},
              ]}
              // @ts-ignore
              onPointerDown={(e) => handlePointerDown(e, index)}
              onTouchStart={(e) => handlePointerDown(e, index)}
            >
              {crateSet.has(index) ? (
                <View style={styles.crateTile}>
                  <View style={styles.crateInset} />
                  <View style={styles.crateHorizontal} />
                  <View style={styles.crateVertical} />
                </View>
              ) : item ? (
                <View style={[styles.candyClip, { width: tileSize, height: tileSize }]}>
                  <Image
                    source={CANDY_ASSETS[item as keyof typeof CANDY_ASSETS]}
                    style={[
                      candyImageSize(item),
                      (draggedIndex === index || swapTargetIndex === index) && styles.hiddenCandy,
                    ]}
                    resizeMode="stretch"
                  />
                </View>
              ) : null}
            </View>
          ))}
          {draggedIndex !== null && board[draggedIndex] ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.draggedCandy,
                {
                  left: (draggedIndex % COLS) * tileSize,
                  top: Math.floor(draggedIndex / COLS) * tileSize,
                  width: tileSize,
                  height: tileSize,
                  transform: [
                    { translateX: dragPosition.x },
                    { translateY: dragPosition.y },
                    { scale: 1.12 },
                  ],
                },
              ]}
            >
              <View style={[styles.candyClip, { width: tileSize, height: tileSize }]}>
                <Image
                  source={CANDY_ASSETS[board[draggedIndex] as keyof typeof CANDY_ASSETS]}
                  style={candyImageSize(board[draggedIndex])}
                  resizeMode="stretch"
                />
              </View>
            </Animated.View>
          ) : null}
          {swapTargetIndex !== null && board[swapTargetIndex] ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.draggedCandy,
                styles.swappingCandy,
                {
                  left: (swapTargetIndex % COLS) * tileSize,
                  top: Math.floor(swapTargetIndex / COLS) * tileSize,
                  width: tileSize,
                  height: tileSize,
                  transform: [
                    { translateX: swapPosition.x },
                    { translateY: swapPosition.y },
                  ],
                },
              ]}
            >
              <View style={[styles.candyClip, { width: tileSize, height: tileSize }]}>
                <Image
                  source={CANDY_ASSETS[board[swapTargetIndex] as keyof typeof CANDY_ASSETS]}
                  style={candyImageSize(board[swapTargetIndex])}
                  resizeMode="stretch"
                />
              </View>
            </Animated.View>
          ) : null}
        </View>
        </View>
        <Text style={styles.boardHint}>Match 3 candies to break the crates</Text>
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarText}>Clear the crates before your moves run out!</Text>
      </View>

      {result ? (
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{result === 'win' ? 'LEVEL COMPLETE!' : 'OUT OF MOVES'}</Text>
            <Text style={styles.resultMessage}>
              {result === 'win' ? 'You cleared every crate!' : `${crateCells.length} crates left. Try again!`}
            </Text>
            <Pressable onPress={resetGame} style={styles.resultPrimary}>
              <Text style={styles.resultPrimaryText}>{result === 'win' ? 'PLAY AGAIN' : 'RETRY'}</Text>
            </Pressable>
            <Pressable onPress={() => setScreen('home')} style={styles.resultSecondary}>
              <Text style={styles.resultSecondaryText}>HOME</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  homeContainer: { flex: 1, backgroundColor: '#1B3668' },
  homeBackground: { flex: 1, width: '100%' },
  homeShade: { flex: 1, backgroundColor: 'rgba(15, 27, 61, 0.22)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  soundButton: { position: 'absolute', top: 18, right: 18, zIndex: 3, width: 46, height: 46, borderRadius: 24, backgroundColor: '#0D7C83', borderWidth: 3, borderColor: '#DFF8D0', alignItems: 'center', justifyContent: 'center' },
  soundButtonText: { fontSize: 21 },
  homeContent: { width: '100%', maxWidth: 420, alignItems: 'center', justifyContent: 'center', paddingVertical: 22, borderRadius: 34, backgroundColor: 'rgba(255, 246, 218, 0.82)', borderWidth: 3, borderColor: '#F6CF69' },
  homeLogo: { width: '78%', maxWidth: 300, height: 290 },
  homeTagline: { color: '#704183', fontSize: 14, fontWeight: '900', letterSpacing: 3, marginTop: -5, marginBottom: 20 },
  playButton: { width: '72%', minHeight: 64, borderRadius: 23, backgroundColor: '#50CD37', borderWidth: 4, borderColor: '#B9F68C', alignItems: 'center', justifyContent: 'center', shadowColor: '#244413', shadowOpacity: 0.28, shadowRadius: 6, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  playButtonPressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  playButtonText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: 2, textShadowColor: '#328220', textShadowRadius: 3 },
  gameContainer: { flex: 1, backgroundColor: '#EBAF90', alignItems: 'center' },
  kitchenHeader: { width: '100%', backgroundColor: '#D8E362', borderBottomWidth: 3, borderBottomColor: '#C78F67', paddingTop: 6, alignItems: 'center' },
  topTableBar: { width: '90%', maxWidth: 430, minHeight: 89, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6 },
  moveTag: { minWidth: 94, height: 83, backgroundColor: '#FFF1D2', borderWidth: 4, borderTopWidth: 0, borderColor: '#09938C', borderBottomLeftRadius: 25, borderBottomRightRadius: 25, alignItems: 'center', justifyContent: 'center', paddingTop: 5, shadowColor: '#4B4C28', shadowOpacity: 0.22, shadowRadius: 3, elevation: 5 },
  moveLabel: { fontSize: 12, color: '#88634E', fontWeight: '900', letterSpacing: 1.4 },
  moveCount: { fontSize: 35, lineHeight: 39, fontWeight: '900', color: '#78492F' },
  targetPlate: { width: 62, height: 57, backgroundColor: '#FFF3D5', borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#F1BB6C', position: 'relative', marginRight: 20 },
  targetCrateIcon: { width: 35, height: 35, backgroundColor: '#A75E22', borderWidth: 3, borderColor: '#724016', borderRadius: 5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  targetCrateInset: { position: 'absolute', width: 19, height: 19, borderWidth: 3, borderColor: '#D5903B', backgroundColor: '#B9762D' },
  targetCrateCross: { position: 'absolute', width: 37, height: 4, backgroundColor: '#E0A657', transform: [{ rotate: '-43deg' }] },
  numberBadge: { position: 'absolute', bottom: -8, right: -10, minWidth: 25, height: 25, backgroundColor: '#EB4D4A', paddingHorizontal: 6, borderRadius: 13, borderWidth: 2, borderColor: '#FFF1D2', alignItems: 'center', justifyContent: 'center' },
  targetBadgeText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  homeButton: { width: 46, height: 46, borderRadius: 24, backgroundColor: '#49B6E1', borderWidth: 4, borderColor: '#FFF3CF', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  homeButtonText: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', lineHeight: 30 },
  checkeredTrim: { height: 18, width: '100%', flexDirection: 'row', borderTopWidth: 2, borderColor: '#FFF4DC', overflow: 'hidden' },
  trimSquare: { flex: 1, backgroundColor: '#FFF6E4', borderRightWidth: 1, borderRightColor: '#E4B7A0' },
  trimSquarePink: { backgroundColor: '#F0878B' },
  gameField: { flex: 1, width: '100%', minHeight: 0, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  boardContainer: { padding: 5, backgroundColor: '#4A6590', borderWidth: 2, borderColor: '#829AC3', borderRadius: 14, shadowColor: '#513C31', shadowOpacity: 0.27, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  board: { position: 'relative', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#3D557D', borderRadius: 8, overflow: 'hidden' },
  tile: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(227, 239, 255, 0.27)', backgroundColor: '#6B83AA', padding: 0, margin: 0 },
  candyClip: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  hiddenCandy: { opacity: 0 },
  draggedCandy: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 20, shadowColor: '#20150E', shadowOpacity: 0.32, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 14 },
  swappingCandy: { zIndex: 15 },
  crateTile: { width: '100%', height: '100%', backgroundColor: '#A9692D', borderWidth: 3, borderColor: '#73421E', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  crateInset: { position: 'absolute', width: '68%', height: '68%', borderWidth: 4, borderColor: '#D59A54', backgroundColor: '#B87835' },
  crateHorizontal: { position: 'absolute', left: -2, right: -2, height: 5, backgroundColor: '#D89E58', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#885322' },
  crateVertical: { position: 'absolute', top: -2, bottom: -2, width: 5, backgroundColor: '#D89E58', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#885322' },
  boardHint: { color: '#7E4E3A', fontSize: 12, fontWeight: '800', marginTop: 10 },
  bottomBar: { minHeight: 49, width: '100%', backgroundColor: '#0A9186', borderTopWidth: 3, borderTopColor: '#6ACDA7', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  bottomBarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  resultOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(31, 24, 36, 0.72)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 10 },
  resultCard: { width: '100%', maxWidth: 350, borderRadius: 30, borderWidth: 4, borderColor: '#F4C87D', backgroundColor: '#0C9A8E', padding: 24, alignItems: 'center' },
  resultTitle: { color: '#FFF8E5', fontSize: 25, fontWeight: '900', textAlign: 'center' },
  resultMessage: { color: '#E0F7EA', fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 10, marginBottom: 14 },
  resultPrimary: { width: '100%', minHeight: 54, borderRadius: 18, backgroundColor: '#5AD527', borderWidth: 3, borderColor: '#B8F184', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  resultPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  resultSecondary: { width: '100%', minHeight: 44, borderRadius: 15, backgroundColor: '#087B75', alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  resultSecondaryText: { color: '#FFF4D9', fontSize: 13, fontWeight: '900' },
});
