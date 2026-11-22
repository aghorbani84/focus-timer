import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { playChime } from './sound'

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

export interface Settings {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  sessionsBeforeLongBreak: number
  soundEnabled: boolean
  autoStartBreaks: boolean
  autoStartFocus: boolean
}

export interface DayStats {
  sessions: number
  focusMinutes: number
}

/** History keyed by local date string `YYYY-MM-DD`. */
export type History = Record<string, DayStats>

/**
 * One completed interval, recorded with its real end time.
 * Never seeded — entries only appear when a timer actually finishes.
 */
export interface SessionEntry {
  id: string
  mode: TimerMode
  /** Planned duration of the interval in minutes. */
  minutes: number
  /** Task label at completion (focus sessions only; '' otherwise). */
  task: string
  /** ISO timestamp of completion. */
  endedAt: string
}

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  autoStartBreaks: true,
  autoStartFocus: false,
}

// ---------------------------------------------------------------------------
// Theme atoms (Phase B redesign — Achaemenid × Modern, each light × dark)
// Persisted with the shared showcase keys from the theme spec.
// getOnInit: true is load-bearing: without it the atoms start at their
// defaults (mode = OS, explicit = false) and App's matchMedia sync effect
// overwrites a persisted dark choice with the OS preference on reload.
// Reading storage synchronously at init keeps the saved choice intact.
// ---------------------------------------------------------------------------

export type ShowcaseStyle = 'achaemenid' | 'modern'
export type ShowcaseMode = 'light' | 'dark'

