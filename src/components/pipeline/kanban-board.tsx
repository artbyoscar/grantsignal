'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useDroppable,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DragCancelEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { PipelineCard, type PipelineCardProps } from './pipeline-card'
import { SortableCard } from './sortable-card'

interface KanbanColumn {
  id: string
  title: string
  color: string
  cards: PipelineCardProps[]
}

export interface KanbanBoardProps {
  columns: KanbanColumn[]
  onCardMove: (cardId: string, fromColumn: string, toColumn: string, newIndex: number) => void
  onCardClick: (cardId: string) => void
  onAddCard: (columnId: string) => void
}

// Droppable column component
interface DroppableColumnProps {
  column: KanbanColumn
  isOver: boolean
  onCardClick: (cardId: string) => void
  onAddCard: (columnId: string) => void
}

function DroppableColumn({ column, isOver, onCardClick, onAddCard }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex-shrink-0 w-80 scroll-snap-align-start">
      {/* Column Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="text-sm font-semibold text-slate-200">{column.title}</h3>
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {column.cards.length}
          </span>
        </div>
        <button
          onClick={() => onAddCard(column.id)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          title="Add card"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* Column Content with Droppable Area */}
      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`
            min-h-[200px] rounded-lg border-2 border-dashed p-3 space-y-3
            ${
              isOver
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-slate-700 bg-slate-900/30'
            }
            transition-colors duration-200
          `}
        >
          {column.cards.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              Drop cards here
            </div>
          ) : (
            column.cards.map((card) => (
              <SortableCard
                key={card.id}
                {...card}
                onClick={() => onCardClick(card.id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanBoard({ columns, onCardMove, onCardClick, onAddCard }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  // Configure sensors for drag interactions - memoized for performance
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced from 8px for instant drag feedback
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Find the active card being dragged - memoized to avoid recalculation on every render
  const activeCard = useMemo(() => {
    if (!activeId) return null
    return columns.flatMap((col) => col.cards).find((card) => card.id === activeId) || null
  }, [activeId, columns])

  // Handle drag start - wrapped in useCallback to prevent recreating on every render
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  // Handle drag over (when dragging over different columns) - wrapped in useCallback
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    setOverId(over ? (over.id as string) : null)
  }, [])

  // Handle drag end - wrapped in useCallback
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setOverId(null)
      return
    }

    const activeCardId = active.id as string
    const overContainerId = over.id as string

    // Find source column and card
    let fromColumn: string | null = null
    let fromIndex = -1

    for (const column of columns) {
      const cardIndex = column.cards.findIndex((card) => card.id === activeCardId)
      if (cardIndex !== -1) {
        fromColumn = column.id
        fromIndex = cardIndex
        break
      }
    }

    if (!fromColumn) {
      setActiveId(null)
      setOverId(null)
      return
    }

    // Determine target column
    let toColumn: string | null = null
    let toIndex = 0

    // Check if dropped on a card
    const targetCard = columns.flatMap((col) => col.cards).find((card) => card.id === overContainerId)
    if (targetCard) {
      // Dropped on a card - find its column and position
      for (const column of columns) {
        const cardIndex = column.cards.findIndex((card) => card.id === overContainerId)
        if (cardIndex !== -1) {
          toColumn = column.id
          toIndex = cardIndex
          break
        }
      }
    } else {
      // Dropped on a column
      const targetColumn = columns.find((col) => col.id === overContainerId)
      if (targetColumn) {
        toColumn = targetColumn.id
        toIndex = targetColumn.cards.length // Add to end of column
      }
    }

    if (!toColumn) {
      setActiveId(null)
      setOverId(null)
      return
    }

    // Only call onCardMove if there's an actual change
    if (fromColumn !== toColumn || fromIndex !== toIndex) {
      onCardMove(activeCardId, fromColumn, toColumn, toIndex)
    }

    setActiveId(null)
    setOverId(null)
  }, [columns, onCardMove])

  // Handle drag cancel - wrapped in useCallback
  const handleDragCancel = useCallback((event: DragCancelEvent) => {
    setActiveId(null)
    setOverId(null)
  }, [])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Horizontal scrollable container */}
      <div className="flex gap-4 overflow-x-auto pb-4 px-2 scroll-snap-type-x scroll-snap-mandatory">
        {columns.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            isOver={overId === column.id}
            onCardClick={onCardClick}
            onAddCard={onAddCard}
          />
        ))}
      </div>

      {/* Drag Overlay - Shows card preview while dragging */}
      <DragOverlay>
        {activeCard ? (
          <div className="rotate-3 opacity-90">
            <PipelineCard {...activeCard} isDragging={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
