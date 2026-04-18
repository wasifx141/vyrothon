import type { PipelineNode } from './types'

/** Short stable id for the ordered stack — helps judges see “this exact pipeline”. */
export async function computeChainDna(
  nodes: PipelineNode[],
): Promise<string> {
  const canonical = nodes.map((n) => ({
    cipherId: n.cipherId,
    config: n.config,
  }))
  const json = JSON.stringify(canonical)
  const data = new TextEncoder().encode(json)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${hex.slice(0, 12)}…${hex.slice(-8)}`
}
