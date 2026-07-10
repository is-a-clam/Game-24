import { solve } from './solver'

const DEFAULT_NUMBER_COUNT = 4
const DEFAULT_MIN_NUMBER = 1
const DEFAULT_MAX_NUMBER = 13
const DEFAULT_TARGET = 24
const DEFAULT_MAX_ATTEMPTS = 1000

export type GeneratedPuzzle = {
  numbers: number[]
  solutions: string[]
}

export type GeneratePuzzleOptions = {
  count?: number
  min?: number
  max?: number
  target?: number
  maxAttempts?: number
}

export function generatePuzzle(options: GeneratePuzzleOptions = {}): GeneratedPuzzle {
  const count = options.count ?? DEFAULT_NUMBER_COUNT
  const min = options.min ?? DEFAULT_MIN_NUMBER
  const max = options.max ?? DEFAULT_MAX_NUMBER
  const target = options.target ?? DEFAULT_TARGET
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS

  validateGenerationOptions({ count, min, max, target, maxAttempts })

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const numbers = generateNumbers(count, min, max)
    const solutions = solve(numbers, target)

    if (solutions.length > 0) {
      return { numbers, solutions }
    }
  }

  throw new Error(`No solvable puzzle exists.`)
}

function generateNumbers(count: number, min: number, max: number): number[] {
  return Array.from({ length: count }, () => randomInteger(min, max))
}

function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function validateGenerationOptions(options: {
  count: number
  min: number
  max: number
  target: number
  maxAttempts: number
}): void {
  if (!Number.isInteger(options.count) || options.count < 1) {
    throw new Error('Puzzle number count must be a positive integer.')
  }

  if (!Number.isInteger(options.min) || !Number.isInteger(options.max)) {
    throw new Error('Puzzle number bounds must be integers.')
  }

  if (options.min > options.max) {
    throw new Error('Puzzle minimum number cannot be greater than maximum number.')
  }

  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1) {
    throw new Error('Puzzle maxAttempts must be a positive integer.')
  }
}
