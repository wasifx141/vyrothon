import type { CipherDefinition } from '../types'

export type CaesarConfig = { shift: number }

function normalizeShift(shift: number): number {
  return ((shift % 26) + 26) % 26
}

function transform(text: string, shift: number, encrypt: boolean): string {
  const delta = encrypt ? normalizeShift(shift) : normalizeShift(-shift)
  return [...text]
    .map((ch) => {
      if (ch >= 'A' && ch <= 'Z') {
        const v = (ch.charCodeAt(0) - 0x41 + delta) % 26
        return String.fromCharCode(v + 0x41)
      }
      if (ch >= 'a' && ch <= 'z') {
        const v = (ch.charCodeAt(0) - 0x61 + delta) % 26
        return String.fromCharCode(v + 0x61)
      }
      return ch
    })
    .join('')
}

export const caesarCipher: CipherDefinition<CaesarConfig> = {
  id: 'caesar',
  label: 'Caesar',
  description: 'Shifts each letter by a fixed amount in the Latin alphabet.',
  defaultConfig: { shift: 3 },
  validateConfig: (config) => {
    if (!Number.isFinite(Number(config.shift))) return 'Shift must be a number.'
    return null
  },
  encrypt: (input, config) =>
    transform(input, Number(config.shift), true),
  decrypt: (input, config) =>
    transform(input, Number(config.shift), false),
}
