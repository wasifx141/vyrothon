import { describe, expect, it } from 'vitest'
import { assertRoundTrip, runDecryptPipeline, runEncryptPipeline } from './pipeline'
import { pipelinePresets } from './presets'

const samples = [
  'Hello, World! 123',
  'αβγ 🔐 mixed',
  'aaaaaaaa',
  'The quick brown fox jumps over the lazy dog.',
  '',
]

describe('pipeline', () => {
  it('encrypt → decrypt round-trip for every preset and sample', () => {
    for (const preset of pipelinePresets) {
      const nodes = preset.build()
      for (const plaintext of samples) {
        const { ok, recovered } = assertRoundTrip(nodes, plaintext)
        expect(ok, `${preset.id} / ${JSON.stringify(plaintext)}`).toBe(true)
        expect(recovered).toBe(plaintext)
      }
    }
  })

  it('forward + inverse steps are consistent', () => {
    const nodes = pipelinePresets.find((p) => p.id === 'railMix')!.build()
    const plaintext = 'secret'
    const enc = runEncryptPipeline(nodes, plaintext)
    const dec = runDecryptPipeline(nodes, enc.finalOutput)
    expect(dec.finalOutput).toBe(plaintext)
    expect(enc.steps).toHaveLength(nodes.length)
    expect(dec.steps).toHaveLength(nodes.length)
  })
})
