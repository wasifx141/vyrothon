import { getCipherDefinition } from './registry'
import type { PipelineNode } from './types'

/** Map of node id → validation error message (empty object = all valid). */
export function validatePipelineNodes(nodes: PipelineNode[]): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const n of nodes) {
    const def = getCipherDefinition(n.cipherId)
    if (!def) {
      errors[n.id] = `Unknown cipher: ${n.cipherId}`
      continue
    }
    const msg = def.validateConfig(n.config)
    if (msg) errors[n.id] = msg
  }
  return errors
}
