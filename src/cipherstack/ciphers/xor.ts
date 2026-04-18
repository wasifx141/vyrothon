import type { CipherDefinition } from '../types'

export type XorConfig = { key: string }

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function xorRepeat(data: Uint8Array, key: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i]! ^ key[i % key.length]!
  }
  return out
}

function bytesToHex(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i]!.toString(16).padStart(2, '0')
  }
  return s
}

function hexToBytes(hex: string): Uint8Array {
  const t = hex.trim().toLowerCase()
  if (t.length % 2 !== 0) return new Uint8Array()
  const out = new Uint8Array(t.length / 2)
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(t.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(byte)) return new Uint8Array()
    out[i] = byte
  }
  return out
}

function isHexString(s: string): boolean {
  const t = s.trim().toLowerCase()
  return t.length > 0 && t.length % 2 === 0 && /^[0-9a-f]+$/.test(t)
}

export const xorCipher: CipherDefinition<XorConfig> = {
  id: 'xor',
  label: 'XOR',
  description:
    'UTF-8 bytes XORed with a repeating key; ciphertext is a lowercase hex string for safe chaining.',
  defaultConfig: { key: 'key' },
  validateConfig: (config) => {
    if (typeof config.key !== 'string' || config.key.length === 0) {
      return 'Key must be a non-empty string.'
    }
    return null
  },
  encrypt: (input, config) => {
    if (input.length === 0) return ''
    const data = encoder.encode(input)
    const key = encoder.encode(config.key)
    return bytesToHex(xorRepeat(data, key))
  },
  decrypt: (input, config) => {
    if (input.trim().length === 0) return ''
    if (!isHexString(input)) {
      throw new Error('XOR decrypt expects lowercase hex from encrypt.')
    }
    const data = hexToBytes(input)
    if (data.length === 0) {
      throw new Error('Invalid hex input for XOR decrypt.')
    }
    const key = encoder.encode(config.key)
    return decoder.decode(xorRepeat(data, key))
  },
}
