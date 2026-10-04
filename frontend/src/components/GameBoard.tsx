import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MatchEngine, Tile } from '../game/engine';
import { LEVELS_CONFIG } from '../game/levels';
import { gameState } from '../game/gameState';
import { soundManager } from '../game/soundManager';

interface GameBoardProps {
  levelId: number;
  onBack: () => void;
  onLevelComplete: (stars: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ levelId, onBack, onLevelComplete }) => {
  const levelConfig = LEVELS_CONFIG[levelId] || LEVELS_CONFIG[1];
  const [engine, setEngine] = useState<MatchEngine>(() => new MatchEngine(levelConfig));
  const [selectedCoord, setSelectedCoord] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(levelConfig.moves);

  useEffect(() => {
    soundManager.playBGM();
    return () => {
      // Clean up if needed
    };
  }, []);

  const handleTilePress = (r: number, c: number) => {
    if (!selectedCoord) {
      setSelectedCoord([r, c]);
      return;
    }

    const [sr, sc] = selectedCoord;
    const isAdjacent = (Math.abs(sr - r) === 1 && sc === c) || (Math.abs(sc - c) === 1 && sr === r);

    if (isAdjacent) {
      const swapped = engine.swap(sr, sc, r, c);
      if (swapped) {
        setScore(engine.score);
        setMoves(engine.movesRemaining);

        // Check Win condition
        if (engine.score >= levelConfig.targetScore) {
          soundManager.playWin();
          gameState.completeLevel(levelId, 3);
          Alert.alert('Level Complete! 🎉', 'Aapne yeh level jeet liya!', [
            { text: 'Aage Badhein', onPress: () => onLevelComplete(3) }
          ]);
        } else if (engine.movesRemaining <= 0) {
          Alert.alert('Out of Moves! 😢', 'Chaliye dobara koshish karein.', [
            { text: 'Retry', onPress: () => {
                const fresh = new MatchEngine(levelConfig);
                setEngine(fresh);
                setScore(0);
                setMoves(levelConfig.moves);
              }
            }
          ]);
        }
      }
      setSelectedCoord(null);
    } else {
      setSelectedCoord([r, c]);
    }
  };

  const getTileColor = (tile: Tile | null) => {
    if (!tile) return '#333';
    switch (tile.color) {
      case 'red': return '#FF4757';
      case 'blue': return '#1E90FF';
      case 'green': return '#2ED573';
      case 'yellow': return '#FFA502';
      case 'purple': return '#9B59B6';
      case 'orange': return '#FF7F50';
      default: return '#ccc';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>⬅ Map</Text>
        </TouchableOpacity>
        <Text style={styles.levelTitle}>Level {levelId}</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.infoLabel}>Score</Text>
          <Text style={styles.infoVal}>{score} / {levelConfig.targetScore}</Text>
        </View>
        <View style={styles.movesContainer}>
          <Text style={styles.infoLabel}>Moves</Text>
          <Text style={styles.infoVal}>{moves}</Text>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        {engine.grid.map((row, rIdx) => (
          <View key={`row_${rIdx}`} style={styles.row}>
            {row.map((tile, cIdx) => {
              const isSelected = selectedCoord?.[0] === rIdx && selectedCoord?.[1] === cIdx;
              return (
                <TouchableOpacity
                  key={`tile_${rIdx}_${cIdx}`}
                  style={[
                    styles.tile,
                    { backgroundColor: getTileColor(tile) },
                    isSelected && styles.tileSelected,
                    tile?.woodHealth ? styles.tileWood : null
                  ]}
                  onPress={() => handleTilePress(rIdx, cIdx)}
                  activeOpacity={0.8}
                >
                  {tile?.woodHealth ? <Text style={styles.woodText}>🪵</Text> : null}
                  {tile?.hasJelly ? <View style={styles.jellyOverlay} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1B2E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20
  },
  header: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  backBtn: {
    backgroundColor: '#4A4E69',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF'
  },
  scoreContainer: {
    alignItems: 'center'
  },
  movesContainer: {
    alignItems: 'center'
  },
  infoLabel: {
    color: '#AAA',
    fontSize: 12
  },
  infoVal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  gridContainer: {
    backgroundColor: '#2A2640',
    padding: 8,
    borderRadius: 12
  },
  row: {
    flexDirection: 'row'
  },
  tile: {
    width: 38,
    height: 38,
    margin: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tileSelected: {
    borderWidth: 2,
    borderColor: '#FFF',
    transform: [{ scale: 1.1 }]
  },
  tileWood: {
    backgroundColor: '#8B5A2B'
  },
  woodText: {
    fontSize: 14
  },
  jellyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 105, 180, 0.35)',
    borderRadius: 8
  }
});
