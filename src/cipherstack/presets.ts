import type { PipelineNode } from './types'

function nid(): string {
  return crypto.randomUUID()
}

export type PipelinePreset = {
  id: string
  label: string
  hint: string
  build: () => PipelineNode[]
}

/** Curated stacks for demos — each satisfies min node count + valid configs. */
export const pipelinePresets: PipelinePreset[] = [
  {
    id: 'starter',
    label: 'Starter',
    hint: 'Caesar → Vigenère → XOR',
    build: () => [
      { instanceId: nid(), cipherId: 'caesar', config: { shift: 3 } },
      { instanceId: nid(), cipherId: 'vigenere', config: { keyword: 'hack' } },
      { instanceId: nid(), cipherId: 'xor', config: { key: 'ab' } },
    ],
  },
  {
    id: 'quad',
    label: '4-node',
    hint: 'Double Caesar bookends',
    build: () => [
      { instanceId: nid(), cipherId: 'caesar', config: { shift: 7 } },
      { instanceId: nid(), cipherId: 'vigenere', config: { keyword: 'stack' } },
      { instanceId: nid(), cipherId: 'xor', config: { key: 'xy' } },
      { instanceId: nid(), cipherId: 'caesar', config: { shift: 11 } },
    ],
  },
  {
    id: 'xorFirst',
    label: 'XOR lead',
    hint: 'XOR → Caesar → Vigenère',
    build: () => [
      { instanceId: nid(), cipherId: 'xor', config: { key: 'k1' } },
      { instanceId: nid(), cipherId: 'caesar', config: { shift: 4 } },
      { instanceId: nid(), cipherId: 'vigenere', config: { keyword: 'demo' } },
    ],
  },
  {
    id: 'railMix',
    label: 'Rail mix',
    hint: 'Caesar → Rail fence → XOR',
    build: () => [
      { instanceId: nid(), cipherId: 'caesar', config: { shift: 5 } },
      { instanceId: nid(), cipherId: 'railFence', config: { rails: 4 } },
      { instanceId: nid(), cipherId: 'xor', config: { key: 'z9' } },
    ],
  },
]
