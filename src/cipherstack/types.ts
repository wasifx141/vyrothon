/** Config bag for a cipher instance — all values are JSON-serializable scalars. */
export type CipherConfig = Record<string, string | number>

export type CipherDirection = 'encrypt' | 'decrypt'

/** One node instance in an ordered cascade (stable id + cipher + config). */
export type NodeInstance = {
  id: string
  cipherId: string
  config: CipherConfig
}

/** @deprecated Use NodeInstance — alias for existing imports */
export type PipelineNode = NodeInstance

export type PipelineStep = {
  nodeId: string
  nodeName: string
  cipherId: string
  input: string
  output: string
}

export type PipelineResult = {
  finalOutput: string
  steps: PipelineStep[]
}

/** @deprecated Use PipelineResult */
export type PipelineRunResult = PipelineResult

/**
 * Registered cipher: defaults + validate + encrypt/decrypt.
 * UI color/icon live in `cipher-ui.ts` (presentation layer).
 */
export type CipherDefinition<T extends CipherConfig = CipherConfig> = {
  id: string
  label: string
  description: string
  defaultConfig: T
  validateConfig: (config: CipherConfig) => string | null
  encrypt: (input: string, config: CipherConfig) => string
  decrypt: (input: string, config: CipherConfig) => string
}
