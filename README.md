# Game 24

Game 24 is a minimal Progressive Web App (PWA) that generates solvable "24 Game" puzzles: four numbers between 1 and 13 that can be combined with arithmetic to make 24. The app is implemented with React + TypeScript, built with Vite, and configured for offline usage via service workers.

Key features

- Generates only puzzles that have at least one valid solution.
- Pure TypeScript solver and generator (logic separated from UI).
- PWA-ready with manifest and service worker (via `vite-plugin-pwa`).

Quick start

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build and preview production:

```bash
npm run build
npm run preview
```
