import { getCipherDefinition } from './registry'
import type { PipelineNode, PipelineRunResult, PipelineStep } from './types'

export const MIN_PIPELINE_NODES = 3
const MIN_NODES = MIN_PIPELINE_NODES

export class PipelineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PipelineError'
  }
}

function assertMinNodes(nodes: PipelineNode[]): void {
  if (nodes.length < MIN_NODES) {
    throw new PipelineError(
      `Cascade requires at least ${MIN_NODES} nodes (got ${nodes.length}).`,
    )
  }
}

function resolveCipher(cipherId: string) {
  const def = getCipherDefinition(cipherId)
  if (!def) {
    throw new PipelineError(`Unknown cipher: "${cipherId}".`)
  }
  return def
}

/** Forward: plaintext → node1 → node2 → … → ciphertext */
export function runEncryptPipeline(
  nodes: PipelineNode[],
  plaintext: string,
): PipelineRunResult {
  assertMinNodes(nodes)
  const steps: PipelineStep[] = []
  let current = plaintext

  for (const node of nodes) {
    const def = resolveCipher(node.cipherId)
    const err = def.validateConfig(node.config)
    if (err) throw new PipelineError(`${def.label}: ${err}`)
    let next: string
    try {
      next = def.encrypt(current, node.config)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new PipelineError(`${def.label} (encrypt): ${msg}`)
    }
    steps.push({
      instanceId: node.instanceId,
      cipherId: node.cipherId,
      label: def.label,
      input: current,
      output: next,
    })
    current = next
  }

  return { output: current, steps }
}

/** Backward: ciphertext → inverse(last) → … → inverse(first) → plaintext */
export function runDecryptPipeline(
  nodes: PipelineNode[],
  ciphertext: string,
): PipelineRunResult {
  assertMinNodes(nodes)
  const steps: PipelineStep[] = []
  let current = ciphertext

  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]!
    const def = resolveCipher(node.cipherId)
    const err = def.validateConfig(node.config)
    if (err) throw new PipelineError(`${def.label}: ${err}`)
    let next: string
    try {
      next = def.decrypt(current, node.config)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new PipelineError(`${def.label} (decrypt): ${msg}`)
    }
    steps.push({
      instanceId: node.instanceId,
      cipherId: node.cipherId,
      label: def.label,
      input: current,
      output: next,
    })
    current = next
  }

  return { output: current, steps }
}

/** Encrypt then decrypt — must match original for a correct stack. */
export function assertRoundTrip(
  nodes: PipelineNode[],
  plaintext: string,
): { ok: boolean; recovered: string } {
  const enc = runEncryptPipeline(nodes, plaintext)
  const dec = runDecryptPipeline(nodes, enc.output)
  return { ok: dec.output === plaintext, recovered: dec.output }
}
