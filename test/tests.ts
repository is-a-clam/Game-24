import assert from 'node:assert/strict'
import { generatePuzzle } from '../src/generate'
import { solve } from '../src/solver'

const RANDOM_GENERATION_TEST_RUNS = 25

function assertSolvable(numbers: number[], target = 24): void {
  const solutions = solve(numbers, target)

  console.log(numbers.join(', ') + ' solve for ' + target)
  console.log(solutions)

  assert.ok(solutions.length > 0, `Expected ${numbers.join(', ')} to solve target ${target}`)
}

function assertUnsolvable(numbers: number[], target = 24): void {
  const solutions = solve(numbers, target)

  console.log(numbers.join(', ') + ' solve for ' + target)
  console.log(solutions)

  assert.equal(solutions.length, 0, `Expected ${numbers.join(', ')} not to solve target ${target}`)
}

function assertExpressionUsesNumbersOnce(expression: string, numbers: number[]): void {
  const expressionNumbers = expression.match(/\d+/g)?.map(Number) ?? []

  assert.deepEqual(
    expressionNumbers.toSorted(),
    numbers.toSorted(),
    `Expected "${expression}" to use ${numbers.join(', ')} exactly once`,
  )
}

function assertGeneratedPuzzleIsValid(): void {
  const puzzle = generatePuzzle()

  console.log(puzzle.numbers.join(', ') + ' generated puzzle')
  console.log(puzzle.solutions)

  assert.equal(puzzle.numbers.length, 4, 'Expected generated puzzle to contain 4 numbers')
  assert.ok(puzzle.solutions.length > 0, 'Expected generated puzzle to include at least one solution')

  for (const number of puzzle.numbers) {
    assert.ok(Number.isInteger(number), `Expected generated number ${number} to be an integer`)
    assert.ok(number >= 1 && number <= 13, `Expected generated number ${number} to be between 1 and 13`)
  }

  for (const solution of puzzle.solutions) {
    assertExpressionUsesNumbersOnce(solution, puzzle.numbers)
  }
}

assertSolvable([1, 3, 4, 6])
assertSolvable([5, 5, 5, 1])
assertSolvable([8, 8, 3, 3])
assertSolvable([1, 2, 3], 6)
assertUnsolvable([1, 1, 1, 1])

for (let run = 0; run < RANDOM_GENERATION_TEST_RUNS; run += 1) {
  assertGeneratedPuzzleIsValid()
}

console.log('All tests passed.')
