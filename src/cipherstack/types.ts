/** One node instance in an ordered cascade (identity + which cipher + its config). */
export type PipelineNode = {
  instanceId: string
  cipherId: string
  config: unknown
}

export type PipelineStep = {
  instanceId: string
  cipherId: string
  label: string
  input: string
  output: string
}

export type PipelineRunResult = {
  output: string
  steps: PipelineStep[]
}

export type CipherDirection = 'encrypt' | 'decrypt'

export type CipherDefinition<TConfig> = {
  id: string
  label: string
  description: string
  defaultConfig: TConfig
  validateConfig: (config: TConfig) => string | null
  encrypt: (input: string, config: TConfig) => string
  decrypt: (input: string, config: TConfig) => string
}
