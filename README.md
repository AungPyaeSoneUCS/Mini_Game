# Neon Game Hub

A Next.js App Router project containing a menu of neon-themed browser games and utility pages.

**Owner:** [AungPyaeSoneUCS](https://github.com/AungPyaeSoneUCS)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000/game](http://localhost:3000/game).

The root route (`/`) redirects to the game menu.

## Available routes

| Route | Page |
| --- | --- |
| `/game` | Game menu |
| `/game/EndlessRunner` | Endless Runner |
| `/game/Game2048` | Neon 2048 |
| `/game/SimonSays` | Simon Says |
| `/game/FullStackFlash` | Full-Stack Flash |
| `/game/GuessPuzzle` | Life Hacker |
| `/game/MemoryMatch` | Neon Match |
| `/game/MyanmarTyping` | Myanmar Typing |
| `/game/NeonBreakout` | Neon Breakout |
| `/game/NeonOutpost` | Neon Outpost |
| `/game/NeonPong` | Neon Pong |
| `/game/NeonSnake` | Neon Snake |
| `/game/NeonTicTacToe` | Neon Tic-Tac-Toe |
| `/game/SlidingTilePuzzle` | Sliding Puzzle |
| `/game/SysBreach` | Sys Breach |
| `/game/AIChat` | AI Chat |
| `/game/QR` | QR Generator |

## PWA

The app is installable as a PWA. It includes:

- `public/manifest.webmanifest` with app name, owner link, theme colors, and 192/512 px icons
- `public/sw.js` for offline caching of the app shell
- An in-app install banner that appears when the browser supports installation (with an iOS "Add to Home Screen" hint)

Service worker registration only happens in production builds.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run typecheck` — run TypeScript checks
- `npm run icons` — regenerate PWA icons in `public/`
