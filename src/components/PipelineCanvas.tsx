import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { getCipherUI } from '@/cipher-ui'
import type { CipherConfig } from '@/cipherstack/types'
import type { PipelineNode, PipelineStep } from '@/cipherstack/types'
import { ConnectorLine } from './ConnectorLine'
import { SortableNodeRow } from './NodeCard'

interface Props {
  nodes: PipelineNode[]
  setNodes: Dispatch<SetStateAction<PipelineNode[]>>
  activeNodeId: string | null
  steps: PipelineStep[]
  direction: 'encrypt' | 'decrypt'
  isRunning: boolean
}

export function PipelineCanvas({
  nodes,
  setNodes,
  activeNodeId,
  steps,
  direction,
  isRunning,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e
      if (!over || active.id === over.id) return
      setNodes((prev) => {
        const oldIdx = prev.findIndex((n) => n.id === active.id)
        const newIdx = prev.findIndex((n) => n.id === over.id)
        if (oldIdx < 0 || newIdx < 0) return prev
        return arrayMove(prev, oldIdx, newIdx)
      })
    },
    [setNodes],
  )

  const handleConfigChange = useCallback(
    (id: string, config: CipherConfig) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, config } : n)),
      )
    },
    [setNodes],
  )

  const handleRemove = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== id))
    },
    [setNodes],
  )

  const handleMoveUp = useCallback(
    (id: string) => {
      setNodes((prev) => {
        const idx = prev.findIndex((n) => n.id === id)
        if (idx <= 0) return prev
        return arrayMove(prev, idx, idx - 1)
      })
    },
    [setNodes],
  )

  const handleMoveDown = useCallback(
    (id: string) => {
      setNodes((prev) => {
        const idx = prev.findIndex((n) => n.id === id)
        if (idx < 0 || idx >= prev.length - 1) return prev
        return arrayMove(prev, idx, idx + 1)
      })
    },
    [setNodes],
  )

  const ready = nodes.length >= 3
  const stepByNode = useMemo(
    () => new Map(steps.map((s) => [s.nodeId, s] as const)),
    [steps],
  )

  return (
    <div className="h-full flex-1 overflow-y-auto bg-background px-4 py-5 md:px-8 md:py-7">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-6">
        <div>
          <div className="text-eyebrow">Pipeline</div>
          <h1 className="font-display mt-1 text-2xl font-bold leading-none text-foreground">
            Cascade Stack
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Chain ciphers in sequence — input flows top to bottom.
          </p>
        </div>
        <div
          className={`rounded-md border px-3 py-1.5 font-mono-c text-xs ${
            ready
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'} ·{' '}
          {ready
            ? isRunning
              ? 'running…'
              : 'ready'
            : `need ${3 - nodes.length} more`}
        </div>
      </header>

      {nodes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-16 text-center">
          <div className="font-display text-lg text-foreground">
            Your pipeline is empty
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Add at least 3 ciphers from the{' '}
            <span className="md:hidden">Library tab</span>
            <span className="hidden md:inline">library on the left</span>
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={nodes.map((n) => n.id)}
            strategy={verticalListSortingStrategy}
          >
            <div>
              <AnimatePresence initial={false}>
                {nodes.map((node, i) => {
                  const def = getCipherUI(node.cipherId)
                  const isLast = i === nodes.length - 1
                  return (
                    <div key={node.id}>
                      <SortableNodeRow
                        node={node}
                        index={i}
                        total={nodes.length}
                        active={activeNodeId === node.id}
                        ioStep={stepByNode.get(node.id)}
                        direction={direction}
                        onConfigChange={handleConfigChange}
                        onRemove={handleRemove}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                      />
                      {!isLast && def ? (
                        <ConnectorLine
                          color={def.colorHsl}
                          active={isRunning}
                          direction={
                            direction === 'encrypt' ? 'forward' : 'backward'
                          }
                        />
                      ) : null}
                    </div>
                  )
                })}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
