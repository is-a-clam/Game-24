export type Op = '+' | '-' | '*' | '/'

export type Expr = { kind: 'num'; value: number } | { kind: 'op'; op: Op; left: Expr; right: Expr }

export function num(value: number): Expr {
  return { kind: 'num', value }
}

export function op(operator: Op, left: Expr, right: Expr): Expr {
  return { kind: 'op', op: operator, left, right }
}

function toDisplayString(e: Expr): string {
  if (e.kind === 'num') return String(e.value)
  const l = toDisplayString(e.left)
  const r = toDisplayString(e.right)
  return `(${l} ${e.op} ${r})`
}

type SignedTerm = { sign: 1 | -1; expr: Expr }
type ExpFactor = { exp: 1 | -1; expr: Expr }

// Flatten a chain of + and - into a list of signed leaves/subtrees
function flattenAdd(e: Expr, sign: 1 | -1 = 1): SignedTerm[] {
  if (e.kind === 'op' && e.op === '+') {
    return [...flattenAdd(e.left, sign), ...flattenAdd(e.right, sign)]
  }
  if (e.kind === 'op' && e.op === '-') {
    return [...flattenAdd(e.left, sign), ...flattenAdd(e.right, (sign * -1) as 1 | -1)]
  }
  return [{ sign, expr: e }]
}

// Flatten a chain of * and / into a list of exponentiated leaves/subtrees.
function flattenMul(e: Expr, exp: 1 | -1 = 1): ExpFactor[] {
  if (e.kind === 'op' && e.op === '*') {
    return [...flattenMul(e.left, exp), ...flattenMul(e.right, exp)]
  }
  if (e.kind === 'op' && e.op === '/') {
    return [...flattenMul(e.left, exp), ...flattenMul(e.right, (exp * -1) as 1 | -1)]
  }
  return [{ exp, expr: e }]
}

type CanonicalValue = { kind: 'value'; value: string }
type CanonicalCompound = { kind: 'compound'; sign: 1 | -1; value: string }
type CanonicalExpr = CanonicalCompound | CanonicalValue

// Turns an expression into its canonical normal form
function canonicalForm(e: Expr): CanonicalExpr {
  if (e.kind === 'num') {
    return { kind: 'value', value: String(e.value) }
  }

  if (e.op === '+' || e.op === '-') {
    const terms = flattenAdd(e)
    var canonTerms = terms
      .map((t) => {
        const canonical = canonicalForm(t.expr)
        if (canonical.kind === 'value') return { sign: t.sign, value: canonical.value }
        return { sign: t.sign * canonical.sign, value: canonical.value }
      })
      .sort((a, b) => {
        if (a.value < b.value) return -1
        if (a.value > b.value) return 1
        return a.sign - b.sign
      })
    var sign: 1 | -1 = 1
    if (canonTerms.length > 0 && canonTerms[0].sign === -1) {
      sign = -1
      canonTerms = canonTerms.map((t) => ({ sign: (t.sign * -1) as 1 | -1, value: t.value }))
    }
    const inner = canonTerms.map((t) => `${t.sign === 1 ? '+' : '-'}${t.value}`).join(',')
    return { kind: 'compound', sign: sign, value: `SUM[${inner}]` }
  } else {
    const factors = flattenMul(e)
    const canonFactors = factors
      .map((f) => {
        const canonical = canonicalForm(f.expr)
        if (canonical.kind === 'value') return { sign: 1 as 1 | -1, exp: f.exp, value: canonical.value }
        return { sign: canonical.sign, exp: f.exp, value: canonical.value }
      })
      .sort((a, b) => {
        if (a.value < b.value) return -1
        if (a.value > b.value) return 1
        return a.exp - b.exp
      })
    const sign = canonFactors.reduce((prev, curr) => (prev * curr.sign) as 1 | -1, 1 as 1 | -1)
    const inner = canonFactors.map((f) => `${f.value}^${f.exp}`).join(',')
    return { kind: 'compound', sign: sign, value: `PROD[${inner}]` }
  }
}

function canonicalFormToString(c: CanonicalExpr): string {
  if (c.kind === 'value') {
    return c.value
  }
  return `${c.sign === 1 ? '+' : '-'}(${c.value})`
}

// Deduplicate a list of expressions
export function dedupeSolutions(solutions: Expr[]): { expr: Expr; display: string; canonical: string }[] {
  const seen = new Set<string>()
  const result: { expr: Expr; display: string; canonical: string }[] = []

  for (const expr of solutions) {
    const canonical = canonicalFormToString(canonicalForm(expr))
    if (!seen.has(canonical)) {
      seen.add(canonical)
      result.push({ expr, display: toDisplayString(expr), canonical })
    }
  }

  return result
}
