import { useState, useEffect, useRef } from 'react'
import './Settings.css'

export type PuzzleSettings = {
  target: number
  min: number
  max: number
}

type SettingsProps = {
  isOpen: boolean
  onClose: () => void
  settings: PuzzleSettings
  setSettings: (settings: PuzzleSettings) => void
  isGenerating: boolean
}

export default function Settings(props: SettingsProps) {
  const [isRendered, setIsRendered] = useState(props.isOpen)
  const [isVisible, setIsVisible] = useState(false)

  const [draftSettings, setDraftSettings] = useState<PuzzleSettings>(props.settings)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const firstInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (props.isOpen) {
      setIsRendered(true)
      setIsVisible(false)

      setDraftSettings(props.settings)
      setSettingsError(null)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
          firstInputRef.current?.focus()
        })
      })
    } else {
      setIsVisible(false)
      const timeout = window.setTimeout(() => setIsRendered(false), 250)
      return () => window.clearTimeout(timeout)
    }
  }, [props.isOpen])

  function handleSettingChange(setting: keyof PuzzleSettings, value: number) {
    setDraftSettings((currentSettings) => ({
      ...currentSettings,
      [setting]: value,
    }))
  }

  function handleApplySettings() {
    const error = getErrorMessage(draftSettings)
    setSettingsError(error)
    if (error !== null) {
      return
    }

    props.setSettings(draftSettings)
    props.onClose()
  }

  if (!isRendered) return null

  return (
    <div className={`options-layer ${isVisible ? 'is-open' : ''}`} role='presentation'>
      <button className='options-backdrop' type='button' aria-label='Close options' onClick={props.onClose} />

      <aside className='options-panel' role='dialog' aria-modal='true' aria-labelledby='options-title'>
        <h2 id='options-title'>Options</h2>
        <div className='settings-form'>
          <label className='setting-field'>
            <span>Target</span>
            <input
              ref={firstInputRef}
              type='number'
              inputMode='numeric'
              value={formatNumberInputValue(draftSettings.target)}
              onChange={(event) => handleSettingChange('target', event.currentTarget.valueAsNumber)}
            />
          </label>

          <label className='setting-field'>
            <span>Minimum</span>
            <input
              type='number'
              inputMode='numeric'
              value={formatNumberInputValue(draftSettings.min)}
              onChange={(event) => handleSettingChange('min', event.currentTarget.valueAsNumber)}
            />
          </label>

          <label className='setting-field'>
            <span>Maximum</span>
            <input
              type='number'
              inputMode='numeric'
              value={formatNumberInputValue(draftSettings.max)}
              onChange={(event) => handleSettingChange('max', event.currentTarget.valueAsNumber)}
            />
          </label>
        </div>

        {settingsError !== null && <p className='settings-error'>{settingsError}</p>}

        <div className='options-actions'>
          <button className='secondary-action' type='button' onClick={props.onClose}>
            Cancel
          </button>
          <button className='primary-action' type='button' onClick={handleApplySettings} disabled={props.isGenerating}>
            Apply
          </button>
        </div>
      </aside>
    </div>
  )
}

function getErrorMessage(settings: PuzzleSettings): string | null {
  if (!Number.isInteger(settings.target) || !Number.isInteger(settings.min) || !Number.isInteger(settings.max)) {
    return 'All options must be whole numbers.'
  }

  if (settings.min > settings.max) {
    return 'Minimum cannot be greater than maximum.'
  }

  return null
}

function formatNumberInputValue(value: number): number | '' {
  return Number.isNaN(value) ? '' : value
}
