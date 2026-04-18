import { allCipherDefinitions } from './ciphers'
import type { CipherDefinition } from './types'

const byId = new Map<string, CipherDefinition<unknown>>()
for (const def of allCipherDefinitions) {
  byId.set(def.id, def)
}

export function getCipherDefinition(
  cipherId: string,
): CipherDefinition<unknown> | undefined {
  return byId.get(cipherId)
}

export function listCipherDefinitions(): CipherDefinition<unknown>[] {
  return [...allCipherDefinitions]
}
