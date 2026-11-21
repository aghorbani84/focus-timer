import { useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  MODE_LABELS,
  cycleCountAtom,
  durationAtom,
  modeAtom,
  pauseAtom,
  progressAtom,
  resetAtom,
  runningAtom,
  secondsLeftAtom,
  settingsAtom,
  startAtom,
  streakAtom,
  switchModeAtom,
  taskLabelAtom,
  tickAtom,
  todayStatsAtom,
  totalStatsAtom,
  weekStatsAtom,
  type Settings,
  type TimerMode,
} from './store'
import './App.css'

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
  const week = useAtomValue(weekStatsAtom)
  const total = useAtomValue(totalStatsAtom)
  const streak = useAtomValue(streakAtom)

  const start = useSetAtom(startAtom)
  const pause = useSetAtom(pauseAtom)
  const reset = useSetAtom(resetAtom)
  const switchMode = useSetAtom(switchModeAtom)
  const tick = useSetAtom(tickAtom)

  const [showSettings, setShowSettings] = useState(false)

  // One-second heartbeat while the timer is running.
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => tick(), 1000)
    return () => window.clearInterval(id)
  }, [running, tick])

  // Keep the browser tab title in sync with the countdown.
  useEffect(() => {
    document.title = running
      ? `${formatTime(secondsLeft)} · ${MODE_LABELS[mode]} — Focus Timer`
      : 'Focus Timer — Pomodoro'
  }, [secondsLeft, running, mode])

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings({ ...settings, ...patch })
  }

  const cycleDots = Array.from(
    { length: settings.sessionsBeforeLongBreak },
    (_, i) => i < cycleCount,
  )

  return (
    <div className={`app app--${mode}`}>
      <header className="header">
        <div>
          <h1 className="title">Focus Timer</h1>
          <p className="subtitle">A Pomodoro timer for deep, distraction-free work.</p>
        </div>
        <button
          type="button"
          className="settings-button"
          onClick={() => setShowSettings((v) => !v)}
          aria-expanded={showSettings}
        >
          {showSettings ? 'Close settings' : 'Settings'}
        </button>
      </header>

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

        <div className="ring-wrap">
          <ProgressRing progress={progress} mode={mode} />
          <div className="ring-center">
            <div className="time" aria-live="off">
              {formatTime(secondsLeft)}
            </div>
            <div className="mode-label">{MODE_LABELS[mode]}</div>
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

      <section className="stats" aria-label="Focus statistics">
        <h2 className="section-title">Your progress</h2>
        <div className="stats-grid">
          <article className="stat-card">
            <div className="stat-value">{today.sessions}</div>
            <div className="stat-label">Sessions today</div>
            <div className="stat-sub">{formatMinutes(today.focusMinutes)} focused</div>
          </article>
          <article className="stat-card">
            <div className="stat-value">{week.sessions}</div>
            <div className="stat-label">Sessions this week</div>
            <div className="stat-sub">{formatMinutes(week.focusMinutes)} focused</div>
          </article>
          <article className="stat-card">
            <div className="stat-value">
              {streak}
              <span className="stat-unit"> day{streak === 1 ? '' : 's'}</span>
            </div>
            <div className="stat-label">Current streak</div>
            <div className="stat-sub">Consecutive days with a session</div>
          </article>
          <article className="stat-card">
            <div className="stat-value">{total.sessions}</div>
            <div className="stat-label">Total sessions</div>
            <div className="stat-sub">{formatMinutes(total.focusMinutes)} focused overall</div>
          </article>
        </div>
      </section>

      <footer className="footer">
        Progress is saved locally in your browser — no account, no tracking.
      </footer>
    </div>
  )
}
