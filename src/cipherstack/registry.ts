import { allCipherDefinitions } from './ciphers'
import type { CipherDefinition } from './types'

const byId = new Map<string, CipherDefinition>()
for (const def of allCipherDefinitions) {
  byId.set(def.id, def)
}

/** Stable lookup table — not recreated on render. */
export const cipherRegistry: Record<string, CipherDefinition> = Object.fromEntries(
  allCipherDefinitions.map((d) => [d.id, d]),
)

export function getCipherDefinition(cipherId: string): CipherDefinition | undefined {
  return byId.get(cipherId)
}

export function listCipherDefinitions(): CipherDefinition[] {
  return [...allCipherDefinitions]
}
