import {
  KeyRound,
  RotateCcw,
  Shuffle,
  Train,
  type LucideIcon,
} from 'lucide-react'
import {
  getCipherDefinition,
  listCipherDefinitions,
} from './cipherstack/registry'
import type { CipherDefinition } from './cipherstack/types'

export type CipherConfigField = {
  key: string
  label: string
  type: 'number' | 'text'
  min?: number
  max?: number
  placeholder?: string
}

type Meta = {
  colorHsl: string
  icon: LucideIcon
  configFields: CipherConfigField[]
}

const META: Record<string, Meta> = {
  caesar: {
    colorHsl: 'var(--cipher-caesar)',
    icon: RotateCcw,
    configFields: [
      { key: 'shift', label: 'Shift', type: 'number', min: -25, max: 25 },
    ],
  },
  xor: {
    colorHsl: 'var(--cipher-xor)',
    icon: KeyRound,
    configFields: [
      { key: 'key', label: 'Key', type: 'text', placeholder: 'secret' },
    ],
  },
  vigenere: {
    colorHsl: 'var(--cipher-vigenere)',
    icon: Shuffle,
    configFields: [
      { key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'LEMON' },
    ],
  },
  railFence: {
    colorHsl: 'var(--cipher-railfence)',
    icon: Train,
    configFields: [
      { key: 'rails', label: 'Rails', type: 'number', min: 2, max: 64 },
    ],
  },
}

export type CipherListItem = CipherDefinition & Meta & { icon: LucideIcon }

/** Sidebar list: only ciphers registered in cipherstack + UI meta (no extras). */
export function listCipherListItems(): CipherListItem[] {
  const out: CipherListItem[] = []
  for (const def of listCipherDefinitions()) {
    const m = META[def.id]
    if (m) out.push({ ...def, ...m })
  }
  return out
}

export function getCipherUI(cipherId: string): CipherListItem | null {
  const def = getCipherDefinition(cipherId)
  if (!def) return null
  const m = META[cipherId]
  if (!m) return null
  return { ...def, ...m }
}
