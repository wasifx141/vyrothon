import { useCallback } from 'react'
import { toast } from 'sonner'
import {
  exportPipelineSnapshot,
  getCipherDefinition,
  importPipelineSnapshot,
  MIN_PIPELINE_NODES,
  PipelineSnapshotError,
} from '@/cipherstack'
import type { CipherConfig, PipelineNode } from '@/cipherstack'

function normalizeImportCipherId(id: string): string {
  if (id === 'railfence') return 'railFence'
  return id
}

function newNodeId(): string {
  return crypto.randomUUID()
}

export function usePipelineStorage() {
  const exportPipeline = useCallback((nodes: PipelineNode[], dnaForFilename: string) => {
    const json = exportPipelineSnapshot(nodes)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cipherstack-${dnaForFilename.slice(0, 8) || 'stack'}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Stack exported')
  }, [])

  const importPipeline = useCallback(async (file: File): Promise<PipelineNode[] | null> => {
    try {
      const text = await file.text()
      if (text.includes('cipherStack')) {
        const next = importPipelineSnapshot(text.trim())
        toast.success(`Imported ${next.length} nodes`)
        return next
      }
      const data = JSON.parse(text) as { nodes?: unknown[] }
      if (!Array.isArray(data?.nodes)) throw new Error('Invalid stack file')
      const restored: PipelineNode[] = []
      for (const raw of data.nodes) {
        if (!raw || typeof raw !== 'object') continue
        const r = raw as { cipherId?: string; config?: unknown }
        if (typeof r.cipherId !== 'string') continue
        const cipherId = normalizeImportCipherId(r.cipherId)
        const def = getCipherDefinition(cipherId)
        if (!def) continue
        const base = structuredClone(def.defaultConfig) as Record<string, unknown>
        if (
          r.config &&
          typeof r.config === 'object' &&
          !Array.isArray(r.config)
        ) {
          Object.assign(base, r.config as object)
        }
        restored.push({
          id: newNodeId(),
          cipherId,
          config: base as CipherConfig,
        })
      }
      if (restored.length === 0) throw new Error('No valid nodes in file')
      if (restored.length < MIN_PIPELINE_NODES) {
        throw new Error(
          `Need at least ${MIN_PIPELINE_NODES} nodes (got ${restored.length}).`,
        )
      }
      toast.success(`Imported ${restored.length} nodes`)
      return restored
    } catch (e) {
      const msg =
        e instanceof PipelineSnapshotError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e)
      toast.error(msg)
      return null
    }
  }, [])

  return { exportPipeline, importPipeline }
}
