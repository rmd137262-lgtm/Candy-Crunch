
const { width: MAP_SCREEN_W } = Dimensions.get('window');
const MAP_W = MAP_SCREEN_W;
const MAP_H = MAP_SCREEN_W * 2.16;

const WORLD_1_POINTS = [
  { x: 0.524, y: 0.854 }, { x: 0.672, y: 0.772 }, { x: 0.491, y: 0.694 },
  { x: 0.333, y: 0.621 }, { x: 0.509, y: 0.567 }, { x: 0.669, y: 0.496 },
  { x: 0.483, y: 0.431 }, { x: 0.316, y: 0.359 }, { x: 0.504, y: 0.295 },
  { x: 0.644, y: 0.238 }, { x: 0.779, y: 0.177 },
];

const MAP_CONFIGS = [
  { name: 'Candy Village', getBg: () => require('../assets/images/map_bg_1.png'), points: WORLD_1_POINTS },
  { name: 'Choco Valley', getBg: () => require('../assets/images/map_bg_2.png'), points: WORLD_1_POINTS },
  { name: 'Blue Ice Bay', getBg: () => require('../assets/images/map_bg_3.png'), points: WORLD_1_POINTS },
  { name: 'Gummy Jungle', getBg: () => require('../assets/images/map_bg_4.png'), points: WORLD_1_POINTS },
];

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
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import { soundManager } from '../src/game/soundManager';


interface LevelConfig {
  id: number;
  moves: number;
  rows: number;
  cols: number;
  crates: number;
}

interface LevelConfig {
  id: number;
  moves: number;
  rows: number;
  cols: number;
  crates: number;
}

const GAME_LEVELS: LevelConfig[] = [
  { id: 1, moves: 24, rows: 9, cols: 7, crates: 6 },
  { id: 2, moves: 22, rows: 8, cols: 8, crates: 10 },
  { id: 3, moves: 24, rows: 8, cols: 7, crates: 14 },
  { id: 4, moves: 25, rows: 9, cols: 7, crates: 18 },
  { id: 5, moves: 26, rows: 7, cols: 7, crates: 12 },
  { id: 6, moves: 25, rows: 9, cols: 8, crates: 20 },
  { id: 7, moves: 23, rows: 8, cols: 8, crates: 16 },
  { id: 8, moves: 25, rows: 9, cols: 8, crates: 22 },
  { id: 9, moves: 26, rows: 8, cols: 6, crates: 16 },
  { id: 10, moves: 28, rows: 8, cols: 8, crates: 24 },
];

let COLS = 7;
let ROWS = 9;
const STARTING_MOVES = 24;

const CANDY_ASSETS: Record<string, any> = {
  blue: require('../assets/images/candy_blue.png'),
  red: require('../assets/images/candy_red.png'),
  star: require('../assets/images/candy_star.png'),
  candy_purple_gold: require('../assets/images/candy_purple_gold.png'),
  candy_star_swirl: require('../assets/images/candy_star_swirl.png'),
  bomb: require('../assets/images/candy_bomb.png'),
  egg: require('../assets/images/candy_egg.png'),
};

const BASE_CANDIES = ['blue', 'red', 'star', 'candy_purple_gold', 'candy_star_swirl'];

const CANDY_PARTICLE_COLORS: Record<string, string> = {
  blue: '#00E5FF',
  red: '#FF1744',
  star: '#FFD600',
  candy_purple_gold: '#9B5DE5',
  candy_star_swirl: '#00F5D4',
  bomb: '#E040FB',
  egg: '#FF4081',
};

const CANDY_IMAGE_SCALE: Record<string, { width: number; height: number }> = {
  blue: { width: 1.1, height: 1.13 },
  red: { width: 1.1, height: 1.06 },
  star: { width: 1.12, height: 1.17 },
  candy_purple_gold: { width: 1.1, height: 1.1 },
  candy_star_swirl: { width: 1.1, height: 1.1 },
  bomb: { width: 1.25, height: 1.25 },
  egg: { width: 1.15, height: 1.15 },
};

