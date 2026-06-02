const EPSILON = 0.000001

export type SolverItem = {
  value: number
  expression: string
}

export function solve(numbers: number[], target = 24): string[] {
  if (numbers.some((number) => !Number.isFinite(number))) {
    return []
  }

  const initialItems = numbers.map((number) => ({
    value: number,
    expression: number.toString(),
  }))

  const solutions = new Set<string>()

  search(initialItems, solutions, target)

  return Array.from(solutions)
}

function search(items: SolverItem[], solutions: Set<string>, target: number): void {
  if (items.length === 1) {
    const [onlyItem] = items

    if (Math.abs(onlyItem.value - target) < EPSILON) {
      solutions.add(onlyItem.expression)
    }

    return
  }

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = items[i]
      const right = items[j]
      const remainingItems = items.filter((_, index) => index !== i && index !== j)
      const candidates = combine(left, right)

      for (const candidate of candidates) {
        search([...remainingItems, candidate], solutions, target)
      }
    }
  }
}

function combine(left: SolverItem, right: SolverItem): SolverItem[] {
  const results: SolverItem[] = [
    {
      value: left.value + right.value,
      expression: `(${left.expression} + ${right.expression})`,
    },
    {
      value: left.value - right.value,
      expression: `(${left.expression} - ${right.expression})`,
    },
    {
      value: right.value - left.value,
      expression: `(${right.expression} - ${left.expression})`,
    },
    {
      value: left.value * right.value,
      expression: `(${left.expression} * ${right.expression})`,
    },
  ]

  if (Math.abs(right.value) >= EPSILON) {
    results.push({
      value: left.value / right.value,
      expression: `(${left.expression} / ${right.expression})`,
    })
  }

  if (Math.abs(left.value) >= EPSILON) {
    results.push({
      value: right.value / left.value,
      expression: `(${right.expression} / ${left.expression})`,
    })
  }

  return results
}
