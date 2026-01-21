import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AIContentWrapper, StreamingAIContent, BlockedAIContent } from '@/components/ai/ai-content-wrapper'
import { mockSources } from '../fixtures/documents'

describe('AIContentWrapper Component', () => {
  const mockGeneratedAt = new Date('2024-01-15T10:30:00Z')
  const mockOnSourceClick = vi.fn()

  describe('High Confidence Display (≥80%)', () => {
    it('should display content normally with high confidence', () => {
      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Our after-school program serves 500 students annually.</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/Our after-school program serves 500 students annually/)).toBeInTheDocument()
    })

    it('should show blue left border for high confidence', () => {
      const { container } = render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      const contentContainer = container.querySelector('.border-l-blue-500')
      expect(contentContainer).toBeInTheDocument()
    })

    it('should not show warning banner for high confidence', () => {
      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.queryByText(/Medium confidence/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Cannot confidently generate/)).not.toBeInTheDocument()
    })

    it('should display confidence badge with high confidence', () => {
      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText('85%')).toBeInTheDocument()
    })

    it('should show action buttons for high confidence content', () => {
      const onAccept = vi.fn()
      const onEdit = vi.fn()
      const onRegenerate = vi.fn()

      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
          onAccept={onAccept}
          onEdit={onEdit}
          onRegenerate={onRegenerate}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText('Accept')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Regenerate')).toBeInTheDocument()
    })
  })

  describe('Medium Confidence Display (60-79%)', () => {
    it('should display amber warning banner for medium confidence', () => {
      render(
        <AIContentWrapper
          confidence={68}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/Medium confidence/)).toBeInTheDocument()
      expect(screen.getByText(/Verify accuracy before use/)).toBeInTheDocument()
    })

    it('should show amber left border for medium confidence', () => {
      const { container } = render(
        <AIContentWrapper
          confidence={68}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      const contentContainer = container.querySelector('.border-l-amber-500')
      expect(contentContainer).toBeInTheDocument()
    })

    it('should still display content with medium confidence', () => {
      render(
        <AIContentWrapper
          confidence={68}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Medium confidence content is shown</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/Medium confidence content is shown/)).toBeInTheDocument()
    })

    it('should mention source count in warning', () => {
      render(
        <AIContentWrapper
          confidence={68}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/Based on 3 sources/)).toBeInTheDocument()
    })

    it('should show action buttons for medium confidence content', () => {
      const onAccept = vi.fn()
      const onEdit = vi.fn()

      render(
        <AIContentWrapper
          confidence={68}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
          onAccept={onAccept}
          onEdit={onEdit}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText('Accept')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
  })

  describe('Low Confidence Blocking (<60%)', () => {
    it('should block content generation for low confidence', () => {
      render(
        <AIContentWrapper
          confidence={42}
          sources={mockSources.lowRelevance}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>This content should not be visible</p>
        </AIContentWrapper>
      )

      expect(screen.queryByText(/This content should not be visible/)).not.toBeInTheDocument()
    })

    it('should display red warning banner for low confidence', () => {
      render(
        <AIContentWrapper
          confidence={42}
          sources={mockSources.lowRelevance}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/Cannot confidently generate content/)).toBeInTheDocument()
    })

    it('should show red left border for low confidence', () => {
      const { container } = render(
        <AIContentWrapper
          confidence={42}
          sources={mockSources.lowRelevance}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      const contentContainer = container.querySelector('.border-l-red-500')
      expect(contentContainer).toBeInTheDocument()
    })

    it('should display message to review sources manually', () => {
      render(
        <AIContentWrapper
          confidence={42}
          sources={mockSources.lowRelevance}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/Review these sources manually/)).toBeInTheDocument()
      expect(screen.getByText(/Content generation blocked due to low confidence/)).toBeInTheDocument()
    })

    it('should not show action buttons for low confidence', () => {
      const onAccept = vi.fn()
      const onEdit = vi.fn()

      render(
        <AIContentWrapper
          confidence={42}
          sources={mockSources.lowRelevance}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
          onAccept={onAccept}
          onEdit={onEdit}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.queryByText('Accept')).not.toBeInTheDocument()
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('should display confidence score in blocked message', () => {
      render(
        <AIContentWrapper
          confidence={42}
          sources={mockSources.lowRelevance}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/\(42%\)/)).toBeInTheDocument()
    })
  })

  describe('Source Attribution Panel', () => {
    it('should always display source attribution panel', () => {
      const { rerender } = render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/View 3 Sources/)).toBeInTheDocument()

      rerender(
        <AIContentWrapper
          confidence={68}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/View 3 Sources/)).toBeInTheDocument()

      rerender(
        <AIContentWrapper
          confidence={42}
          sources={mockSources.lowRelevance}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/View 1 Source/)).toBeInTheDocument()
    })

    it('should expand source panel for low confidence', () => {
      render(
        <AIContentWrapper
          confidence={42}
          sources={mockSources.lowRelevance}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      // Low confidence should show expanded sources
      expect(screen.getByText(/View 1 Source/)).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should call onAccept when Accept button is clicked', async () => {
      const user = userEvent.setup()
      const onAccept = vi.fn()

      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
          onAccept={onAccept}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      const acceptButton = screen.getByText('Accept')
      await user.click(acceptButton)

      expect(onAccept).toHaveBeenCalledTimes(1)
    })

    it('should call onEdit when Edit button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()

      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
          onEdit={onEdit}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      expect(onEdit).toHaveBeenCalledTimes(1)
    })

    it('should call onRegenerate when Regenerate button is clicked', async () => {
      const user = userEvent.setup()
      const onRegenerate = vi.fn()

      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
          onRegenerate={onRegenerate}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      const regenerateButton = screen.getByText('Regenerate')
      await user.click(regenerateButton)

      expect(onRegenerate).toHaveBeenCalledTimes(1)
    })

    it('should not render buttons when callbacks not provided', () => {
      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.queryByText('Accept')).not.toBeInTheDocument()
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
      expect(screen.queryByText('Regenerate')).not.toBeInTheDocument()
    })
  })

  describe('Streaming State', () => {
    it('should show streaming indicator when isStreaming is true', () => {
      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
          isStreaming={true}
        >
          <p>Partial content...</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/Generating content/)).toBeInTheDocument()
    })

    it('should not show action buttons during streaming', () => {
      const onAccept = vi.fn()

      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
          onAccept={onAccept}
          isStreaming={true}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.queryByText('Accept')).not.toBeInTheDocument()
    })

    it('should display content with streaming indicator', () => {
      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
          isStreaming={true}
        >
          <p>Streaming content appears here</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/Streaming content appears here/)).toBeInTheDocument()
    })
  })

  describe('Trust Architecture Footer', () => {
    it('should display trust architecture message', () => {
      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/All AI content includes mandatory source attribution/)).toBeInTheDocument()
    })

    it('should have link to trust architecture docs', () => {
      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      const learnMoreLink = screen.getByText('Learn more')
      expect(learnMoreLink).toBeInTheDocument()
    })
  })

  describe('Generation Timestamp', () => {
    it('should display generation timestamp', () => {
      render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      expect(screen.getByText(/Generated/)).toBeInTheDocument()
    })
  })

  describe('Confidence Badge Position', () => {
    it('should display confidence badge in top right corner', () => {
      const { container } = render(
        <AIContentWrapper
          confidence={85}
          sources={mockSources.multiple}
          generatedAt={mockGeneratedAt}
          onSourceClick={mockOnSourceClick}
        >
          <p>Content</p>
        </AIContentWrapper>
      )

      const badge = container.querySelector('.absolute.right-4.top-4')
      expect(badge).toBeInTheDocument()
    })
  })
})

