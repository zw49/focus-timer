import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'focus-timer-completed-days'

function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0]
}

function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(getDateString(date))
  }
  return days
}

function App() {
  const [timeLeft, setTimeLeft] = useState(1 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedMinutes, setSelectedMinutes] = useState(1)
  const [completedDays, setCompletedDays] = useState([])
  const [isFirstVisit, setIsFirstVisit] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const intervalRef = useRef(null)

  const presetTimes = Array.from({ length: 10 }, (_, i) => i + 1)
  const last7Days = getLast7Days()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setCompletedDays(JSON.parse(stored))
      setIsFirstVisit(false)
    }
  }, [])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      markTodayComplete()
      setTimeLeft(selectedMinutes * 60)
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft])

  const markTodayComplete = () => {
    const today = getDateString()
    if (!completedDays.includes(today)) {
      const updated = [...completedDays, today]
      setCompletedDays(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    if (isFirstVisit) {
      setShowModal(true)
    } else {
      setIsRunning(true)
    }
  }

  const handleModalStart = () => {
    setShowModal(false)
    setIsFirstVisit(false)
    setIsRunning(true)
  }
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(selectedMinutes * 60)
  }

  const handleSelectTime = (minutes) => {
    setSelectedMinutes(minutes)
    setTimeLeft(minutes * 60)
    setIsRunning(false)
  }

  const getDayLabel = (dateString) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)
  }

  const calculateStreak = () => {
    let streak = 0
    const today = new Date()

    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = getDateString(date)

      if (completedDays.includes(dateStr)) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    return streak
  }

  const streak = calculateStreak()

  return (
    <div className="min-h-screen flex flex-col items-center bg-base-200">
      <div
        className={`flex items-center justify-center w-full relative transition-all duration-700 ${isRunning ? 'flex-8' : 'flex-1'
          }`}
      >
        {/* Focus circle */}
        <div
          className={`absolute card bg-base-100 shadow-xl rounded-full w-lg h-128 flex items-center justify-center transition-all duration-700 ease-out ${isRunning
            ? 'opacity-100 scale-75 sm:scale-100'
            : 'opacity-0 scale-50 pointer-events-none'
            }`}
        >
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse-dot"></div>
        </div>

        {/* Streak display */}
        <div
          className={`absolute flex flex-col items-center gap-4 transition-all duration-500 ease-out ${isRunning
            ? 'opacity-0 scale-90 pointer-events-none'
            : 'opacity-100 scale-100'
            }`}
        >
          <div className="text-center">
            <div className="text-4xl font-bold">{streak}</div>
            <div className="text-sm opacity-60">day streak</div>
          </div>
          <div className="flex gap-2 justify-center">
            {last7Days.map((day) => (
              <div key={day} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center transition-colors duration-300 ${completedDays.includes(day)
                    ? 'bg-primary text-primary-content'
                    : 'bg-base-300'
                    }`}
                >
                  {completedDays.includes(day) && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs opacity-60">{getDayLabel(day)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`flex-1 flex justify-center w-full transition-all duration-700 ease-out ${isRunning ? 'items-end pb-8' : 'items-start pt-8'
          }`}
      >
        <div className="card bg-base-100 shadow-xl p-4 transition-all duration-500">
          <div className="text-5xl font-mono text-center mb-4 mt-4 transition-all duration-300">
            {formatTime(timeLeft)}
          </div>

          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${isRunning ? 'max-h-0 opacity-0 mb-0' : 'max-h-40 opacity-100 mb-3'
              }`}
          >
            <div className="flex flex-wrap gap-1 justify-center max-w-md">
              {presetTimes.map((mins) => (
                <button
                  key={mins}
                  className={`btn btn-xs transition-all duration-200 ${selectedMinutes === mins ? 'btn-primary' : 'btn-outline'
                    }`}
                  onClick={() => handleSelectTime(mins)}
                >
                  {mins}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <button
              className={`btn btn-lg transition-all duration-300 ${isRunning ? 'btn-ghost' : 'btn-primary'
                }`}
              onClick={isRunning ? handlePause : handleStart}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button className="btn btn-ghost btn-lg" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* First visit modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Welcome to Focus Timer!</h3>
            <p className="py-4">
              Focus Timer uses visual fixation to reset your attention. Stare at the dot, let distractions fade, and begin your work with a sharper, calmer, more controlled mind.
            </p>
            <p className="text-sm opacity-70">
              Studies show that visual fixation behavior is tightly linked to sustained attention performance, meaning how steadily your eyes fixate predicts how well you focus on tasks. The “quiet eye” literature in sports and motor control finds that a stable final fixation before action improves accuracy and efficiency, and disrupting it hurts performance, suggesting fixation actively shapes information processing. Clinical and training studies show that visual attention or eye-movement–based training can improve selective attention, working memory, and processing speed, especially in rehab settings, demonstrating causal transfer beyond the trained task. Research on focused-attention meditation (sustaining attention on one object) also finds consistent neural and physiological changes in attention networks. <b>The core idea:</b> training sustained visual attention changes how the brain allocates focus and can transfer to broader cognitive performance.
            </p>
            <div className="modal-action">
              <button className="btn btn-primary" onClick={handleModalStart}>
                Start Focusing
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
        </div>
      )}
    </div>
  )
}

export default App
