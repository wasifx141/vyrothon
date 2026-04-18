import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getCipherUI } from '@/cipher-ui'
import type { CipherDirection, PipelineStep } from '@/cipherstack/types'

interface Props {
  steps: PipelineStep[]
  direction: CipherDirection
}

const truncate = (s: string, n = 40) =>
  s.length > n ? s.slice(0, n) + '…' : s

export function IntermediateSteps({ steps, direction }: Props) {
  if (steps.length === 0) return null
  const forward = direction === 'encrypt'
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-lg border border-border bg-card p-5"
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-eyebrow">Intermediate Steps</div>
          <h2 className="font-display mt-1 text-base font-semibold text-foreground">
            Pipeline Trace
          </h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 font-mono-c text-xs text-muted-foreground">
          {forward ? (
            <>
              <span>encrypt</span>
              <ArrowRight size={12} />
            </>
          ) : (
            <>
              <ArrowLeft size={12} />
              <span>decrypt</span>
            </>
          )}
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-eyebrow border-b border-border">
              <th className="w-10 py-2 pr-3 text-left font-semibold">#</th>
              <th className="w-32 py-2 pr-3 text-left font-semibold">Node</th>
              <th className="py-2 pr-3 text-left font-semibold">Input</th>
              <th className="py-2 text-left font-semibold">Output</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, i) => {
              const def = getCipherUI(step.cipherId)
              const accent = def ? `hsl(${def.colorHsl})` : 'hsl(var(--foreground))'
              return (
                <motion.tr
                  key={step.nodeId + String(i)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border last:border-0 hover:bg-secondary/50"
                >
                  <td className="py-2.5 pr-3 font-mono-c text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="py-2.5 pr-3">
                    {def ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: `hsl(${def.colorHsl} / 0.12)`,
                          color: accent,
                          border: `1px solid hsl(${def.colorHsl} / 0.3)`,
                        }}
                      >
                        {step.nodeName}
                      </span>
                    ) : (
                      step.nodeName
                    )}
                  </td>
                  <td
                    className="break-all py-2.5 pr-3 font-mono-c text-foreground/80"
                    title={step.input}
                  >
                    {truncate(step.input)}
                  </td>
                  <td
                    className="break-all py-2.5 font-mono-c font-medium"
                    title={step.output}
                    style={{ color: accent }}
                  >
                    {truncate(step.output)}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.section>
  )
}
