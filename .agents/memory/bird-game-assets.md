---
name: Bird game assets
description: Asset handling for the bird-themed match game.
---

The bird source sheet is a flattened checkerboard image, so gameplay should use separate transparent PNG crops rather than the full sheet. Flying variants are generated from those crops and optimized for the mobile board.

**Why:** The checkerboard is part of the source image's pixels and looks incorrect when placed over the game's gradient board. The background-removal integration may require paid mode, so locally prepared transparent crops are the reliable fallback.

**How to apply:** Keep the tracked `*-source.png` tiles intact. Verify generated flying PNGs have transparent corner pixels before using them, then resize them to a practical mobile resolution. Use the processed per-bird PNGs for React Native `Image` components and preserve the source sheet/crops for future asset work.