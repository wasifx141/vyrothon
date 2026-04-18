import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

type Props = {
  id: string
  children: ReactNode
}

function DragIcon() {
  const dots = [3, 9, 15]
  return (
    <svg
      className="wb-drag-icon"
      width="12"
      height="18"
      viewBox="0 0 12 18"
      aria-hidden
    >
      {dots.flatMap((cy) =>
        [3, 9].map((cx) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" fill="currentColor" />
        )),
      )}
    </svg>
  )
}

/**
 * One sortable pipeline node: drag handle activates reorder;
 * rest of the card stays for editing.
 */
export function SortableNodeCard({ id, children }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`wb-node${isDragging ? ' wb-node--dragging' : ''}`}
    >
      <button
        type="button"
        className="wb-drag-handle"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder pipeline"
        title="Drag to reorder"
      >
        <DragIcon />
      </button>
      <div className="wb-node-content">{children}</div>
    </li>
  )
}