interface LaserLine {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export default function App() {
  const [activeModal, setActiveModal] = useState<'shop' | 'earn' | null>(null);
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
  const [currentLevel, setCurrentLevel] = useState(1);
  const [moves, setMoves] = useState<number>(STARTING_MOVES);
  const [crateCells, setCrateCells] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [swapTargetIndex, setSwapTargetIndex] = useState<number | null>(null);
  const [lasers, setLasers] = useState<LaserLine[]>([]);
  const [spinningBombIndex, setSpinningBombIndex] = useState<number | null>(null);
  const bombSpinAnim = useRef(new Animated.Value(0)).current;
  const [matchedIndicesState, setMatchedIndicesState] = useState<number[]>([]);

  const columnDropAnims = useRef(
    Array.from({ length: 12 }, () => new Animated.Value(0))
  ).current;

  const boardRef = useRef<string[]>([]);
  const movesRef = useRef<number>(STARTING_MOVES);
  const crateRef = useRef<number[]>([]);
  const gameOverRef = useRef<boolean>(false);
  const touchStartRef = useRef<{ x: number; y: number; index: number } | null>(null);
  const dragPosition = useRef(new Animated.ValueXY()).current;
  const swapPosition = useRef(new Animated.ValueXY()).current;
  const isAnimatingRef = useRef(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    movesRef.current = moves;
  }, [moves]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  const makeCrates = (crateCount = 8, activeRows = ROWS, activeCols = COLS) => {
    const total = activeRows * activeCols;
    const crates: number[] = [];
    while (crates.length < Math.min(crateCount, total - 10)) {
      const r = Math.floor(Math.random() * activeRows);
      const c = Math.floor(Math.random() * activeCols);
      const idx = r * activeCols + c;
      if (!crates.includes(idx)) crates.push(idx);
    }
    return crates;
  };

  const old_makeCrates = () => {
    const cells: number[] = [];
    for (let r = ROWS - 3; r < ROWS; r++) {
      for (let c = 2; c < 5; c++) cells.push(r * COLS + c);
    }
    return cells;
  };

  const nextLevel = () => {
    const nextLvl = currentLevel < 10 ? currentLevel + 1 : 1;
    setCurrentLevel(nextLvl);
    resetGame(nextLvl);
  };

