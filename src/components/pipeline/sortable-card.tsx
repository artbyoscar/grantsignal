'use client'

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PipelineCard {...props} isDragging={isDragging} />
    </div>
  )
}
