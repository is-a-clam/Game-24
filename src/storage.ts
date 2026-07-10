import { useEffect, useState } from 'react'

type PersistentOptions<T> = {
  validate?: (value: unknown) => value is T
}

export function usePersistentState<T>(storageKey: string, fallback: T, options: PersistentOptions<T> = {}) {
  const { validate } = options

  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw === null) return fallback

      const parsed = JSON.parse(raw) as unknown
      if (validate && !validate(parsed)) return fallback
      return parsed as T
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      // Ignore quota/private-mode errors
    }
  }, [storageKey, state])

  return [state, setState] as const
}
