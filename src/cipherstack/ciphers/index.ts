export { caesarCipher, type CaesarConfig } from './caesar'
export { xorCipher, type XorConfig } from './xor'
export { vigenereCipher, type VigenereConfig } from './vigenere'
export { railFenceCipher, type RailFenceConfig } from './railFence'

import type { CipherDefinition } from '../types'
import { caesarCipher } from './caesar'
import { railFenceCipher } from './railFence'
import { xorCipher } from './xor'
import { vigenereCipher } from './vigenere'

/** All built-in configurable ciphers (≥3 required for the hackathon). */
export const allCipherDefinitions: CipherDefinition<unknown>[] = [
  caesarCipher as CipherDefinition<unknown>,
  xorCipher as CipherDefinition<unknown>,
  vigenereCipher as CipherDefinition<unknown>,
  railFenceCipher as CipherDefinition<unknown>,
]
