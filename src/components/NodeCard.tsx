import { memo, useState, type CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  GripVertical,
  X,
} from 'lucide-react'
import { getCipherUI } from '@/cipher-ui'
import type { CipherConfig } from '@/cipherstack/types'
import type { PipelineNode } from '@/cipherstack/types'

interface NodeCardProps {
  node: PipelineNode
  index: number
  total: number
  onConfigChange: (id: string, config: CipherConfig) => void
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

const truncate = (s: string, n = 80) =>
  s.length > n ? s.slice(0, n) + '…' : s

const NodeCard = memo(function NodeCard({
  node,
  index,
  total,
  onConfigChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: NodeCardProps) {
  const def = getCipherUI(node.cipherId)

  if (!def) return null

  const Icon = def.icon
  const accent = `hsl(${def.colorHsl})`
  const cfg = node.config

  return (
    <>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 select-none text-muted-foreground/50 pointer-events-none">
          <GripVertical size={16} />
        </div>

        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md font-mono-c text-sm font-bold text-white"
          style={{ background: accent }}
        >
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon size={14} style={{ color: accent }} />
            <h3 className="text-[15px] font-semibold leading-none text-foreground">
              {def.label}
            </h3>
          </div>
          <div className="mt-1.5 font-mono-c text-[10px] text-muted-foreground">
            {def.description}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onMoveUp(node.id)}
            disabled={index === 0}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Move up"
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(node.id)}
            disabled={index === total - 1}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Move down"
          >
            <ArrowDown size={13} />
          </button>
          <button
            type="button"
            onClick={() => onRemove(node.id)}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {def.configFields.length > 0 ? (
        <div className="mt-3 grid gap-2 pl-11">
          {def.configFields.map((field) => (
            <div key={field.key} className="flex items-center gap-3">
              <label className="w-14 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {field.label}
              </label>
              <input
                type={field.type}
                min={field.min}
                max={field.max}
                placeholder={field.placeholder}
                value={String(cfg[field.key] ?? '')}
                onChange={(e) => {
                  const raw = e.target.value
                  const value = field.type === 'number' ? Number(raw) : raw
                  onConfigChange(node.id, { ...cfg, [field.key]: value })
                }}
                className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 font-mono-c text-xs text-foreground transition focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          ))}
        </div>
      ) : null}
    </>
  )
})

interface TraceIoProps {
  node: PipelineNode
  ioStep?: { input: string; output: string }
  direction: 'encrypt' | 'decrypt'
}

export function NodeCardTraceIo({ node, ioStep, direction }: TraceIoProps) {
  const def = getCipherUI(node.cipherId)
  const [showIO, setShowIO] = useState(true)

  if (!ioStep || !def) return null

  const accent = `hsl(${def.colorHsl})`

  return (
    <div className="mt-3 pl-11">
      <button
        type="button"
        onClick={() => setShowIO((v) => !v)}
        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
      >
        <ChevronsUpDown size={11} />
        I/O
        <span className="font-normal normal-case tracking-normal text-muted-foreground/70">
          · {direction === 'encrypt' ? 'encrypt' : 'decrypt'}
        </span>
      </button>
      <AnimatePresence>
        {showIO ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 grid gap-1.5 font-mono-c text-[11.5px]">
              <div
                title={ioStep.input}
                className="rounded-md border border-border bg-secondary px-2.5 py-1.5"
              >
                <span className="mr-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  IN
                </span>
                <span className="break-all text-foreground">
                  {truncate(ioStep.input)}
                </span>
              </div>
              <div
                title={ioStep.output}
                className="rounded-md border px-2.5 py-1.5"
                style={{ borderColor: `hsl(${def.colorHsl} / 0.4)` }}
              >
                <span className="mr-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  OUT
                </span>
                <span
                  style={{ color: accent }}
                  className="break-all font-medium"
                >
                  {truncate(ioStep.output)}
                </span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

interface SortableRowProps {
  node: PipelineNode
  index: number
  total: number
  active: boolean
  ioStep?: { input: string; output: string }
  direction: 'encrypt' | 'decrypt'
  onConfigChange: (id: string, config: CipherConfig) => void
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export function SortableNodeRow({
  node,
  index,
  total,
  active,
  ioStep,
  direction,
  onConfigChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id })

  const def = getCipherUI(node.cipherId)
  const accent = def ? `hsl(${def.colorHsl})` : 'hsl(var(--foreground))'

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    borderLeftColor: accent,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(listeners as Record<string, unknown>)}
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={
        isDragging
          ? { opacity: 1, scale: 1.03, boxShadow: '0 24px 48px rgba(0,0,0,0.22)' }
          : { opacity: 1, y: 0, scale: 1, boxShadow: '0 0px 0px rgba(0,0,0,0)' }
      }
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={
        isDragging
          ? { type: 'spring', stiffness: 500, damping: 30 }
          : { type: 'spring', stiffness: 320, damping: 28 }
      }
      className={`relative rounded-lg border border-border border-l-[3px] bg-card p-4 transition-colors hover:border-foreground/20 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${active ? 'node-active ring-1 ring-ring/40' : ''}`}
    >
      <NodeCard
        node={node}
        index={index}
        total={total}
        onConfigChange={onConfigChange}
        onRemove={onRemove}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
      <NodeCardTraceIo node={node} ioStep={ioStep} direction={direction} />
    </motion.div>
  )
}

export default NodeCard
