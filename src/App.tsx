import { useEffect, useRef, useState } from 'react'
import { IoSettings } from 'react-icons/io5'
import './App.css'
import { generatePuzzle, type GeneratedPuzzle } from './generate'
import Settings, { type PuzzleSettings } from './Settings.tsx'
import { usePersistentState } from './storage.ts'

const APP_STATE_KEY = 'game24:app-state:v1'

type PersistedAppState = {
  version: 1
  settings: PuzzleSettings
  puzzle: GeneratedPuzzle | null
  solutionsVisible: boolean
  generationError: string | null
}

const DEFAULT_SETTINGS: PuzzleSettings = {
  target: 24,
  min: 1,
  max: 13,
}

const DEFAULT_PERSISTED_STATE: PersistedAppState = {
  version: 1,
  settings: DEFAULT_SETTINGS,
  puzzle: null,
  solutionsVisible: false,
  generationError: null,
}

export default function App() {
  const [persistedState, setPersistedState] = usePersistentState<PersistedAppState>(
    APP_STATE_KEY,
    DEFAULT_PERSISTED_STATE,
    { validate: isPersistedAppState },
  )

  const optionsButtonRef = useRef<HTMLButtonElement | null>(null)
  const [puzzle, setPuzzle] = useState<GeneratedPuzzle | null>(persistedState.puzzle)
  const [solutionsVisible, setSolutionsVisible] = useState(persistedState.solutionsVisible)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(persistedState.generationError)

  const [settings, setSettings] = useState<PuzzleSettings>(persistedState.settings)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    if (puzzle === null && generationError === null) {
      handleGeneratePuzzle(settings)
    }
  }, [])

  useEffect(() => {
    setPersistedState({
      version: 1,
      settings,
      puzzle,
      solutionsVisible,
      generationError,
    })
  }, [settings, puzzle, solutionsVisible, generationError, setPersistedState])

  function handleGeneratePuzzle(settings: PuzzleSettings) {
    setIsGenerating(true)

    try {
      const nextPuzzle = generatePuzzle(settings)

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
            onClick={() => handleGeneratePuzzle(settings)}
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
        </div>

        {generationError !== null && (
          <p className='generation-error' role='alert'>
            {generationError}
          </p>
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
          handleGeneratePuzzle(newSettings)
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

function isValidPuzzle(value: unknown): value is GeneratedPuzzle {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    Array.isArray(v.numbers) &&
    v.numbers.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
    Array.isArray(v.solutions) &&
    v.solutions.every((s) => typeof s === 'string')
  )
}

function isPersistedAppState(value: unknown): value is PersistedAppState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>

  if (v.version !== 1) return false
  if (!isValidSettings(v.settings)) return false
  if (v.puzzle !== null && !isValidPuzzle(v.puzzle)) return false
  if (typeof v.solutionsVisible !== 'boolean') return false
  if (v.generationError !== null && typeof v.generationError !== 'string') return false

  return true
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not generate a puzzle.'
}
