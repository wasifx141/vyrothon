import { useCallback, useMemo, useState } from 'react'
import {
  MIN_PIPELINE_NODES,
  PipelineError,
  runPipeline,
  validatePipelineNodes,
  type CipherDirection,
  type PipelineNode,
  type PipelineResult,
} from '@/cipherstack'
import { useDebouncedValue } from './useDebouncedValue'

function extractError(e: unknown): string {
  if (e instanceof PipelineError) return e.message
  if (e instanceof Error) return e.message
  return String(e)
}

export function usePipeline(
  nodes: PipelineNode[],
  rawInput: string,
  direction: CipherDirection,
  options: { livePreview: boolean; debounceMs: number },
) {
  const debouncedInput = useDebouncedValue(
    rawInput,
    options.livePreview ? options.debounceMs : 0,
  )

  const configErrors = useMemo(() => validatePipelineNodes(nodes), [nodes])
  const isValid =
    nodes.length >= MIN_PIPELINE_NODES && Object.keys(configErrors).length === 0

  const { result, pipelineError } = useMemo(() => {
    if (nodes.length < MIN_PIPELINE_NODES) {
      return {
        result: null as PipelineResult | null,
        pipelineError: null as string | null,
      }
    }
    if (Object.keys(configErrors).length > 0) {
      return { result: null, pipelineError: null }
    }
    try {
      return {
        result: runPipeline(nodes, debouncedInput, direction),
        pipelineError: null,
      }
    } catch (e) {
      return { result: null, pipelineError: extractError(e) }
    }
  }, [nodes, debouncedInput, direction, configErrors])

  const [isRunning, setIsRunning] = useState(false)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)

  const run = useCallback(async () => {
    if (!isValid) return
    setIsRunning(true)
    const order = direction === 'encrypt' ? nodes : [...nodes].reverse()
    for (let i = 0; i < order.length; i++) {
      setActiveNodeId(order[i]!.id)
      await new Promise((r) => setTimeout(r, 150))
    }
    setActiveNodeId(null)
    await new Promise((r) => setTimeout(r, 80))
    setHasRun(true)
    setIsRunning(false)
  }, [direction, isValid, nodes])

  return {
    result,
    steps: result?.steps ?? [],
    finalOutput: result?.finalOutput ?? '',
    pipelineError,
    isValid,
    configErrors,
    run,
    isRunning,
    activeNodeId,
    hasRun,
    setHasRun,
  }
}
