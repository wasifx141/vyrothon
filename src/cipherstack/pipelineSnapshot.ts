import { getCipherDefinition } from './registry'
import { MIN_PIPELINE_NODES } from './pipeline'
import type { PipelineNode } from './types'

export const PIPELINE_SNAPSHOT_VERSION = 1 as const

export type PipelineSnapshot = {
  version: typeof PIPELINE_SNAPSHOT_VERSION
  cipherStack: {
    nodes: Array<Pick<PipelineNode, 'cipherId' | 'config'>>
  }
}

function newInstanceId(): string {
  return crypto.randomUUID()
}

/** Pretty-printed JSON — instance ids omitted; new ids on import. */
export function exportPipelineSnapshot(nodes: PipelineNode[]): string {
  const payload: PipelineSnapshot = {
    version: PIPELINE_SNAPSHOT_VERSION,
    cipherStack: {
      nodes: nodes.map(({ cipherId, config }) => ({
        cipherId,
        config: structuredClone(config),
      })),
    },
  }
  return JSON.stringify(payload, null, 2)
}

export class PipelineSnapshotError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PipelineSnapshotError'
  }
}

/** Validates ciphers and configs; assigns fresh instance ids. */
export function importPipelineSnapshot(json: string): PipelineNode[] {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new PipelineSnapshotError('Invalid JSON.')
  }

  if (!raw || typeof raw !== 'object') {
    throw new PipelineSnapshotError('Snapshot must be an object.')
  }

  const o = raw as Record<string, unknown>
  if (o.version !== PIPELINE_SNAPSHOT_VERSION) {
    throw new PipelineSnapshotError(
      `Unsupported version (expected ${PIPELINE_SNAPSHOT_VERSION}).`,
    )
  }

  const stack = o.cipherStack
  if (!stack || typeof stack !== 'object') {
    throw new PipelineSnapshotError('Missing cipherStack.')
  }

  const nodesRaw = (stack as Record<string, unknown>).nodes
  if (!Array.isArray(nodesRaw)) {
    throw new PipelineSnapshotError('cipherStack.nodes must be an array.')
  }

  const nodes: PipelineNode[] = []

  for (let i = 0; i < nodesRaw.length; i++) {
    const item = nodesRaw[i]
    if (!item || typeof item !== 'object') {
      throw new PipelineSnapshotError(`Invalid node at index ${i}.`)
    }
    const row = item as Record<string, unknown>
    const cipherId = row.cipherId
    if (typeof cipherId !== 'string') {
      throw new PipelineSnapshotError(`Node ${i}: cipherId must be a string.`)
    }
    const def = getCipherDefinition(cipherId)
    if (!def) {
      throw new PipelineSnapshotError(`Unknown cipher: "${cipherId}".`)
    }
    const config = row.config
    const err = def.validateConfig(config)
    if (err) {
      throw new PipelineSnapshotError(`${def.label} (node ${i}): ${err}`)
    }
    nodes.push({
      instanceId: newInstanceId(),
      cipherId,
      config: structuredClone(config),
    })
  }

  if (nodes.length < MIN_PIPELINE_NODES) {
    throw new PipelineSnapshotError(
      `Need at least ${MIN_PIPELINE_NODES} nodes (got ${nodes.length}).`,
    )
  }

  return nodes
}
