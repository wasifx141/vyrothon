import { useEffect, useState } from 'react'
import { computeChainDna } from '@/cipherstack'
import type { PipelineNode } from '@/cipherstack'

/** SHA-256 fingerprint of the ordered stack (cipher ids + configs), async via Web Crypto. */
export function useChainDNA(nodes: PipelineNode[]): string {
  const [dna, setDna] = useState('')

  useEffect(() => {
    let alive = true
    void computeChainDna(nodes).then((d) => {
      if (alive) setDna(d)
    })
    return () => {
      alive = false
    }
  }, [nodes])

  return dna
}
