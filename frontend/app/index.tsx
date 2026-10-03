import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View, Text } from 'react-native';
import GameBoard from '../src/components/GameBoard';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f06292" />
      
      {/* Top Level Bar */}
      <View style={styles.topInfoBar}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.heartText}>♥ 2</Text>
        </View>

        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LEVEL 1</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>MOVES</Text>
          <Text style={styles.movesValue}>20</Text>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.boardWrapper}>
        <GameBoard />
      </View>

      {/* Bottom Hint */}
      <View style={styles.bottomHintContainer}>
        <Text style={styles.bottomHintText}>⇄ RESCUE BIRDS FROM CAGE</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff2d60',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topInfoBar: {
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ff1493',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginTop: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  heartText: {
    color: '#ffebee',
    fontSize: 11,
  },
  movesValue: {
    backgroundColor: '#fff',
    color: '#333',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  levelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  boardWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomHintContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  bottomHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
