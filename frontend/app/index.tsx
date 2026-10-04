import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { HomeScreen } from '../src/components/HomeScreen';
import { GameBoard } from '../src/components/GameBoard';

export default function AppEntry() {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B2E" />
      {activeLevel === null ? (
        <HomeScreen onPlay={(level) => setActiveLevel(level)} />
      ) : (
        <GameBoard
          levelId={activeLevel}
          onBack={() => setActiveLevel(null)}
          onLevelComplete={(_stars) => setActiveLevel(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1B2E',
  },
});
