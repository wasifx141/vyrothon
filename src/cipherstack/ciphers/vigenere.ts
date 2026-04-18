import type { CipherDefinition } from '../types'

export type VigenereConfig = { keyword: string }

function normalizeKey(keyword: string): string {
  return keyword.toUpperCase().replace(/[^A-Z]/g, '')
}

function vigenereTransform(
  text: string,
  keyword: string,
  encrypt: boolean,
): string {
  const key = normalizeKey(keyword)
  if (!key.length) return text

  let ki = 0
  let out = ''
  for (const ch of text) {
    if (ch >= 'A' && ch <= 'Z') {
      const shift = key.charCodeAt(ki % key.length)! - 0x41
      const base = ch.charCodeAt(0) - 0x41
      const next = encrypt
        ? (base + shift + 26) % 26
        : (base - shift + 26) % 26
      out += String.fromCharCode(next + 0x41)
      ki++
    } else if (ch >= 'a' && ch <= 'z') {
      const shift = key.charCodeAt(ki % key.length)! - 0x41
      const base = ch.charCodeAt(0) - 0x61
      const next = encrypt
        ? (base + shift + 26) % 26
        : (base - shift + 26) % 26
      out += String.fromCharCode(next + 0x61)
      ki++
    } else {
      out += ch
    }
  }
  return out
}

export const vigenereCipher: CipherDefinition<VigenereConfig> = {
  id: 'vigenere',
  label: 'Vigenère',
  description:
    'Polyalphabetic substitution; only A–Z / a–z are shifted (keyword letters drive the shift).',
  defaultConfig: { keyword: 'cipher' },
  validateConfig: (config) => {
    if (typeof config.keyword !== 'string' || !config.keyword.trim()) {
      return 'Keyword must be a non-empty string.'
    }
    if (!/[A-Za-z]/.test(config.keyword)) {
      return 'Keyword must contain at least one letter.'
    }
    return null
  },
  encrypt: (input, config) =>
    vigenereTransform(input, String(config.keyword), true),
  decrypt: (input, config) =>
    vigenereTransform(input, String(config.keyword), false),
}
