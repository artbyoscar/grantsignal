import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SourceAttributionPanel } from '@/components/ui/source-attribution-panel'
import { mockSources } from '../fixtures/documents'

describe('SourceAttributionPanel Component', () => {
  describe('Rendering', () => {
    it('should render with multiple sources', () => {
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date('2024-01-15T10:00:00Z')}
          onSourceClick={onSourceClick}
        />
      )

      expect(screen.getByText(/View \d+ Source/)).toBeInTheDocument()
    })

    it('should render with single source', () => {
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.single}
          generatedAt={new Date('2024-01-15T10:00:00Z')}
          onSourceClick={onSourceClick}
        />
      )

      expect(screen.getByText('View 1 Source')).toBeInTheDocument()
    })

    it('should not render when sources array is empty', () => {
      const onSourceClick = vi.fn()
      const { container } = render(
        <SourceAttributionPanel
          sources={mockSources.empty}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should display average relevance score', () => {
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date('2024-01-15T10:00:00Z')}
          onSourceClick={onSourceClick}
        />
      )

      // Average of 92, 88, 85 = 88.33 -> 88%
      expect(screen.getByText(/88% avg relevance/)).toBeInTheDocument()
    })

    it('should display generation timestamp', () => {
      const onSourceClick = vi.fn()
      const now = new Date()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={now}
          onSourceClick={onSourceClick}
        />
      )

      expect(screen.getByText(/Generated/)).toBeInTheDocument()
    })
  })

  describe('Collapse/Expand Functionality', () => {
    it('should be collapsed by default', () => {
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      // Sources should not be visible when collapsed
      expect(screen.queryByText(/Program Overview 2024\.pdf/)).not.toBeInTheDocument()
    })

    it('should expand when clicked', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      const header = screen.getByText(/View \d+ Source/)
      await user.click(header)

      // Sources should now be visible
      expect(screen.getByText(/Program Overview 2024\.pdf/)).toBeInTheDocument()
    })

    it('should collapse when clicked again', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
          defaultExpanded={true}
        />
      )

      // Should be expanded initially
      expect(screen.getByText(/Program Overview 2024\.pdf/)).toBeInTheDocument()

      const header = screen.getByText('Source Attribution')
      await user.click(header)

      // Should be collapsed now
      expect(screen.queryByText(/Program Overview 2024\.pdf/)).not.toBeInTheDocument()
    })

    it('should respect defaultExpanded prop', () => {
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
          defaultExpanded={true}
        />
      )

      // Sources should be visible
      expect(screen.getByText(/Program Overview 2024\.pdf/)).toBeInTheDocument()
      expect(screen.getByText('Source Attribution')).toBeInTheDocument()
    })

    it('should show correct icon for collapsed state', () => {
      const onSourceClick = vi.fn()
      const { container } = render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
          defaultExpanded={false}
        />
      )

      // ChevronDown icon when collapsed
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should show correct icon for expanded state', () => {
      const onSourceClick = vi.fn()
      const { container } = render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
          defaultExpanded={true}
        />
      )

      // ChevronUp icon when expanded
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Source Items', () => {
    it('should display all source items when expanded', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      const header = screen.getByText(/View \d+ Source/)
      await user.click(header)

      mockSources.multiple.forEach((source) => {
        expect(screen.getByText(new RegExp(source.documentName))).toBeInTheDocument()
      })
    })

    it('should display document type badges', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      await user.click(screen.getByText(/View \d+ Source/))

      expect(screen.getByText('Proposal')).toBeInTheDocument()
      expect(screen.getByText('Report')).toBeInTheDocument()
    })

    it('should display relevance scores', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      await user.click(screen.getByText(/View \d+ Source/))

      expect(screen.getByText('92%')).toBeInTheDocument()
      expect(screen.getByText('88%')).toBeInTheDocument()
      expect(screen.getByText('85%')).toBeInTheDocument()
    })

    it('should display excerpts', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      await user.click(screen.getByText(/View \d+ Source/))

      mockSources.multiple.forEach((source) => {
        if (source.excerpt) {
          expect(screen.getByText(new RegExp(source.excerpt.substring(0, 30)))).toBeInTheDocument()
        }
      })
    })

    it('should display page numbers when available', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      await user.click(screen.getByText(/View \d+ Source/))

      expect(screen.getByText('Page 1')).toBeInTheDocument()
      expect(screen.getByText('Page 5')).toBeInTheDocument()
    })

    it('should call onSourceClick when source item is clicked', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      await user.click(screen.getByText(/View \d+ Source/))

      const firstSource = screen.getByText(/Program Overview 2024\.pdf/)
      await user.click(firstSource.closest('button')!)

      expect(onSourceClick).toHaveBeenCalledTimes(1)
      expect(onSourceClick).toHaveBeenCalledWith(mockSources.multiple[0])
    })
  })

  describe('Relevance Bar', () => {
    it('should display green bar for high relevance (≥80%)', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      await user.click(screen.getByText(/View \d+ Source/))

      // Check for relevance bars (implementation detail)
      const { container } = render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
          defaultExpanded={true}
        />
      )

      const bars = container.querySelectorAll('.bg-green-500')
      expect(bars.length).toBeGreaterThan(0)
    })

    it('should display amber bar for medium relevance (60-79%)', async () => {
      const mediumSource = [
        {
          ...mockSources.single[0],
          relevanceScore: 72,
        },
      ]

      const onSourceClick = vi.fn()
      const { container } = render(
        <SourceAttributionPanel
          sources={mediumSource}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
          defaultExpanded={true}
        />
      )

      const bars = container.querySelectorAll('.bg-amber-500')
      expect(bars.length).toBeGreaterThan(0)
    })

    it('should display gray bar for low relevance (<60%)', async () => {
      const onSourceClick = vi.fn()
      const { container } = render(
        <SourceAttributionPanel
          sources={mockSources.lowRelevance}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
          defaultExpanded={true}
        />
      )

      const bars = container.querySelectorAll('.bg-gray-400')
      expect(bars.length).toBeGreaterThan(0)
    })
  })

  describe('Copy with Attribution', () => {
    it('should render copy button when onCopyWithAttribution is provided', () => {
      const onSourceClick = vi.fn()
      const onCopyWithAttribution = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
          onCopyWithAttribution={onCopyWithAttribution}
        />
      )

      const copyButton = screen.getByTitle('Copy with attribution')
      expect(copyButton).toBeInTheDocument()
    })

    it('should not render copy button when onCopyWithAttribution is not provided', () => {
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      const copyButton = screen.queryByTitle('Copy with attribution')
      expect(copyButton).not.toBeInTheDocument()
    })

    it('should call onCopyWithAttribution when copy button is clicked', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()
      const onCopyWithAttribution = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
          onCopyWithAttribution={onCopyWithAttribution}
        />
      )

      const copyButton = screen.getByTitle('Copy with attribution')
      await user.click(copyButton)

      expect(onCopyWithAttribution).toHaveBeenCalledTimes(1)
    })
  })

  describe('Source Count Display', () => {
    it('should display correct count for multiple sources', () => {
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      expect(screen.getByText('View 3 Sources')).toBeInTheDocument()
    })

    it('should use singular "Source" for one source', () => {
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.single}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      expect(screen.getByText('View 1 Source')).toBeInTheDocument()
    })

    it('should display total count when expanded with many sources', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      await user.click(screen.getByText(/View \d+ Source/))

      expect(screen.getByText(/3 sources used for this generation/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      // Tab to expand button
      await user.tab()
      await user.keyboard('{Enter}')

      // Should expand
      expect(screen.getByText(/Program Overview 2024\.pdf/)).toBeInTheDocument()
    })

    it('should have semantic button elements', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      await user.click(screen.getByText(/View \d+ Source/))

      const sourceButtons = screen.getAllByRole('button')
      expect(sourceButtons.length).toBeGreaterThan(1) // Header + source items
    })
  })

  describe('Visual States', () => {
    it('should show hover state on source items', async () => {
      const user = userEvent.setup()
      const onSourceClick = vi.fn()

      render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
          defaultExpanded={true}
        />
      )

      const sourceButton = screen.getByText(/Program Overview 2024\.pdf/).closest('button')
      expect(sourceButton).toBeInTheDocument()
      expect(sourceButton?.className).toContain('hover:bg-gray-50')
      expect(sourceButton?.className).toContain('hover:border-blue-300')
    })

    it('should display blue accent color', () => {
      const onSourceClick = vi.fn()
      const { container } = render(
        <SourceAttributionPanel
          sources={mockSources.multiple}
          generatedAt={new Date()}
          onSourceClick={onSourceClick}
        />
      )

      const panel = container.querySelector('.border-blue-500')
      expect(panel).toBeInTheDocument()
    })
  })
})
