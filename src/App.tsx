import { useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  MODE_LABELS,
  cycleCountAtom,
  durationAtom,
  longestSessionAtom,
  modeAtom,
  pauseAtom,
  progressAtom,
  resetAtom,
  runningAtom,
  secondsLeftAtom,
  sessionHistoryAtom,
  settingsAtom,
  startAtom,
  streakAtom,
  switchModeAtom,
  taskLabelAtom,
  themeModeAtom,
  themeModeExplicitAtom,
  themeStyleAtom,
  tickAtom,
  todayStatsAtom,
  totalStatsAtom,
  type SessionEntry,
  type Settings,
  type ShowcaseMode,
  type ShowcaseStyle,
  type TimerMode,
} from './store'
import './App.css'

/* Inline lucide-style icons (stroke, 24×24) — no icon dependency. */
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

function LandmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" x2="21" y1="22" y2="22" />
      <line x1="6" x2="6" y1="18" y2="11" />
      <line x1="10" x2="10" y1="18" y2="11" />
      <line x1="14" x2="14" y1="18" y2="11" />
      <line x1="18" x2="18" y1="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}

/** One tasteful Faravahar silhouette (gold, header only, Achaemenid only). */
function FaravaharIcon() {
  return (
    <svg className="faravahar" width="52" height="28" viewBox="0 0 64 28" fill="currentColor" aria-hidden="true">
      <circle cx="32" cy="14" r="4.5" />
      <circle cx="32" cy="14" r="2" fill="var(--bg)" />
      <path d="M27 12 C18 4 8 3 2 6 C8 8 12 10 15 13 L27 13 Z" />
      <path d="M37 12 C46 4 56 3 62 6 C56 8 52 10 49 13 L37 13 Z" />
      <path d="M27 16 C18 24 8 25 2 22 C8 20 12 18 15 15 L27 15 Z" />
      <path d="M37 16 C46 24 56 25 62 22 C56 20 52 18 49 15 L37 15 Z" />
      <path d="M30 19 L28 27 L31 27 L32 20 L33 27 L36 27 L34 19 Z" />
    </svg>
  )
}

function ThemeSwitcher({
  style,
  mode,
  onStyle,
  onToggleMode,
}: {
  style: ShowcaseStyle
  mode: ShowcaseMode
  onStyle: (s: ShowcaseStyle) => void
  onToggleMode: () => void
}) {
  return (
    <div className="theme-switcher">
      <div className="style-segmented" role="group" aria-label="Visual style">
        <button
          type="button"
          className={`style-option${style === 'achaemenid' ? ' style-option--active' : ''}`}
          aria-pressed={style === 'achaemenid'}
          onClick={() => onStyle('achaemenid')}
        >
          <LandmarkIcon />
          Achaemenid
        </button>
        <button
          type="button"
          className={`style-option${style === 'modern' ? ' style-option--active' : ''}`}
          aria-pressed={style === 'modern'}
          onClick={() => onStyle('modern')}
        >
          <SparklesIcon />
          Modern
        </button>
      </div>
      <button
        type="button"
        className="mode-toggle"
        aria-label="Toggle dark mode"
        aria-pressed={mode === 'dark'}
        onClick={onToggleMode}
      >
        {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  )
}

const MODES: TimerMode[] = ['focus', 'shortBreak', 'longBreak']

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

const RING_SIZE = 300
const RING_RADIUS = 132
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ProgressRing({ progress, mode }: { progress: number; mode: TimerMode }) {
  const offset = RING_CIRCUMFERENCE * (1 - progress)
  return (
    <svg
      className="ring"
      width={RING_SIZE}
      height={RING_SIZE}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      role="img"
      aria-label={`Timer progress: ${Math.round(progress * 100)} percent`}
    >
      <circle
        className="ring-track"
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
      />
      <circle
        className={`ring-progress ring-progress--${mode}`}
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
      />
    </svg>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="field-input"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next)) {
            onChange(Math.min(max, Math.max(min, next)))
          }
        }}
      />
      <span className="field-unit">min</span>
    </label>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true" />
      <span className="toggle-label">{label}</span>
    </label>
  )
}