  const resetGame = (targetLvl?: number) => {
    const lvlNum = typeof targetLvl === "number" ? targetLvl : currentLevel;
    const lvlCfg = GAME_LEVELS.find(l => l.id === lvlNum) || GAME_LEVELS[0];
    COLS = lvlCfg.cols;
    ROWS = lvlCfg.rows;
    setMoves(lvlCfg.moves);
    setResult(null);
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
          const horizontal =
            c >= 2 &&
            !crateSet.has(index - 1) &&
            !crateSet.has(index - 2) &&
            newBoard[index - 1] === candy &&
            newBoard[index - 2] === candy;
          const vertical =
            r >= 2 &&
            !crateSet.has(index - COLS) &&
            !crateSet.has(index - COLS * 2) &&
            newBoard[index - COLS] === candy &&
            newBoard[index - COLS * 2] === candy;
          if (!horizontal && !vertical) break;
        }
      }
      newBoard.push(candy);
    }

    crateRef.current = startingCrates;
    setCrateCells(startingCrates);
    setBoard(newBoard);
    boardRef.current = newBoard;
    // Reset animated values for new board tile count
    if (typeof initAnimations === "function") {
      initAnimations(newBoard.length);
    }
    setMoves(STARTING_MOVES);
    movesRef.current = STARTING_MOVES;
    setGameOver(false);
    gameOverRef.current = false;
    setResult(null);
    setLasers([]);
    setMatchedIndicesState([]);
  };

  const getIndicesMatchesWithSpecials = (currentBoard: string[], blockedCells = crateRef.current) => {
    let matched = new Set<number>();
    const blocked = new Set(blockedCells);
    let specialCreations: { index: number; type: string }[] = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; ) {
        const start = r * COLS + c;
        const color = currentBoard[start];
        if (!color || color === 'bomb' || blocked.has(start)) {
          c++;
          continue;
        }
        let len = 1;
        while (c + len < COLS) {
          const idx = r * COLS + (c + len);
          if (currentBoard[idx] === color && !blocked.has(idx)) {
            len++;
          } else {
            break;
          }
        }
        if (len >= 3) {
          for (let k = 0; k < len; k++) matched.add(r * COLS + (c + k));
          if (len >= 5) {
            specialCreations.push({ index: r * COLS + (c + Math.floor(len / 2)), type: 'bomb' });
          }
        }
        c += len;
      }
    }

    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; ) {
        const start = r * COLS + c;
        const color = currentBoard[start];
        if (!color || color === 'bomb' || blocked.has(start)) {
          r++;
          continue;
        }
        let len = 1;
        while (r + len < ROWS) {
          const idx = (r + len) * COLS + c;
          if (currentBoard[idx] === color && !blocked.has(idx)) {
            len++;
          } else {
            break;
          }
        }
        if (len >= 3) {
          for (let k = 0; k < len; k++) matched.add((r + k) * COLS + c);
          if (len >= 5) {
            specialCreations.push({ index: (r + Math.floor(len / 2)) * COLS + c, type: 'bomb' });
          }
        }
        r += len;
      }
    }

    return { matched: Array.from(matched), specialCreations };
  };

  const applyGravityAndFill = (
    currentBoard: string[],
    matchedIndices: number[],
    remainingMoves: number,
    specialCreations: { index: number; type: string }[] = [],
  ) => {
    soundManager.playPop();
    setMatchedIndicesState(matchedIndices);

    setTimeout(() => {
      setMatchedIndicesState([]);
      soundManager.playBlast();

      let newBoard = [...currentBoard];
      const remainingCrates = new Set(crateRef.current);
      const affectedCols = new Set<number>();

      matchedIndices.forEach((idx) => {
        newBoard[idx] = '';
        const r = Math.floor(idx / COLS);
        const c = idx % COLS;
        affectedCols.add(c);

        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            remainingCrates.delete(nr * COLS + nc);
          }
        });
      });

      specialCreations.forEach((special) => {
        newBoard[special.index] = special.type;
      });

      affectedCols.forEach((c) => {
        let writeRow = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          const idx = r * COLS + c;
          if (remainingCrates.has(idx)) {
            writeRow = r - 1;
            continue;
          }
          if (newBoard[idx] !== '') {
            const targetIdx = writeRow * COLS + c;
            if (targetIdx !== idx) {
              newBoard[targetIdx] = newBoard[idx];
              newBoard[idx] = '';
            }
            writeRow--;
          }
        }
        for (let r = writeRow; r >= 0; r--) {
          const idx = r * COLS + c;
          if (!remainingCrates.has(idx)) {
            newBoard[idx] = BASE_CANDIES[Math.floor(Math.random() * BASE_CANDIES.length)];
          }
        }
      });

      const updatedCrates = Array.from(remainingCrates);
      crateRef.current = updatedCrates;
      setCrateCells(updatedCrates);
      setMoves(remainingMoves);
      movesRef.current = remainingMoves;
      setBoard(newBoard);
      boardRef.current = newBoard;

      const anims: Animated.CompositeAnimation[] = [];
      affectedCols.forEach((col) => {
        columnDropAnims[col].setValue(-1.5);
        anims.push(
          Animated.spring(columnDropAnims[col], {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          })
        );
      });

      Animated.parallel(anims).start(() => {
        const nextCheck = getIndicesMatchesWithSpecials(newBoard);
        if (nextCheck.matched.length > 0) {
          applyGravityAndFill(newBoard, nextCheck.matched, movesRef.current, nextCheck.specialCreations);
        } else {
          isAnimatingRef.current = false;
        }
      });

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
    }, 320);
  };
  
  const spawnTestBomb = () => {
    setBoard((prev) => {
      const next = [...prev];
      // Board ke beech me (center tile) bomb place karte hain
      const centerIndex = Math.floor(next.length / 2);
      next[centerIndex] = 'bomb';
      boardRef.current = next;
      return next;
    });
  };

  const executeColorBumperBlast = (bombIndex: number, targetColor: string, otherIndex: number) => {
    isAnimatingRef.current = true;
    setSpinningBombIndex(bombIndex);
    bombSpinAnim.setValue(0);

    // 1. Gol-gol tezi se ghumne wala animation (3 full 360 rotations)
    Animated.timing(bombSpinAnim, {
      toValue: 1,
      duration: 292,
      useNativeDriver: true,
    }).start();

    soundManager.playBlast();

    const fromC = bombIndex % COLS;
    const fromR = Math.floor(bombIndex / COLS);
    const startX = fromC * tileSize + tileSize / 2;
    const startY = fromR * tileSize + tileSize / 2;

    const matchedIndices: number[] = [bombIndex];
    const generatedLasers: LaserLine[] = [];

    boardRef.current.forEach((candy, idx) => {
      if (candy === targetColor && !crateRef.current.includes(idx)) {
        matchedIndices.push(idx);
        const toC = idx % COLS;
        const toR = Math.floor(idx / COLS);
        generatedLasers.push({
          id: `${bombIndex}->${idx}`,
          fromX: startX,
          fromY: startY,
          toX: toC * tileSize + tileSize / 2,
          toY: toR * tileSize + tileSize / 2,
        });
      }
    });

    // Bijli laser activate
    setLasers(generatedLasers);

    // Blast hote hi saare rainbow colors bikharna
    setTimeout(() => {
      const rainbowColors = ['#FF1744', '#00E5FF', '#FFD600', '#9B5DE5', '#00F5D4', '#FF4081', '#FFFFFF'];
      matchedIndices.forEach((cIdx) => {
        const cX = (cIdx % COLS) * tileSize + tileSize / 2;
        const cY = Math.floor(cIdx / COLS) * tileSize + tileSize / 2;
        rainbowColors.forEach((colorHex) => {
          triggerParticles(cX, cY, colorHex);
        });
      });

      setLasers([]);
      setSpinningBombIndex(null);
      const remainingMoves = movesRef.current - 1;
      applyGravityAndFill(boardRef.current, matchedIndices, remainingMoves, []);
    }, 220);
  };

  const getSwapTarget = (startIndex: number, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOverRef.current || movesRef.current <= 0 || isAnimatingRef.current) return -1;

    const row = Math.floor(startIndex / COLS);
    const col = startIndex % COLS;
    let targetIndex = -1;

    if (direction === 'LEFT' && col > 0) targetIndex = startIndex - 1;
    if (direction === 'RIGHT' && col < COLS - 1) targetIndex = startIndex + 1;
    if (direction === 'UP' && row > 0) targetIndex = startIndex - COLS;
    if (direction === 'DOWN' && row < ROWS - 1) targetIndex = startIndex + COLS;

    if (targetIndex === -1) return -1;
    const blocked = new Set(crateRef.current);
    if (blocked.has(startIndex) || blocked.has(targetIndex)) return -1;

    return targetIndex;
  };

  const handleSwipeMove = (startIndex: number, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const targetIndex = getSwapTarget(startIndex, direction);
    if (targetIndex === -1) {
      clearDrag();
      return;
    }

    const currentBoard = [...boardRef.current];
    const piece1 = currentBoard[startIndex];
    const piece2 = currentBoard[targetIndex];

    const dx = ((targetIndex % COLS) - (startIndex % COLS)) * tileSize;
    const dy = (Math.floor(targetIndex / COLS) - Math.floor(startIndex / COLS)) * tileSize;

    soundManager.playSwap();
    isAnimatingRef.current = true;
    setDraggedIndex(startIndex);
    setSwapTargetIndex(targetIndex);

    dragPosition.setValue({ x: 0, y: 0 });
    swapPosition.setValue({ x: 0, y: 0 });

    Animated.parallel([
      Animated.timing(dragPosition, {
        toValue: { x: dx, y: dy },
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(swapPosition, {
        toValue: { x: -dx, y: -dy },
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (piece1 === 'bomb' || piece2 === 'bomb') {
        const bombIndex = piece1 === 'bomb' ? startIndex : targetIndex;
        const otherPiece = piece1 === 'bomb' ? piece2 : piece1;
        const otherIndex = piece1 === 'bomb' ? targetIndex : startIndex;
        clearDrag();
        executeColorBumperBlast(bombIndex, otherPiece, otherIndex);
        return;
      }

      const swapped = [...currentBoard];
      swapped[startIndex] = piece2;
      swapped[targetIndex] = piece1;

      const { matched, specialCreations } = getIndicesMatchesWithSpecials(swapped);
      const isValidMatch = matched.length > 0 && matched.some((i) => i === startIndex || i === targetIndex);

      if (!isValidMatch) {
        soundManager.playSwap();
        Animated.parallel([
          Animated.timing(dragPosition, { toValue: { x: 0, y: 0 }, duration: 160, useNativeDriver: false }),
          Animated.timing(swapPosition, { toValue: { x: 0, y: 0 }, duration: 160, useNativeDriver: false }),
        ]).start(() => {
          clearDrag();
          isAnimatingRef.current = false;
        });
      } else {
        clearDrag();
        const remainingMoves = movesRef.current - 1;
        boardRef.current = swapped;
        setBoard(swapped);
        applyGravityAndFill(swapped, matched, remainingMoves, specialCreations);
      }
    });
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
    if (new Set(crateRef.current).has(index)) return;
    const { x, y } = getPointerPosition(event);
    touchStartRef.current = { x, y, index };
  };

  const handlePointerMove = (event: any) => {
    if (!touchStartRef.current || isAnimatingRef.current) return;
    const { x, y } = getPointerPosition(event);
    const dx = x - touchStartRef.current.x;
    const dy = y - touchStartRef.current.y;
    const threshold = 18;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      const startIndex = touchStartRef.current.index;
      touchStartRef.current = null;

      const direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0 ? 'RIGHT' : 'LEFT'
          : dy > 0 ? 'DOWN' : 'UP';

      handleSwipeMove(startIndex, direction);
    }
  };

  const handlePointerUp = () => {
    touchStartRef.current = null;
  };

  const clearDrag = () => {
    dragPosition.setValue({ x: 0, y: 0 });
    swapPosition.setValue({ x: 0, y: 0 });
    setDraggedIndex(null);
    setSwapTargetIndex(null);
    isAnimatingRef.current = false;
  };

  const crateSet = new Set(crateCells);

  if (screen === 'home') {
    const currentMap = MAP_CONFIGS[0];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* Top Header */}
        <View style={{ position: 'absolute', top: 25, left: 14, right: 14, zIndex: 9999, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#FF85A1' }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>🗺️ {currentMap.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#FFBE0B', gap: 12 }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>❤️ 5</Text>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>🪙 150</Text>
          </View>
        </View>

        {/* Map Body: Clean background with invisible clickable hotspots on the golden rings */}
        <ScrollView contentContainerStyle={{ height: MAP_H }} showsVerticalScrollIndicator={false} bounces={false}>
          <View style={{ width: MAP_W, height: MAP_H, position: 'relative' }}>
            <Image fadeDuration={0}  source={currentMap.bg} style={{ width: MAP_W, height: MAP_H, position: 'absolute', top: 0, left: 0 }} resizeMode="stretch" />
            {currentMap.points.slice(0, 11).map((pt, idx) => {
              const spotSize = 42;
              const origLeft = pt.x * MAP_W - spotSize / 2;
              const origTop = pt.y * MAP_H - spotSize / 2;

              return (
                <TouchableOpacity
                  key={`lvl_${idx + 1}`}
                  activeOpacity={0.8}
                  style={{ position: 'absolute', left: origLeft, top: origTop, width: spotSize, height: spotSize, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}
                  onPress={() => {
                    resetGame();
                    setTimeout(() => {
        soundManager.playBGM();
      }, 500);
                    setScreen('game');
                  }}
                >
                  <Image fadeDuration={0}  
                    source={require('../assets/images/level_button_active.png')} 
                    style={{ width: 34, height: 34 }} 
                    resizeMode="contain" 
                  />
                  <Text style={{ position: 'absolute', color: '#FFF', fontWeight: '900', fontSize: 13, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, marginTop: -2 }}>
                    {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom Nav with FREE badge */}
        <View style={{ position: 'absolute', bottom: 12, left: 18, right: 18, height: 64, backgroundColor: 'rgba(25, 15, 35, 0.95)', borderRadius: 30, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)', zIndex: 9999 }}>
          <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={() => setActiveModal('shop')}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#FF85A1', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' }}>
              <Text style={{ fontSize: 20 }}>🛍️</Text>
            </View>
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: -18 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#06D6A0', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#FFF' }}>
              <Text style={{ fontSize: 25 }}>🏠</Text>
            </View>
            <Text style={{ color: '#06D6A0', fontSize: 11, fontWeight: 'bold', marginTop: 2 }}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={() => setActiveModal('earn')}>
            <View style={{ position: 'relative' }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFB703', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' }}>
                <Text style={{ fontSize: 20 }}>🎬</Text>
              </View>
              <View style={{ position: 'absolute', top: -6, right: -10, backgroundColor: '#FF3366', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, borderWidth: 1, borderColor: '#FFF' }}>
                <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>FREE</Text>
              </View>
            </View>
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>Earn</Text>
          </TouchableOpacity>
        </View>

        {/* Shop Modal */}
        <Modal visible={activeModal === 'shop'} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 340, backgroundColor: '#2B1A3D', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: '#FF85A1' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: '#FFBE0B', fontSize: 18, fontWeight: 'bold' }}>🛍️ Candy Store</Text>
                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <Text style={{ color: '#FFF', fontSize: 22, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Pouch of Coins (+100)</Text>
                <TouchableOpacity style={{ backgroundColor: '#FF3366', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }} onPress={() => alert('🔒 Google Play Billing Locked: ₹49')}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>₹49</Text>
                </TouchableOpacity>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Sack of Coins (+500)</Text>
                <TouchableOpacity style={{ backgroundColor: '#06D6A0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }} onPress={() => alert('🔒 Google Play Billing Locked: ₹199')}>
                  <Text style={{ color: '#000', fontWeight: 'bold' }}>₹199</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Earn Modal */}
        <Modal visible={activeModal === 'earn'} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 320, backgroundColor: '#2B1A3D', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#FFB703' }}>
              <Text style={{ color: '#FFBE0B', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>🎬 Watch Ad & Earn</Text>
              <Text style={{ color: '#DDD', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>Watch a short video ad to claim 50 free coins!</Text>
              <TouchableOpacity style={{ backgroundColor: '#06D6A0', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 }} onPress={() => { setActiveModal(null); alert('🎉 +50 Coins Added!'); }}>
                <Text style={{ color: '#000', fontWeight: 'bold' }}>▶ Watch Video Ad</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: 14 }} onPress={() => setActiveModal(null)}>
                <Text style={{ color: '#AAA' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
            onPointerUp={handlePointerUp}
            onTouchEnd={handlePointerUp}
          >
            {board.map((item, index) => {
              const col = index % COLS;
              const isMatchedNow = matchedIndicesState.includes(index);

              return (
                <View
                  key={index}
                  style={[
                    styles.tile,
                    { width: tileSize, height: tileSize },
                    Platform.OS === 'web' && ({ touchAction: 'none', userSelect: 'none' } as any),
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
                    <Animated.View
                      style={[
                        styles.candyClip,
                        { width: tileSize, height: tileSize },
                        isMatchedNow && styles.burstCandy,
                        {
                          transform: [
                            {
                              translateY: (columnDropAnims[col] || new Animated.Value(0)).interpolate({
                                inputRange: [-1.5, 0],
                                outputRange: [-tileSize * 1.5, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      {isMatchedNow ? (
                        <View style={styles.particleContainer} pointerEvents="none">
                          <View style={[styles.laserSparkle, { backgroundColor: CANDY_PARTICLE_COLORS[item] || '#FFF', transform: [{ translateX: -18 }, { translateY: -18 }] }]} />
                          <View style={[styles.laserSparkle, { backgroundColor: CANDY_PARTICLE_COLORS[item] || '#FFF', transform: [{ translateX: 18 }, { translateY: -18 }] }]} />
                          <View style={[styles.laserSparkle, { backgroundColor: CANDY_PARTICLE_COLORS[item] || '#FFF', transform: [{ translateX: -18 }, { translateY: 18 }] }]} />
                          <View style={[styles.laserSparkle, { backgroundColor: CANDY_PARTICLE_COLORS[item] || '#FFF', transform: [{ translateX: 18 }, { translateY: 18 }] }]} />
                          <View style={[styles.laserSparkle, { backgroundColor: CANDY_PARTICLE_COLORS[item] || '#FFF', transform: [{ translateX: 0 }, { translateY: -22 }] }]} />
                          <View style={[styles.laserSparkle, { backgroundColor: CANDY_PARTICLE_COLORS[item] || '#FFF', transform: [{ translateX: 0 }, { translateY: 22 }] }]} />
                          <View style={[styles.laserSparkle, { backgroundColor: CANDY_PARTICLE_COLORS[item] || '#FFF', transform: [{ translateX: -22 }, { translateY: 0 }] }]} />
                          <View style={[styles.laserSparkle, { backgroundColor: CANDY_PARTICLE_COLORS[item] || '#FFF', transform: [{ translateX: 22 }, { translateY: 0 }] }]} />
                          <View style={styles.burstCoreFlash} />
                        </View>
                      ) : null}

                      {item === 'bomb' ? (
                        <Animated.Image
                          source={CANDY_ASSETS.bomb}
                          style={[
                            candyImageSize(item),
                            (draggedIndex === index || swapTargetIndex === index) && styles.hiddenCandy,
                            { transform: [{ rotate: spinInterpolate }] },
                          ]}
                          resizeMode="stretch"
                        />
                      ) : (
                        <Image fadeDuration={0} 
                          source={CANDY_ASSETS[item as keyof typeof CANDY_ASSETS]}
                          style={[
                            candyImageSize(item),
                            (draggedIndex === index || swapTargetIndex === index) && styles.hiddenCandy,
                          ]}
                          resizeMode="stretch"
                        />
                      )}
                    </Animated.View>
                  ) : null}
                </View>
              );
            })}

            {lasers.map((l) => {
              const dx = l.toX - l.fromX;
              const dy = l.toY - l.fromY;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);

              return (
                <View
                  key={l.id}
                  pointerEvents="none"
                  style={[
                    styles.laserBeamContainer,
                    {
                      left: l.fromX,
                      top: l.fromY,
                      width: length,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                >
                  <View style={styles.laserBeamCore} />
                  <View style={styles.laserBeamGlow} />
                </View>
              );
            })}

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
                    ],
                  },
                ]}
              >
                <View style={[styles.candyClip, { width: tileSize, height: tileSize }]}>
                  {board[draggedIndex] === 'bomb' ? (
                    <Animated.Image
                      source={CANDY_ASSETS.bomb}
                      style={[candyImageSize(board[draggedIndex]), { transform: [{ rotate: spinInterpolate }] }]}
                      resizeMode="stretch"
                    />
                  ) : (
                    <Image fadeDuration={0} 
                      source={CANDY_ASSETS[board[draggedIndex] as keyof typeof CANDY_ASSETS]}
                      style={candyImageSize(board[draggedIndex])}
                      resizeMode="stretch"
                    />
                  )}
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
                  {board[swapTargetIndex] === 'bomb' ? (
                    <Animated.Image
                      source={CANDY_ASSETS.bomb}
                      style={[candyImageSize(board[swapTargetIndex]), { transform: [{ rotate: spinInterpolate }] }]}
                      resizeMode="stretch"
                    />
                  ) : (
                    <Image fadeDuration={0} 
                      source={CANDY_ASSETS[board[swapTargetIndex] as keyof typeof CANDY_ASSETS]}
                      style={candyImageSize(board[swapTargetIndex])}
                      resizeMode="stretch"
                    />
                  )}
                </View>
              </Animated.View>
            ) : null}
          </View>
        </View>
        <Text style={styles.boardHint}>Match 5 candies to make a Color Bumper Bomb!</Text>
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
            <Pressable onPress={result === 'win' && currentLevel < 10 ? nextLevel : () => resetGame(currentLevel)} style={styles.resultPrimary}>
              <Text style={styles.resultPrimaryText}>{result === 'win' ? (currentLevel === 10 ? 'PLAY AGAIN' : `NEXT LEVEL (${currentLevel + 1})`) : 'RETRY'}</Text>
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
  homeContainer: { flex: 1 },
  homeBackground: { flex: 1, width: '100%', height: '100%' },
  homeShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center' },
  soundButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  soundButtonText: { fontSize: 28 },
  homeContent: { alignItems: 'center' },
  homeLogo: { width: 260, height: 130, marginBottom: 10 },
  homeTagline: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 2, marginBottom: 30 },
  playButton: { backgroundColor: '#4CAF50', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30 },
  playButtonPressed: { opacity: 0.8 },
  playButtonText: { fontSize: 24, fontWeight: '900', color: '#FFF' },

  gameContainer: { flex: 1, backgroundColor: '#FEDCB4' },
  kitchenHeader: { width: '100%', backgroundColor: '#FFA07A' },
  topTableBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  moveTag: { backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, alignItems: 'center' },
  moveLabel: { fontSize: 10, fontWeight: '800', color: '#888' },
  moveCount: { fontSize: 20, fontWeight: '900', color: '#E91E63' },
  targetPlate: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 6, borderRadius: 12 },
  targetCrateIcon: { width: 24, height: 24, backgroundColor: '#8D6E63', borderRadius: 4, marginRight: 6 },
  targetCrateInset: { flex: 1, margin: 2, borderWidth: 1, borderColor: '#5D4037' },
  targetCrateCross: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#5D4037', top: 11 },
  numberBadge: { minWidth: 20, alignItems: 'center' },
  targetBadgeText: { fontSize: 16, fontWeight: '900', color: '#333' },
  homeButton: { padding: 6 },
  homeButtonText: { fontSize: 26, color: '#FFF' },
  checkeredTrim: { flexDirection: 'row', height: 10, width: '100%' },
  trimSquare: { flex: 1, backgroundColor: '#FFF' },
  trimSquarePink: { backgroundColor: '#FF80AB' },

  gameField: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  boardContainer: {
    backgroundColor: '#3A5576',
    borderRadius: 14,
    padding: 3,
    borderWidth: 3,
    borderColor: '#4A6B92',
    elevation: 2,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#2E4766',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tile: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(35, 58, 87, 0.35)',
  },
  candyClip: { justifyContent: 'center', alignItems: 'center' },
  burstCandy: { opacity: 0 },
  particleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  laserSparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#FFFFFF',
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 2,
  },
  burstCoreFlash: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  hiddenCandy: { opacity: 0 },
  draggedCandy: { position: 'absolute', zIndex: 100, elevation: 2, },
  swappingCandy: { zIndex: 90, elevation: 2, },
  crateTile: { width: '90%', height: '90%', backgroundColor: '#A1887F', borderRadius: 6, borderWidth: 2, borderColor: '#6D4C41' },
  crateInset: { flex: 1, margin: 2, borderWidth: 1, borderColor: '#4E342E' },
  crateHorizontal: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#4E342E', top: '48%' },
  crateVertical: { position: 'absolute', height: '100%', width: 2, backgroundColor: '#4E342E', left: '48%' },

  laserBeamZigzag1: {
    position: 'absolute',
    top: -2,
    height: 4,
    width: '100%',
    backgroundColor: '#00FFFF',
    opacity: 0.8,
    borderRadius: 2,
    transform: [{ skewY: '12deg' }],
  },
  laserBeamZigzag2: {
    position: 'absolute',
    bottom: -2,
    height: 3,
    width: '100%',
    backgroundColor: '#7DF9FF',
    opacity: 0.8,
    borderRadius: 2,
    transform: [{ skewY: '-12deg' }],
  },
  laserSparks: {
    position: 'absolute',
    width: '100%',
    height: 10,
    backgroundColor: 'transparent',
    borderColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    opacity: 0.9,
  },
  testBombBtn: {
    position: 'absolute',
    top: 55,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 1,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  testBombBtnImg: {
    width: 26,
    height: 26,
    marginRight: 4,
  },
  testBombBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  laserBeamContainer: {
    position: 'absolute',
    height: 12,
    justifyContent: 'center',
    transformOrigin: '0% 50%',
    zIndex: 999,
    elevation: 2,
  },
  laserBeamCore: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#00FFFF',
    shadowRadius: 1,
    shadowOpacity: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    zIndex: 2,
  },
  laserBeamGlow: {
    position: 'absolute',
    height: 12,
    width: '100%',
    backgroundColor: 'rgba(0, 229, 255, 0.75)',
    borderRadius: 6,
    shadowColor: '#00E5FF',
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 2,
  },

  boardHint: { marginTop: 12, fontSize: 13, fontWeight: '700', color: '#8D6E63' },
  bottomBar: { paddingVertical: 14, alignItems: 'center', backgroundColor: '#FFE0B2' },
  bottomBarText: { fontSize: 12, fontWeight: '700', color: '#6D4C41' },

  resultOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
  resultCard: { width: '80%', backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center' },
  resultTitle: { fontSize: 24, fontWeight: '900', color: '#E91E63', marginBottom: 8 },
  resultMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  resultPrimary: { backgroundColor: '#4CAF50', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginBottom: 10 },
  resultPrimaryText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  resultSecondary: { padding: 8 },
  resultSecondaryText: { fontSize: 14, fontWeight: '700', color: '#888' },
});
