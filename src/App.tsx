import { useEffect, useRef, useState } from 'react'
import { IoSettings } from 'react-icons/io5'
import { FaShareSquare } from 'react-icons/fa'
import './App.css'
import { createPuzzleSeed, generatePuzzle, type GeneratedPuzzle } from './generate'
import Settings, { type PuzzleSettings } from './Settings.tsx'
import { usePersistentState } from './storage.ts'

const APP_STATE_KEY = 'game24:app-state:v2'

type PersistedAppState = {
  version: 2
  settings: PuzzleSettings
  seed: string | null
}

const DEFAULT_SETTINGS: PuzzleSettings = {
  target: 24,
  min: 1,
  max: 13,
}

const DEFAULT_PERSISTED_STATE: PersistedAppState = {
  version: 2,
  settings: DEFAULT_SETTINGS,
  seed: null,
}

export default function App() {
  const [persistedState, setPersistedState] = usePersistentState<PersistedAppState>(
    APP_STATE_KEY,
    DEFAULT_PERSISTED_STATE,
    { validate: isPersistedAppState },
  )

  const optionsButtonRef = useRef<HTMLButtonElement | null>(null)

  const [settings, setSettings] = useState<PuzzleSettings>(persistedState.settings)
  const [seed, setSeed] = useState<string | null>(persistedState.seed)
  const [puzzle, setPuzzle] = useState<GeneratedPuzzle | null>(null)
  const [solutionsVisible, setSolutionsVisible] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const target = params.get('target')
    const min = params.get('min')
    const max = params.get('max')
    if (target !== null && min !== null && max !== null) {
      const settingsFromURL = {
        target: parseInt(target),
        min: parseInt(min),
        max: parseInt(max),
      }
      if (isValidSettings(settingsFromURL)) {
        setSettings(settingsFromURL)
      }
    }

    const seedFromURL = params.get('seed')
    console.log('startup seed: ' + seedFromURL)
    if (seedFromURL !== null) {
      setSeed(seedFromURL)
    } else if (seed === null) {
      setSeed(createPuzzleSeed())
    }
  }, [])

  useEffect(() => {
    if (seed !== null) {
      handleGeneratePuzzle(settings, seed)
    }
  }, [settings, seed])

  useEffect(() => {
    if (toastMessage === null) {
      return
    }

    const timeout = window.setTimeout(() => setToastMessage(null), 1500)
    return () => window.clearTimeout(timeout)
  }, [toastMessage])

  useEffect(() => {
    setPersistedState({
      version: 2,
      settings,
      seed,
    })
  }, [settings, seed, setPersistedState])

  function handleGeneratePuzzle(settings: PuzzleSettings, seed: string) {
    setIsGenerating(true)

    try {
      const nextPuzzle = generatePuzzle({ ...settings, seed: seed })

      setPuzzle(nextPuzzle)
      setSolutionsVisible(false)
      setGenerationError(null)
    } catch (error) {
      setPuzzle(null)
      setSolutionsVisible(false)
      setGenerationError(getErrorMessage(error))
    } finally {
      setIsGenerating(false)
    }
  }

  function handleToggleSolutions() {
    setSolutionsVisible((currentValue) => !currentValue)
  }

  function handleCloseSettings() {
    setIsSettingsOpen(false)
    // return focus to the options trigger for keyboard users
    requestAnimationFrame(() => optionsButtonRef.current?.focus())
  }

  async function handleSharePuzzle() {
    try {
      const shareURL = getShareURL().toString()
      await navigator.clipboard.writeText(shareURL)
      setToastMessage('Puzzle link added to clipboard')
    } catch {
      setToastMessage('Could not add puzzle link to clipboard')
    }
  }

  function getShareURL() {
    if (seed === null) {
      throw new Error('Attempting to share non-existent puzzle')
    }

    const url = new URL(window.location.href)
    url.searchParams.set('target', String(settings.target))
    url.searchParams.set('min', String(settings.min))
    url.searchParams.set('max', String(settings.max))
    url.searchParams.set('seed', seed)

    return url
  }

  return (
    <main className='app-shell'>
      <button
        className='options-trigger'
        type='button'
        ref={optionsButtonRef}
        onClick={() => setIsSettingsOpen(true)}
        aria-haspopup='dialog'
        aria-expanded={isSettingsOpen}
      >
        <IoSettings />
      </button>

      <footer className='credits' aria-hidden='true'>
        Created by Isaac Lam
      </footer>

      <section className='game-view' aria-label='24 Game'>
        <div className='number-grid' aria-label='Current puzzle numbers'>
          {(puzzle?.numbers ?? Array(4).fill('')).map((number, index) => (
            <div className='number-tile' key={index}>
              {number}
            </div>
          ))}
        </div>

        <div className='actions'>
          <button
            className='primary-action'
            type='button'
            onClick={() => setSeed(createPuzzleSeed())}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>

          <button
            className='secondary-action'
            type='button'
            onClick={handleToggleSolutions}
            disabled={puzzle === null}
            aria-expanded={solutionsVisible}
            aria-controls='solutions-list'
          >
            {solutionsVisible ? 'Hide Solution' : 'Reveal Solution'}
          </button>

          <button
            className='share-action'
            type='button'
            onClick={handleSharePuzzle}
            disabled={puzzle === null || isGenerating}
            aria-label='Copy share link'
            title='Copy share link'
          >
            <FaShareSquare />
          </button>
        </div>

        {generationError !== null && (
          <p className='generation-error' role='alert'>
            {generationError}
          </p>
        )}

        {toastMessage !== null && (
          <div className='toast' role='status' aria-live='polite'>
            {toastMessage}
          </div>
        )}

        {solutionsVisible && (
          <section className='solutions' aria-label='Solutions' id='solutions-list'>
            <h2>Solution</h2>
            <ul aria-live='polite'>
              {puzzle?.solutions.map((solution) => (
                <li key={solution} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {solution}
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>

      <Settings
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        settings={settings}
        setSettings={(newSettings) => {
          setSettings(newSettings)
        }}
        isGenerating={isGenerating}
      />
    </main>
  )
}

function isValidSettings(value: unknown): value is PuzzleSettings {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return Number.isInteger(v.target) && Number.isInteger(v.min) && Number.isInteger(v.max)
}

function isPersistedAppState(value: unknown): value is PersistedAppState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>

  if (v.version !== 2) return false
  if (!isValidSettings(v.settings)) return false
  if (v.seed !== null && typeof v.seed !== 'string') return false
  return true
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not generate a puzzle.'
}