function systemMode(): ShowcaseMode {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export const themeStyleAtom = atomWithStorage<ShowcaseStyle>(
  'showcase-style',
  'modern',
  undefined,
  { getOnInit: true },
)

export const themeModeAtom = atomWithStorage<ShowcaseMode>(
  'showcase-mode',
  systemMode(),
  undefined,
  { getOnInit: true },
)

/** True once the user has picked a mode explicitly; until then the
 *  matchMedia listener in App keeps the mode synced to the OS. */
export const themeModeExplicitAtom = atomWithStorage<boolean>(
  'showcase-mode-explicit',
  false,
  undefined,
  { getOnInit: true },
)

export const MODE_LABELS: Record<TimerMode, string> = {
  focus: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
}

const STORAGE_KEYS = {
  settings: 'focus-timer:settings',
  history: 'focus-timer:history',
  sessionLog: 'focus-timer:session-log',
  taskLabel: 'focus-timer:task-label',
  mode: 'focus-timer:mode',
  secondsLeft: 'focus-timer:seconds-left',
  cycleCount: 'focus-timer:cycle-count',
} as const

// ---------------------------------------------------------------------------
// Persisted atoms (localStorage)
// ---------------------------------------------------------------------------

export const settingsAtom = atomWithStorage<Settings>(
  STORAGE_KEYS.settings,
  DEFAULT_SETTINGS,
)

export const historyAtom = atomWithStorage<History>(STORAGE_KEYS.history, {})

/** Per-session log: every completed focus/break interval with its real
 *  timestamp. Empty for a fresh install — never seeded with fake data. */
export const sessionLogAtom = atomWithStorage<SessionEntry[]>(
  STORAGE_KEYS.sessionLog,
  [],
)

export const taskLabelAtom = atomWithStorage<string>(STORAGE_KEYS.taskLabel, '')

export const modeAtom = atomWithStorage<TimerMode>(STORAGE_KEYS.mode, 'focus')

export const secondsLeftAtom = atomWithStorage<number>(
  STORAGE_KEYS.secondsLeft,
  DEFAULT_SETTINGS.focusMinutes * 60,
)

/** Focus sessions completed in the current cycle (resets after a long break). */
export const cycleCountAtom = atomWithStorage<number>(STORAGE_KEYS.cycleCount, 0)

// ---------------------------------------------------------------------------
// Transient atoms
// ---------------------------------------------------------------------------

export const runningAtom = atom(false)

// ---------------------------------------------------------------------------
// Derived atoms
// ---------------------------------------------------------------------------

export function durationForMode(mode: TimerMode, settings: Settings): number {
  switch (mode) {
    case 'focus':
      return settings.focusMinutes * 60
    case 'shortBreak':
      return settings.shortBreakMinutes * 60
    case 'longBreak':
      return settings.longBreakMinutes * 60
  }
}

export const durationAtom = atom((get) =>
  durationForMode(get(modeAtom), get(settingsAtom)),
)

export const progressAtom = atom((get) => {
  const duration = get(durationAtom)
  if (duration <= 0) return 0
  return 1 - get(secondsLeftAtom) / duration
})

export function localDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export const todayStatsAtom = atom((get) => {
  const history = get(historyAtom)
  return history[localDateKey(new Date())] ?? { sessions: 0, focusMinutes: 0 }
})

export const weekStatsAtom = atom((get) => {
  const history = get(historyAtom)
  const now = new Date()
  let sessions = 0
  let focusMinutes = 0
  for (let i = 0; i < 7; i++) {
    const day = history[localDateKey(addDays(now, -i))]
    if (day) {
      sessions += day.sessions
      focusMinutes += day.focusMinutes
    }
  }
  return { sessions, focusMinutes }
})

export const totalStatsAtom = atom((get) => {
  const history = get(historyAtom)
  let sessions = 0
  let focusMinutes = 0
  for (const day of Object.values(history)) {
    sessions += day.sessions
    focusMinutes += day.focusMinutes
  }
  return { sessions, focusMinutes }
})

/**
 * Consecutive days with at least one completed focus session, ending today
 * (or yesterday when today has no session yet, so the streak does not
 * vanish at midnight before the first session of the day).
 */
export const streakAtom = atom((get) => {
  const history = get(historyAtom)
  const today = localDateKey(new Date())
  let cursor = history[today] ? 0 : -1
  let streak = 0
  while (true) {
    const day = history[localDateKey(addDays(new Date(), cursor))]
    if (day && day.sessions > 0) {
      streak += 1
      cursor -= 1
    } else {
      break
    }
  }
  return streak
})

/** Session log, newest first. */
export const sessionHistoryAtom = atom((get) =>
  [...get(sessionLogAtom)].sort((a, b) => (a.endedAt < b.endedAt ? 1 : -1)),
)

/** Longest completed focus session in minutes (0 when none yet). */
export const longestSessionAtom = atom((get) => {
  let longest = 0
  for (const entry of get(sessionLogAtom)) {
    if (entry.mode === 'focus' && entry.minutes > longest) {
      longest = entry.minutes
    }
  }
  return longest
})

function newSessionId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return `s-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export const startAtom = atom(null, (_get, set) => {
  set(runningAtom, true)
})

export const pauseAtom = atom(null, (_get, set) => {
  set(runningAtom, false)
})

export const resetAtom = atom(null, (get, set) => {
  set(runningAtom, false)
  set(secondsLeftAtom, durationForMode(get(modeAtom), get(settingsAtom)))
})

export const switchModeAtom = atom(null, (get, set, mode: TimerMode) => {
  set(runningAtom, false)
  set(modeAtom, mode)
  set(secondsLeftAtom, durationForMode(mode, get(settingsAtom)))
})

/**
 * Handles a finished interval: records stats for a focus session, picks
 * the next mode (focus -> short/long break, break -> focus), plays the
 * completion chime, and auto-starts the next interval when configured.
 */
export const completeSessionAtom = atom(null, (get, set) => {
  const mode = get(modeAtom)
  const settings = get(settingsAtom)

  // Record the finished interval in the session log with its real end time.
  set(sessionLogAtom, [
    ...get(sessionLogAtom),
    {
      id: newSessionId(),
      mode,
      minutes: durationForMode(mode, settings) / 60,
      task: mode === 'focus' ? get(taskLabelAtom) : '',
      endedAt: new Date().toISOString(),
    },
  ])

  if (mode === 'focus') {
    const today = localDateKey(new Date())
    const history = get(historyAtom)
    const current = history[today] ?? { sessions: 0, focusMinutes: 0 }
    set(historyAtom, {
      ...history,
      [today]: {
        sessions: current.sessions + 1,
        focusMinutes: current.focusMinutes + settings.focusMinutes,
      },
    })

    const cycle = get(cycleCountAtom) + 1
    const longBreakDue = cycle >= settings.sessionsBeforeLongBreak
    const nextMode: TimerMode = longBreakDue ? 'longBreak' : 'shortBreak'
    set(cycleCountAtom, longBreakDue ? 0 : cycle)
    set(modeAtom, nextMode)
    set(secondsLeftAtom, durationForMode(nextMode, settings))
    if (settings.soundEnabled) playChime()
    if (settings.autoStartBreaks) set(runningAtom, true)
  } else {
    set(modeAtom, 'focus')
    set(secondsLeftAtom, durationForMode('focus', settings))
    if (settings.soundEnabled) playChime()
    if (settings.autoStartFocus) set(runningAtom, true)
  }
})

export const tickAtom = atom(null, (get, set) => {
  if (!get(runningAtom)) return
  const left = get(secondsLeftAtom)
  if (left > 1) {
    set(secondsLeftAtom, left - 1)
    return
  }
  // Timer reached zero: stop and complete the current session.
  set(secondsLeftAtom, 0)
  set(runningAtom, false)
  set(completeSessionAtom)
})
