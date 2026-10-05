import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { soundManager } from '../src/game/soundManager';

const { width } = Dimensions.get('window');

const COLS = 7;
const ROWS = 9;
const BOARD_WIDTH = Math.min(width - 16, 420);
const TILE_SIZE = Math.floor(BOARD_WIDTH / COLS);
const BOARD_HEIGHT = TILE_SIZE * ROWS;

const CANDY_ASSETS = {
  blue: require('../assets/images/candy_blue.png'),
  green: require('../assets/images/candy_green.png'),
  red: require('../assets/images/candy_red.png'),
  star: require('../assets/images/candy_star.png'),
  bomb: require('../assets/images/candy_bomb.png'),
  egg: require('../assets/images/candy_egg.png'),
};

const BASE_CANDIES = ['blue', 'green', 'red', 'star'];

export default function App() {
  const [board, setBoard] = useState<string[]>([]);
  const [moves, setMoves] = useState<number>(25);
  const [blueTarget, setBlueTarget] = useState<number>(20);
  const [gameOver, setGameOver] = useState<boolean>(false);

  const boardRef = useRef<string[]>([]);
  const movesRef = useRef<number>(25);
  const blueTargetRef = useRef<number>(20);
  const gameOverRef = useRef<boolean>(false);
  const touchStartRef = useRef<{ x: number; y: number; index: number } | null>(null);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    movesRef.current = moves;
  }, [moves]);

  useEffect(() => {
    blueTargetRef.current = blueTarget;
  }, [blueTarget]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    let newBoard: string[] = [];
    for (let i = 0; i < ROWS * COLS; i++) {
      newBoard.push(BASE_CANDIES[Math.floor(Math.random() * BASE_CANDIES.length)]);
    }
    setBoard(newBoard);
    boardRef.current = newBoard;
    setMoves(25);
    movesRef.current = 25;
    setBlueTarget(20);
    blueTargetRef.current = 20;
    setGameOver(false);
    gameOverRef.current = false;
  };

  const getIndicesMatches = (currentBoard: string[]) => {
    let matched = new Set<number>();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 2; c++) {
        let i = r * COLS + c;
        let candy = currentBoard[i];
        if (candy && candy === currentBoard[i + 1] && candy === currentBoard[i + 2]) {
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
        if (candy && candy === currentBoard[i + COLS] && candy === currentBoard[i + 2 * COLS]) {
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
    let blueCleared = 0;
    let newBoard = [...currentBoard];

    matchedIndices.forEach((idx) => {
      if (newBoard[idx] === 'blue') blueCleared++;
      newBoard[idx] = '';
    });

    const newTarget = Math.max(0, blueTargetRef.current - blueCleared);
    setBlueTarget(newTarget);
    blueTargetRef.current = newTarget;

    for (let c = 0; c < COLS; c++) {
      let emptyCount = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        let idx = r * COLS + c;
        if (newBoard[idx] === '') {
          emptyCount++;
        } else if (emptyCount > 0) {
          newBoard[(r + emptyCount) * COLS + c] = newBoard[idx];
          newBoard[idx] = '';
        }
      }
      for (let r = 0; r < emptyCount; r++) {
        newBoard[r * COLS + c] = BASE_CANDIES[Math.floor(Math.random() * BASE_CANDIES.length)];
      }
    }

    setBoard(newBoard);
    boardRef.current = newBoard;

    if (newTarget === 0) {
      setGameOver(true);
      gameOverRef.current = true;
      soundManager.playWin();
      Alert.alert('Mubarak Ho! 🎉', 'Level 1 Complete Kar Liya!', [
        { text: 'Play Again', onPress: resetGame },
      ]);
    } else if (remainingMoves <= 0) {
      setGameOver(true);
      gameOverRef.current = true;
      soundManager.playOver();
      Alert.alert('Game Over', 'Moves Khatam Ho Gayin!', [
        { text: 'Try Again', onPress: resetGame },
      ]);
    }
  };

  const handleSwap = (startIndex: number, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOverRef.current || movesRef.current <= 0) return;

    const row = Math.floor(startIndex / COLS);
    const col = startIndex % COLS;
    let targetIndex = -1;

    if (direction === 'LEFT' && col > 0) targetIndex = startIndex - 1;
    if (direction === 'RIGHT' && col < COLS - 1) targetIndex = startIndex + 1;
    if (direction === 'UP' && row > 0) targetIndex = startIndex - COLS;
    if (direction === 'DOWN' && row < ROWS - 1) targetIndex = startIndex + COLS;

    if (targetIndex === -1) return;

    let swapped = [...boardRef.current];
    const temp = swapped[startIndex];
    swapped[startIndex] = swapped[targetIndex];
    swapped[targetIndex] = temp;

    const matches = getIndicesMatches(swapped);
    if (matches.length > 0) {
      soundManager.playSwap();
      const remainingMoves = movesRef.current - 1;
      setMoves(remainingMoves);
      movesRef.current = remainingMoves;
      setBoard(swapped);
      boardRef.current = swapped;
      applyGravityAndFill(swapped, matches, remainingMoves);
    }
  };

  const handlePointerDown = (e: any, index: number) => {
    const pageX = e.pageX || (e.touches && e.touches[0] ? e.touches[0].pageX : 0);
    const pageY = e.pageY || (e.touches && e.touches[0] ? e.touches[0].pageY : 0);
    touchStartRef.current = { x: pageX, y: pageY, index };
  };

  const handlePointerUp = (e: any) => {
    if (!touchStartRef.current) return;
    const pageX = e.pageX || (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].pageX : 0);
    const pageY = e.pageY || (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].pageY : 0);

    const dx = pageX - touchStartRef.current.x;
    const dy = pageY - touchStartRef.current.y;
    const threshold = 12;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        handleSwap(touchStartRef.current.index, dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        handleSwap(touchStartRef.current.index, dy > 0 ? 'DOWN' : 'UP');
      }
    }
    touchStartRef.current = null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topTableBar}>
        <View style={styles.moveTag}>
          <Text style={styles.moveLabel}>Move</Text>
          <Text style={styles.moveCount}>{moves}</Text>
        </View>

        <View style={styles.targetPlate}>
          <Image source={CANDY_ASSETS.blue} style={styles.targetIcon} resizeMode="contain" />
          <View style={styles.numberBadge}>
            <Text style={styles.targetBadgeText}>{blueTarget}</Text>
          </View>
        </View>
      </View>

      {/* 9x7 Board */}
      <View style={styles.boardContainer}>
        <View
          style={[styles.board, { width: TILE_SIZE * COLS, height: BOARD_HEIGHT }]}
          // @ts-ignore
          onPointerUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
        >
          {board.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tile,
                { width: TILE_SIZE, height: TILE_SIZE },
                Platform.OS === 'web' ? ({ touchAction: 'none', userSelect: 'none' } as any) : {},
              ]}
              // @ts-ignore
              onPointerDown={(e) => handlePointerDown(e, index)}
              onTouchStart={(e) => handlePointerDown(e, index)}
            >
              {item ? (
                <Image
                  source={CANDY_ASSETS[item as keyof typeof CANDY_ASSETS]}
                  style={styles.candyImage}
                  resizeMode="stretch"
                />
              ) : null}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fed330',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topTableBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '92%',
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  moveTag: {
    backgroundColor: '#20bf6b',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
  },
  moveLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  moveCount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  targetPlate: {
    width: 58,
    height: 58,
    backgroundColor: '#f1f2f6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#dcdde1',
    position: 'relative',
  },
  targetIcon: {
    width: 44,
    height: 44,
  },
  numberBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#eb3b5a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  targetBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  boardContainer: {
    padding: 2,
    backgroundColor: '#2d3436',
    borderRadius: 8,
    elevation: 8,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#2d3436',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 0,
    margin: 0,
  },
  candyImage: {
    width: '100%',
    height: '100%',
  },
});
