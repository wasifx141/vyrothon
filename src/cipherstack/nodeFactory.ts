import { getCipherDefinition } from './registry'
import { pipelinePresets } from './presets'
import type { PipelineNode } from './types'

export function newNodeId(): string {
  return crypto.randomUUID()
}

export function nodeFromCipherId(cipherId: string): PipelineNode {
  const def = getCipherDefinition(cipherId)
  if (!def) throw new Error(`Unknown cipher: ${cipherId}`)
  return {
    id: newNodeId(),
    cipherId,
    config: { ...def.defaultConfig },
  }
}

export function starterPipeline(): PipelineNode[] {
  const starter = pipelinePresets.find((p) => p.id === 'starter')
  return starter ? starter.build() : [
      nodeFromCipherId('caesar'),
      nodeFromCipherId('vigenere'),
      nodeFromCipherId('xor'),
    ]
}

/** Loads a curated stack by preset id (see `pipelinePresets`). */
export function buildPreset(presetId: string): PipelineNode[] {
  const p = pipelinePresets.find((x) => x.id === presetId)
  return p ? p.build() : starterPipeline()
}

/** @deprecated Use `buildPreset` */
export const presetPipeline = buildPreset