describe('StreamingAIContent Component', () => {
  it('should render with streaming state enabled', () => {
    render(
      <StreamingAIContent
        content="Streaming content..."
        confidence={85}
        sources={mockSources.multiple}
        generatedAt={new Date()}
        onSourceClick={vi.fn()}
      />
    )

    expect(screen.getByText(/Generating content/)).toBeInTheDocument()
    expect(screen.getByText('Streaming content...')).toBeInTheDocument()
  })

  it('should display content as whitespace-pre-wrap', () => {
    const { container } = render(
      <StreamingAIContent
        content="Line 1\nLine 2\nLine 3"
        confidence={85}
        sources={mockSources.multiple}
        generatedAt={new Date()}
        onSourceClick={vi.fn()}
      />
    )

    const content = container.querySelector('.whitespace-pre-wrap')
    expect(content).toBeInTheDocument()
    expect(content?.textContent).toBe('Line 1\nLine 2\nLine 3')
  })
})

describe('BlockedAIContent Component', () => {
  it('should render with confidence set to 0', () => {
    render(
      <BlockedAIContent
        sources={mockSources.lowRelevance}
        generatedAt={new Date()}
        onSourceClick={vi.fn()}
      />
    )

    expect(screen.getByText(/Content generation blocked due to low confidence \(0%\)/)).toBeInTheDocument()
  })

  it('should display custom reason when provided', () => {
    render(
      <BlockedAIContent
        reason="Custom blocking reason"
        sources={mockSources.lowRelevance}
        generatedAt={new Date()}
        onSourceClick={vi.fn()}
      />
    )

    expect(screen.getByText(/Custom blocking reason/)).toBeInTheDocument()
  })

  it('should display default reason when not provided', () => {
    render(
      <BlockedAIContent
        sources={mockSources.empty}
        generatedAt={new Date()}
        onSourceClick={vi.fn()}
      />
    )

    expect(screen.getByText(/Insufficient relevant sources/)).toBeInTheDocument()
  })

  it('should suggest manual drafting', () => {
    render(
      <BlockedAIContent
        sources={mockSources.lowRelevance}
        generatedAt={new Date()}
        onSourceClick={vi.fn()}
      />
    )

    expect(screen.getByText(/Manual drafting recommended/)).toBeInTheDocument()
  })
})
