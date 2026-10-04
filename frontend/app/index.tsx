import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { HomeScreen } from '../src/components/HomeScreen';
import { GameBoard } from '../src/components/GameBoard';
import LevelStartModal from '../src/components/game/LevelStartModal';
import { LEVELS_CONFIG } from '../src/game/levels';
import { gameState } from '../src/game/gameState';
import { soundManager } from '../src/game/soundManager';
import type { BoosterType } from '../src/game/engine';

export default function AppEntry() {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);
  const [selectedBoosters, setSelectedBoosters] = useState<Array<Exclude<BoosterType, 'extraMoves'>>>([]);
  const [startingBoosters, setStartingBoosters] = useState<Array<Exclude<BoosterType, 'extraMoves'>>>([]);
  const player = gameState.getState();

  const toggleBooster = (booster: Exclude<BoosterType, 'extraMoves'>) => {
    setSelectedBoosters((current) =>
      current.includes(booster) ? current.filter((item) => item !== booster) : [...current, booster],
    );
  };

  const startLevel = () => {
    if (pendingLevel === null) return;
    const granted = selectedBoosters.filter((booster) => gameState.useBooster(booster));
    setStartingBoosters(granted);
    soundManager.playBGM();
    setActiveLevel(pendingLevel);
    setPendingLevel(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B2E" />
      {activeLevel === null ? (
        <HomeScreen
          onPlay={(level) => {
            setSelectedBoosters([]);
            setPendingLevel(level);
          }}
        />
      ) : (
        <GameBoard
          levelId={activeLevel}
          startingBoosters={startingBoosters}
          onBack={() => setActiveLevel(null)}
          onLevelComplete={(_stars) => setActiveLevel(null)}
        />
      )}
      {pendingLevel !== null && (
        <LevelStartModal
          visible
          level={LEVELS_CONFIG[pendingLevel]}
          inventory={player.boosters}
          selected={selectedBoosters}
          onToggle={toggleBooster}
          onStart={startLevel}
          onClose={() => setPendingLevel(null)}
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
