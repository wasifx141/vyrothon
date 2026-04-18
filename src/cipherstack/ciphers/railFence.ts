import type { CipherDefinition } from '../types'

export type RailFenceConfig = { rails: number }

/** Rail index for each character position in the zigzag write order. */
function zigzagIndices(rails: number, len: number): number[] {
  if (rails < 2 || len === 0) return []
  const out: number[] = []
  let r = 0
  let dirDown = true
  for (let i = 0; i < len; i++) {
    out.push(r)
    if (r === 0) dirDown = true
    else if (r === rails - 1) dirDown = false
    r += dirDown ? 1 : -1
  }
  return out
}

function encryptText(text: string, rails: number): string {
  if (rails < 2) return text
  const n = text.length
  if (n === 0) return ''
  const idx = zigzagIndices(rails, n)
  const rows: string[][] = Array.from({ length: rails }, () => [])
  for (let i = 0; i < n; i++) {
    rows[idx[i]!]!.push(text[i]!)
  }
  return rows.map((row) => row.join('')).join('')
}

function decryptText(text: string, rails: number): string {
  if (rails < 2) return text
  const n = text.length
  if (n === 0) return ''
  const idx = zigzagIndices(rails, n)
  const counts = Array(rails).fill(0)
  for (const x of idx) {
    counts[x]!++
  }
  let offset = 0
  const buckets = counts.map((c) => {
    const part = text.slice(offset, offset + c).split('')
    offset += c
    return part
  })
  const ptr = Array(rails).fill(0)
  let out = ''
  for (let i = 0; i < n; i++) {
    const rail = idx[i]!
    out += buckets[rail][ptr[rail]!]!
    ptr[rail]!++
  }
  return out
}

export const railFenceCipher: CipherDefinition<RailFenceConfig> = {
  id: 'railFence',
  label: 'Rail fence',
  description:
    'Zigzag transposition: text is written down rails and read row by row.',
  defaultConfig: { rails: 3 },
  validateConfig: (config) => {
    const r = Number(config.rails)
    if (!Number.isInteger(r)) return 'Rails must be an integer.'
    if (r < 2) return 'Use at least 2 rails.'
    if (r > 64) return 'Rails must be at most 64.'
    return null
  },
  encrypt: (input, config) => encryptText(input, Number(config.rails)),
  decrypt: (input, config) => decryptText(input, Number(config.rails)),
}
