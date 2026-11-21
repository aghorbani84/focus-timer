# Focus Timer

A polished Pomodoro focus timer built with React, TypeScript, and Vite.

## What it does

- **Pomodoro timer** with three modes: Focus, Short Break, and Long Break.
- **Configurable durations** for each mode, plus how many focus sessions
  trigger a long break — all adjustable in the Settings panel.
- **Start / Pause / Resume / Reset**, plus skip buttons to jump between
  focus and break.
- **Circular progress ring** that fills as the session runs, colored per mode,
  with dots showing progress toward the next long break.
- **Session counting and stats**: sessions and minutes focused today, this
  week, and in total, plus a **streak** of consecutive days with at least one
  completed focus session.
- **Sound cue on completion**, synthesized with the Web Audio API — no audio
  files needed. It can be toggled off in Settings.
- **Task label** for the current session, shown under the timer while you
  focus.
- **Auto-start** options for breaks and focus sessions.
- **localStorage persistence**: settings, task label, timer state, and all
  statistics survive reloads. Everything stays in the browser — no account,
  no tracking, no backend.
- The browser tab title shows the live countdown while the timer runs.

## Tech used

- **React 19 + TypeScript + Vite**
- **Jotai** for state management (atoms, including `atomWithStorage` for
  localStorage persistence and derived atoms for stats and streaks)
- **Vanilla CSS** (hand-written, dark theme, responsive)
- **Web Audio API** for the completion chime

## How to run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Build

```bash
npm run build
```

## Project structure

```
src/
  App.tsx    # UI: mode tabs, progress ring, controls, settings, stats
  App.css    # Hand-written vanilla CSS
  store.ts   # Jotai atoms: settings, timer state machine, stats, streak
  sound.ts   # Web Audio API completion chime
  main.tsx   # Entry point
  index.css  # Global base styles
```
