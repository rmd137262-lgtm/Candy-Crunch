import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LevelConfig } from '../../game/levels';

interface GoalBoxProps {
  level: LevelConfig;
  score: number;
}

export const GoalBox: React.FC<GoalBoxProps> = ({ level, score }) => {
  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'score': return '🎯';
      case 'break_wood': return '🪵';
      case 'clear_jelly': return '🍧';
      case 'rescue_bears': return '🐻';
      default: return '⭐';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.levelTitle}>Level {level.id}</Text>
      <View style={styles.targetsRow}>
        {level.targets.map((t, idx) => (
          <View key={`target_${idx}`} style={styles.targetItem}>
            <Text style={styles.targetIcon}>{getGoalIcon(t.type)}</Text>
            <Text style={styles.targetCount}>
              {t.type === 'score' ? `${score}/${t.count}` : t.count}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2640',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    marginVertical: 4
  },
  levelTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  },
  targetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  targetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#383354',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  targetIcon: {
    fontSize: 14,
    marginRight: 4
  },
  targetCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  }
});
