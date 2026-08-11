# Color Tap Challenge — Product Requirements

## Problem statement
Build the first working version of an Android-ready offline color reaction game. Players read a color instruction, tap the matching colored target, build score, survive with three lives, and progress through increasingly difficult levels. Best score and sound/vibration preferences are stored locally.

## Architecture
- Expo SDK 54 React Native app with Expo Router.
- Single offline game screen state machine: Home → Game → Game Over, with Settings and Level Transition modals.
- AsyncStorage for best score and settings; Expo Haptics for optional vibration.
- No backend, network calls, AI APIs, payments, ads, or external game assets.

## User personas
- Quick-session mobile players who want a fast reaction challenge.
- Casual players competing against their personal best.

## Core requirements (static)
- Playable color matching with large touch targets.
- Score, three lives, level, round progress, and response timer.
- Fixed five correct rounds per level, faster timer and more color choices over time.
- Level transition feedback, Game Over summary, saved Best Score, and Play Again.
- Home title, Play button, Best Score, Settings button.
- Sound and vibration settings stored locally.

## Implemented (2026-08-11)
- Built polished dark neon home screen with original colorful visual system.
- Built live reaction gameplay with correct/wrong tap handling, timeout life loss, score, lives, timer, and levels.
- Added level transition modal and scalable difficulty through six colors and an accelerating timer.
- Added Game Over and Play Again flows with local Best Score persistence.
- Added mobile-safe Settings bottom sheet with Sound and Vibration toggles and persistence.
- Verified TypeScript, ESLint, and Expo preview gameplay flow including Level 2, Game Over, and Play Again.

## Prioritized backlog
- P0: None for first working version.
- P1: Add optional lightweight sound effects when an approved audio asset strategy is selected.
- P2: Add personal run history or accessibility color-blind patterns after core gameplay feedback.

## Next tasks
- Gather player feedback on timer pacing and level curve.
- Tune color contrast and add a color-blind-friendly mode if needed.