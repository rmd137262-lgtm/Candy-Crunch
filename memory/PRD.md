# Color Crush — Level 1 Product Requirements

## Problem statement
Create only Level 1 of an original offline Match-3 puzzle game. Players swap adjacent pieces on a 7×7 board, match three or more identical pieces, clear matched pieces, refill from above, and reach 500 points within 20 moves.

## Architecture
- Expo SDK 54 React Native app with Expo Router.
- Offline single-screen state machine: Home → Level 1 Game → Level Complete or Game Over → Retry.
- Pure TypeScript board algorithms for match detection, clearing, gravity, refill, and cascaded scoring.
- No backend, network calls, AI APIs, payments, ads, subscriptions, or external game assets.

## User personas
- Casual mobile puzzle players seeking a short, focused challenge.
- Match-3 players who enjoy planning a limited number of moves.

## Core requirements (static)
- Exactly one 7×7 Level 1 board and six original colorful piece types.
- Adjacent tap-to-select and tap-to-swap interaction.
- Match 3+ horizontally or vertically, clear pieces, apply gravity, and refill.
- Score, 20 moves, Level 1 label, and 500-point target visible during play.
- Level Complete at target, Game Over at zero moves, and functional Retry.
- Mobile-friendly controls, clear instructions, and polished visual treatment.

## Implemented (2026-08-11)
- Replaced the prior reaction game with Color Crush Level 1.
- Added procedural no-initial-match 7×7 board generation using six original pieces.
- Added adjacent swap selection, valid-match validation, horizontal/vertical match detection, clearing, gravity, refill, cascades, and score bonuses.
- Added 20-move accounting for valid and invalid adjacent swaps.
- Added 500-point progress bar, Level Complete screen, Game Over screen, and Retry reset.
- Verified TypeScript, ESLint, Expo preview, 49-cell board, valid scoring swap, 20-move exhaustion, completion at 505 points, and Retry.
- Fixed rapid mobile tap race in `handleCell` by making selected cell, board, score, and moves refs authoritative before React state updates.
- Reverified first-tap selection, rapid adjacent swap, 3+ match clearing/refill, score 0→60, moves 20→19, and 49-cell board integrity (2026-08-11).
- Candy Crush-style visual + feel overhaul (2026-08-11): bright purple→berry gradient theme, glossy two-tone candy pieces with shine highlights, renamed to "Candy Crush" home hero.
- Added juicy match feedback: floating "+points" score popups at cleared candy positions, animated COMBO x2/x3 banner on cascades, and Reanimated ZoomIn pop-in for refilled candies. Verified colors render per-type and +60 popup appears on a real match swap.
- Added Candy Crush-style SWIPE controls (2026-08-11): touch a candy and drag toward an adjacent candy to swap, via react-native-gesture-handler Pan (minDistance 10, direction-resolved target). GestureHandlerRootView added in _layout. Tap-to-select-then-tap still works as a fallback. Verified swipe swap on web produces a match (score 0→60, moves 20→19, +60 popup).

## Prioritized backlog
- P0: None for the requested Level 1 MVP.
- P1: Add subtle clear/fall animations and optional sound effects.
- P2: Add accessibility-friendly piece patterns after player feedback.

## Next tasks
- Tune scoring and cascade bonuses after real-player feedback.
- Add motion polish without changing the current stable board rules.