function formatSessionTime(endedAt: string): string {
  const date = new Date(endedAt)
  const time = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (sameDay) return `Today, ${time}`
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`
}

/** Newest-first list of completed sessions, from the persisted log. */
function SessionHistory({ entries }: { entries: SessionEntry[] }) {
  return (
    <section className="history" aria-label="Session history">
      <h2 className="section-title">Session history</h2>
      {entries.length === 0 ? (
        <p className="history-empty">
          No completed sessions yet — your finished focus and break sessions
          will appear here with their real times.
        </p>
      ) : (
        <ul className="history-list">
          {entries.slice(0, 8).map((entry) => (
            <li key={entry.id} className="history-item">
              <span
                className={`history-dot history-dot--${entry.mode}`}
                aria-hidden="true"
              />
              <span className="history-main">
                <span className="history-mode">
                  {MODE_LABELS[entry.mode]}
                </span>
                {entry.task && (
                  <span className="history-task">{entry.task}</span>
                )}
              </span>
              <span className="history-minutes">{entry.minutes} min</span>
              <time className="history-time" dateTime={entry.endedAt}>
                {formatSessionTime(entry.endedAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function App() {
  const mode = useAtomValue(modeAtom)
  const [secondsLeft] = useAtom(secondsLeftAtom)
  const [running] = useAtom(runningAtom)
  const [settings, setSettings] = useAtom(settingsAtom)
  const [taskLabel, setTaskLabel] = useAtom(taskLabelAtom)
  const [cycleCount] = useAtom(cycleCountAtom)
  const duration = useAtomValue(durationAtom)
  const progress = useAtomValue(progressAtom)
  const today = useAtomValue(todayStatsAtom)
  const total = useAtomValue(totalStatsAtom)
  const streak = useAtomValue(streakAtom)
  const longest = useAtomValue(longestSessionAtom)
  const history = useAtomValue(sessionHistoryAtom)

  const start = useSetAtom(startAtom)
  const pause = useSetAtom(pauseAtom)
  const reset = useSetAtom(resetAtom)
  const switchMode = useSetAtom(switchModeAtom)
  const tick = useSetAtom(tickAtom)

  const [showSettings, setShowSettings] = useState(false)

  // --- Theme: Jotai persisted atoms + matchMedia sync -------------------
  const [themeStyle, setThemeStyle] = useAtom(themeStyleAtom)
  const [themeMode, setThemeMode] = useAtom(themeModeAtom)
  const [themeModeExplicit, setThemeModeExplicit] = useAtom(
    themeModeExplicitAtom,
  )

  // Apply data-style / data-mode to <html> whenever the atoms change.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-style', themeStyle)
    root.setAttribute('data-mode', themeMode)
    root.style.colorScheme = themeMode
  }, [themeStyle, themeMode])

  // Sync with the OS preference until the user picks a mode explicitly.
  useEffect(() => {
    if (themeModeExplicit) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setThemeMode(mq.matches ? 'dark' : 'light')
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [themeModeExplicit, setThemeMode])

  const toggleThemeMode = () => {
    setThemeModeExplicit(true)
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark')
  }

  // One-second heartbeat while the timer is running.
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => tick(), 1000)
    return () => window.clearInterval(id)
  }, [running, tick])

  // Datasheet title: live numbers from the persisted session state.
  const datasheetTitle = `Focus Timer v2 — ${total.sessions} sessions · ${total.focusMinutes} focus min · streak ${streak}`

  // Keep the browser tab title in sync with the countdown; the datasheet
  // title is always present so the tab itself states the live counts.
  useEffect(() => {
    document.title = running
      ? `${formatTime(secondsLeft)} · ${datasheetTitle}`
      : datasheetTitle
  }, [secondsLeft, running, datasheetTitle])

  // Proof strip: live counts from the atom state, honest when empty.
  const proofStrip =
    total.sessions === 0
      ? '0 sessions yet — start your first focus'
      : `${today.sessions} sessions · ${today.focusMinutes} focus min today · ${streak}-day streak`

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings({ ...settings, ...patch })
  }

  const cycleDots = Array.from(
    { length: settings.sessionsBeforeLongBreak },
    (_, i) => i < cycleCount,
  )

  const statusText = `${MODE_LABELS[mode]} · ${running ? 'Running' : 'Paused'}`

  return (
    <div className={`app app--${mode}`}>
      <header className="header">
        <div className="title-block">
          <FaravaharIcon />
          <div>
            <h1 className="title">{datasheetTitle}</h1>
            <p className="subtitle">A Pomodoro timer for deep, distraction-free work.</p>
          </div>
        </div>
        <div className="header-controls">
          <ThemeSwitcher
            style={themeStyle}
            mode={themeMode}
            onStyle={setThemeStyle}
            onToggleMode={toggleThemeMode}
          />
          <button
            type="button"
            className="settings-button"
            onClick={() => setShowSettings((v) => !v)}
            aria-expanded={showSettings}
          >
            {showSettings ? 'Close settings' : 'Settings'}
          </button>
        </div>
      </header>

      <div className="proof-strip" role="status">
        {proofStrip}
      </div>

      {showSettings && (
        <section className="settings" aria-label="Timer settings">
          <h2 className="section-title">Durations</h2>
          <div className="settings-grid">
            <NumberField
              label="Focus"
              value={settings.focusMinutes}
              min={1}
              max={180}
              onChange={(v) => updateSettings({ focusMinutes: v })}
            />
            <NumberField
              label="Short break"
              value={settings.shortBreakMinutes}
              min={1}
              max={60}
              onChange={(v) => updateSettings({ shortBreakMinutes: v })}
            />
            <NumberField
              label="Long break"
              value={settings.longBreakMinutes}
              min={1}
              max={90}
              onChange={(v) => updateSettings({ longBreakMinutes: v })}
            />
            <NumberField
              label="Focus sessions before long break"
              value={settings.sessionsBeforeLongBreak}
              min={2}
              max={8}
              onChange={(v) => updateSettings({ sessionsBeforeLongBreak: v })}
            />
          </div>
          <div className="settings-toggles">
            <ToggleField
              label="Play sound when a session ends"
              checked={settings.soundEnabled}
              onChange={(v) => updateSettings({ soundEnabled: v })}
            />
            <ToggleField
              label="Start breaks automatically"
              checked={settings.autoStartBreaks}
              onChange={(v) => updateSettings({ autoStartBreaks: v })}
            />
            <ToggleField
              label="Start focus sessions automatically"
              checked={settings.autoStartFocus}
              onChange={(v) => updateSettings({ autoStartFocus: v })}
            />
          </div>
          <p className="settings-note">
            Changing a duration resets the current timer to the new length for
            its mode. Your settings are saved in this browser.
          </p>
        </section>
      )}

      <div className="main-grid">
        <main className="timer-card">
          <div className="mode-tabs" role="tablist" aria-label="Timer mode">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`mode-tab${mode === m ? ' mode-tab--active' : ''}`}
              onClick={() => switchMode(m)}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div
          className={`status-pill${running ? ' status-pill--running' : ''}`}
          role="status"
        >
          <span className="status-pill__dot" aria-hidden="true" />
          {statusText}
        </div>

        <div className="ring-wrap">
          <ProgressRing progress={progress} mode={mode} />
          <div className="ring-center">
            <div className="time" aria-live="off">
              {formatTime(secondsLeft)}
            </div>
            <div className="cycle">
              {cycleDots.map((filled, i) => (
                <span
                  key={i}
                  className={`cycle-dot${filled ? ' cycle-dot--filled' : ''}`}
                  title={`Focus session ${i + 1} of ${settings.sessionsBeforeLongBreak}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="task-row">
          <label className="task-label" htmlFor="task">
            Working on
          </label>
          <input
            id="task"
            className="task-input"
            type="text"
            placeholder="What are you focusing on?"
            value={taskLabel}
            maxLength={120}
            onChange={(event) => setTaskLabel(event.target.value)}
          />
        </div>

        <div className="controls">
          {running ? (
            <button type="button" className="btn btn-primary" onClick={pause}>
              Pause
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={start}>
              {secondsLeft < duration ? 'Resume' : 'Start'}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={reset}>
            Reset
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              switchMode(mode === 'focus' ? 'shortBreak' : 'focus')
            }
          >
            {mode === 'focus' ? 'Skip to break' : 'Skip to focus'}
          </button>
        </div>

        <p className="hint">
          {mode === 'focus'
            ? taskLabel
              ? `Focusing on: ${taskLabel}`
              : 'Pick one task, then start the timer.'
            : 'Take a real break — step away from the screen.'}
        </p>
        </main>

        <aside className="side-panel">
          <section className="stats" aria-label="Focus statistics">
            <h2 className="section-title">Your progress</h2>
            <div className="stats-grid">
              <article className="stat-card">
                <div className="stat-value">{today.sessions}</div>
                <div className="stat-label">Sessions today</div>
                <div className="stat-sub">{formatMinutes(today.focusMinutes)} focused</div>
              </article>
              <article className="stat-card">
                <div className="stat-value">
                  {formatMinutes(total.focusMinutes)}
                </div>
                <div className="stat-label">Total focus time</div>
                <div className="stat-sub">
                  {total.sessions} session{total.sessions === 1 ? '' : 's'} overall
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-value">
                  {streak}
                  <span className="stat-unit"> day{streak === 1 ? '' : 's'}</span>
                </div>
                <div className="stat-label">Current streak</div>
                <div className="stat-sub">Consecutive days</div>
              </article>
              <article className="stat-card">
                <div className="stat-value">
                  {longest === 0 ? '—' : formatMinutes(longest)}
                </div>
                <div className="stat-label">Longest session</div>
                <div className="stat-sub">
                  {longest === 0
                    ? 'No focus session yet'
                    : 'Single focus session'}
                </div>
              </article>
            </div>
          </section>

          <SessionHistory entries={history} />
        </aside>
      </div>

      <footer className="footer">
        Progress is saved locally in your browser — no account, no tracking.
      </footer>
    </div>
  )
}
