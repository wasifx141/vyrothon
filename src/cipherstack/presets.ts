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
    build: () =>
      [
        { id: nid(), cipherId: 'caesar', config: { shift: 3 } },
        { id: nid(), cipherId: 'vigenere', config: { keyword: 'hack' } },
        { id: nid(), cipherId: 'xor', config: { key: 'ab' } },
      ] as PipelineNode[],
  },
  {
    id: 'quad',
    label: '4-node',
    hint: 'Double Caesar bookends',
    build: () =>
      [
        { id: nid(), cipherId: 'caesar', config: { shift: 7 } },
        { id: nid(), cipherId: 'vigenere', config: { keyword: 'stack' } },
        { id: nid(), cipherId: 'xor', config: { key: 'xy' } },
        { id: nid(), cipherId: 'caesar', config: { shift: 11 } },
      ] as PipelineNode[],
  },
  {
    id: 'xorFirst',
    label: 'XOR lead',
    hint: 'XOR → Caesar → Vigenère',
    build: () =>
      [
        { id: nid(), cipherId: 'xor', config: { key: 'k1' } },
        { id: nid(), cipherId: 'caesar', config: { shift: 4 } },
        { id: nid(), cipherId: 'vigenere', config: { keyword: 'demo' } },
      ] as PipelineNode[],
  },
  {
    id: 'railMix',
    label: 'Rail mix',
    hint: 'Caesar → Rail fence → XOR',
    build: () =>
      [
        { id: nid(), cipherId: 'caesar', config: { shift: 5 } },
        { id: nid(), cipherId: 'railFence', config: { rails: 4 } },
        { id: nid(), cipherId: 'xor', config: { key: 'z9' } },
      ] as PipelineNode[],
  },
]
