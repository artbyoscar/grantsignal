'use client'

import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PipelineCard, type PipelineCardProps } from './pipeline-card'

export interface SortableCardProps extends PipelineCardProps {
  id: string
}

export function SortableCard(props: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id })

  // Memoize style calculation to prevent unnecessary recalculations
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition]
  )

  // Note: The drag listeners on this wrapper enable drag-and-drop.
  // The 3px activation constraint in KanbanBoard ensures instant drag
  // feedback while still allowing onClick events to work on the PipelineCard.
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PipelineCard {...props} isDragging={isDragging} />
    </div>
  )
}
