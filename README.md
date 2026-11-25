# Focus Timer

**A Pomodoro timer with configurable sessions, daily stats, and streaks.**

[![Live demo](https://img.shields.io/badge/demo-GitHub%20Pages-2ea44f)](https://aghorbani84.github.io/focus-timer/)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Jotai](https://img.shields.io/badge/state-Jotai-000000)
[![GitHub stars](https://img.shields.io/github/stars/aghorbani84/focus-timer?style=flat)](https://github.com/aghorbani84/focus-timer/stargazers)

**Live demo:** https://aghorbani84.github.io/focus-timer/

## Overview

Focus Timer runs Pomodoro cycles in the browser and keeps track of how much you've focused. Settings,
timer state, and stats are persisted to `localStorage`; there is no account, tracking, or backend.

## Features

- **Three modes**: Focus, Short Break, and Long Break, with configurable durations and long-break interval.
- **Controls**: start, pause, resume, reset, and skip between focus and break.
- **Progress ring** colored per mode, with dots showing progress toward the next long break.
- **Stats**: sessions and minutes focused today, this week, and in total, plus a daily streak.
- **Completion chime** synthesized with the Web Audio API (can be turned off).
- **Task label** for the current session.
- **Auto-start** options for breaks and focus sessions.
- **Live countdown in the tab title** while the timer runs.
- **Themes**: Achaemenid and Modern styles, each in light and dark.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript |
| Build | Vite 8 |
| State | Jotai (`atomWithStorage`, derived atoms) |
| Styling | Hand-written CSS |
| Audio | Web Audio API |
| Deploy | GitHub Actions → GitHub Pages |

## Getting started

Requires Node.js 20 or newer and npm.

```bash
git clone https://github.com/aghorbani84/focus-timer.git
cd focus-timer
npm install
npm run dev        # http://localhost:5173/focus-timer/
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Project structure

```
src/
  App.tsx     mode tabs, progress ring, controls, settings, stats, theme switcher
  App.css     component styles
  store.ts    Jotai atoms: settings, timer state, stats, streak, theme
  sound.ts    Web Audio completion chime
  main.tsx    entry point
.github/workflows/  GitHub Pages deploy
```

## Author

Built by [Abolfazl Ghorbani](https://github.com/aghorbani84).
