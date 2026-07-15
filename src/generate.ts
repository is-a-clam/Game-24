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
  seed: string
}

export function generatePuzzle(options: GeneratePuzzleOptions): GeneratedPuzzle {
  const count = options.count ?? DEFAULT_NUMBER_COUNT
  const min = options.min ?? DEFAULT_MIN_NUMBER
  const max = options.max ?? DEFAULT_MAX_NUMBER
  const target = options.target ?? DEFAULT_TARGET
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const random = createSeededRandom(String(options.seed))

  validateGenerationOptions({ count, min, max, target, maxAttempts })

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const numbers = generateNumbers(count, min, max, random)
    const solutions = solve(numbers, target)

    if (solutions.length > 0) {
      return { numbers, solutions }
    }
  }

  throw new Error(`No solvable puzzle exists.`)
}

export function createPuzzleSeed(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function generateNumbers(count: number, min: number, max: number, random: () => number): number[] {
  return Array.from({ length: count }, () => randomInteger(min, max, random))
}

function randomInteger(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

function createSeededRandom(seedStr: string) {
  const seed = hash(seedStr)
  let a = seed[0],
    b = seed[1],
    c = seed[2],
    d = seed[3]

  // sfc32 Simple Fast Counter https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
  return function () {
    a |= 0
    b |= 0
    c |= 0
    d |= 0
    let t = (((a + b) | 0) + d) | 0
    d = (d + 1) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
}

function hash(seed: string) {
  // cyrb128 https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762
  for (let i = 0, k; i < seed.length; i++) {
    k = seed.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  h1 ^= h2 ^ h3 ^ h4
  h2 ^= h1
  h3 ^= h1
  h4 ^= h1
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0]
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
