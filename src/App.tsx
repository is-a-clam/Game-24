import { useEffect, useRef, useState } from 'react'
import { IoSettings } from 'react-icons/io5'
import './App.css'
import { generatePuzzle, type GeneratedPuzzle } from './generate'
import Settings, { type PuzzleSettings } from './Settings.tsx'

const DEFAULT_SETTINGS: PuzzleSettings = {
  target: 24,
  min: 1,
  max: 13,
}

export default function App() {
  const optionsButtonRef = useRef<HTMLButtonElement | null>(null)
  const [puzzle, setPuzzle] = useState<GeneratedPuzzle | null>(null)
  const [solutionsVisible, setSolutionsVisible] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const [settings, setSettings] = useState<PuzzleSettings>(DEFAULT_SETTINGS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => handleGeneratePuzzle(DEFAULT_SETTINGS), [])

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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not generate a puzzle.'
}
