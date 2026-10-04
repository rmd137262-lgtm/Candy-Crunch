import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { gameState } from '../game/gameState';
import { soundManager } from '../game/soundManager';

interface HomeScreenProps {
  onPlay: (level: number) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onPlay }) => {
  const [playerData, setPlayerData] = useState(gameState.getState());
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  useEffect(() => {
    soundManager.playBGM();
    setPlayerData(gameState.getState());
  }, []);

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleLevelSelect = (levelId: number) => {
    if (levelId <= playerData.highestUnlockedLevel) {
      soundManager.playPop();
      onPlay(levelId);
    }
  };

  const totalLevels = Array.from({ length: 50 }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.statBadge}>
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statText}>{playerData.lives}</Text>
        </View>

        <View style={styles.statBadge}>
          <Text style={styles.statIcon}>🪙</Text>
          <Text style={styles.statText}>{playerData.coins}</Text>
        </View>

        <TouchableOpacity style={styles.soundBtn} onPress={handleToggleSound}>
          <Text style={styles.soundText}>{isMuted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Candy Crunch Saga</Text>

      {/* 50 Levels Saga Map Grid */}
      <ScrollView contentContainerStyle={styles.mapScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.levelsGrid}>
          {totalLevels.map((lvl) => {
            const isUnlocked = lvl <= playerData.highestUnlockedLevel;
            const stars = playerData.stars[lvl] || 0;

            return (
              <TouchableOpacity
                key={`lvl_node_${lvl}`}
                style={[
                  styles.levelNode,
                  isUnlocked ? styles.unlockedNode : styles.lockedNode
                ]}
                disabled={!isUnlocked}
                onPress={() => handleLevelSelect(lvl)}
                activeOpacity={0.8}
              >
                <Text style={styles.levelNumber}>{lvl}</Text>
                {isUnlocked ? (
                  <Text style={styles.starsText}>
                    {'⭐'.repeat(stars) || '☆☆☆'}
                  </Text>
                ) : (
                  <Text style={styles.lockText}>🔒</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1B2E',
    alignItems: 'center'
  },
  topBar: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F2B48'
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2640',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  statIcon: {
    fontSize: 16,
    marginRight: 6
  },
  statText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15
  },
  soundBtn: {
    backgroundColor: '#2A2640',
    padding: 8,
    borderRadius: 16
  },
  soundText: {
    fontSize: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginVertical: 14,
    letterSpacing: 1
  },
  mapScroll: {
    paddingBottom: 40,
    alignItems: 'center'
  },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 320
  },
  levelNode: {
    width: 60,
    height: 60,
    margin: 8,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  unlockedNode: {
    backgroundColor: '#FF6B6B',
    borderWidth: 3,
    borderColor: '#FFE66D'
  },
  lockedNode: {
    backgroundColor: '#4A4E69',
    opacity: 0.6
  },
  levelNumber: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  starsText: {
    fontSize: 8,
    marginTop: 2
  },
  lockText: {
    fontSize: 12,
    marginTop: 2
  }
});
