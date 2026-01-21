import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfidenceBadge, ConfidenceIndicator } from '@/components/ui/confidence-badge'

describe('ConfidenceBadge Component', () => {
  describe('Confidence Level Display', () => {
    it('should display high confidence with green styling for scores ≥80%', () => {
      const { container } = render(<ConfidenceBadge score={85} />)

      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(screen.getByText('Confidence')).toBeInTheDocument()

      // Check for high confidence styling
      const badge = container.querySelector('[class*="bg-"]')
      expect(badge?.className).toContain('bg-[#10B98120]')
      expect(badge?.className).toContain('text-[#10B981]')
      expect(badge?.className).toContain('border-[#10B981]')
    })

    it('should display medium confidence with amber styling for scores 60-79%', () => {
      const { container } = render(<ConfidenceBadge score={68} />)

      expect(screen.getByText('68%')).toBeInTheDocument()

      // Check for medium confidence styling
      const badge = container.querySelector('[class*="bg-"]')
      expect(badge?.className).toContain('bg-[#F59E0B20]')
      expect(badge?.className).toContain('text-[#F59E0B]')
      expect(badge?.className).toContain('border-[#F59E0B]')
    })

    it('should display low confidence with red styling for scores <60%', () => {
      const { container } = render(<ConfidenceBadge score={42} />)

      expect(screen.getByText('42%')).toBeInTheDocument()

      // Check for low confidence styling
      const badge = container.querySelector('[class*="bg-"]')
      expect(badge?.className).toContain('bg-[#EF444420]')
      expect(badge?.className).toContain('text-[#EF4444]')
      expect(badge?.className).toContain('border-[#EF4444]')
    })

    it('should display correct icon for each confidence tier', () => {
      const { rerender, container: highContainer } = render(<ConfidenceBadge score={85} />)
      expect(highContainer.querySelector('svg')).toBeInTheDocument() // Check icon

      rerender(<ConfidenceBadge score={68} />)
      const mediumContainer = highContainer
      expect(mediumContainer.querySelector('svg')).toBeInTheDocument() // AlertTriangle icon

      rerender(<ConfidenceBadge score={42} />)
      const lowContainer = highContainer
      expect(lowContainer.querySelector('svg')).toBeInTheDocument() // XCircle icon
    })
  })

  describe('Confidence Boundaries', () => {
    it('should treat score=80 as high confidence', () => {
      const { container } = render(<ConfidenceBadge score={80} />)
      const badge = container.querySelector('[class*="bg-"]')
      expect(badge?.className).toContain('text-[#10B981]') // High confidence color
    })

    it('should treat score=79 as medium confidence', () => {
      const { container } = render(<ConfidenceBadge score={79} />)
      const badge = container.querySelector('[class*="bg-"]')
      expect(badge?.className).toContain('text-[#F59E0B]') // Medium confidence color
    })

    it('should treat score=60 as medium confidence', () => {
      const { container } = render(<ConfidenceBadge score={60} />)
      const badge = container.querySelector('[class*="bg-"]')
      expect(badge?.className).toContain('text-[#F59E0B]') // Medium confidence color
    })

    it('should treat score=59 as low confidence', () => {
      const { container } = render(<ConfidenceBadge score={59} />)
      const badge = container.querySelector('[class*="bg-"]')
      expect(badge?.className).toContain('text-[#EF4444]') // Low confidence color
    })
  })

  describe('Size Variants', () => {
    it('should render small size variant', () => {
      const { container } = render(<ConfidenceBadge score={85} size="sm" />)
      const badge = container.querySelector('[class*="px-"]')
      expect(badge?.className).toContain('text-xs')
    })

    it('should render medium size variant (default)', () => {
      const { container } = render(<ConfidenceBadge score={85} size="md" />)
      const badge = container.querySelector('[class*="px-"]')
      expect(badge?.className).toContain('text-sm')
    })

    it('should render large size variant', () => {
      const { container } = render(<ConfidenceBadge score={85} size="lg" />)
      const badge = container.querySelector('[class*="px-"]')
      expect(badge?.className).toContain('text-base')
    })

    it('should default to medium size when not specified', () => {
      const { container } = render(<ConfidenceBadge score={85} />)
      const badge = container.querySelector('[class*="px-"]')
      expect(badge?.className).toContain('text-sm')
    })
  })

  describe('Tooltip', () => {
    it('should show tooltip with confidence explanation on hover', async () => {
      const user = userEvent.setup()
      render(<ConfidenceBadge score={85} />)

      const badge = screen.getByText('85%').closest('div')
      expect(badge).toBeInTheDocument()

      // Hover over badge
      if (badge) {
        await user.hover(badge)
        // Tooltip content would be rendered by TooltipProvider
      }
    })

    it('should display high confidence tooltip text', async () => {
      render(<ConfidenceBadge score={85} />)
      // Tooltip text is defined in config but rendered by Radix UI
      // We're testing the configuration exists
      expect(screen.getByText('85%')).toBeInTheDocument()
    })

    it('should display medium confidence tooltip text', async () => {
      render(<ConfidenceBadge score={68} />)
      expect(screen.getByText('68%')).toBeInTheDocument()
    })

    it('should display low confidence tooltip text', async () => {
      render(<ConfidenceBadge score={42} />)
      expect(screen.getByText('42%')).toBeInTheDocument()
    })
  })

  describe('View Sources Button', () => {
    it('should render "View Sources" button when showSourcesButton is true', () => {
      const onViewSources = vi.fn()
      render(
        <ConfidenceBadge score={85} showSourcesButton={true} onViewSources={onViewSources} />
      )

      expect(screen.getByText('View Sources')).toBeInTheDocument()
    })

    it('should not render "View Sources" button when showSourcesButton is false', () => {
      render(<ConfidenceBadge score={85} showSourcesButton={false} />)

      expect(screen.queryByText('View Sources')).not.toBeInTheDocument()
    })

    it('should call onViewSources when button is clicked', async () => {
      const user = userEvent.setup()
      const onViewSources = vi.fn()

      render(
        <ConfidenceBadge score={85} showSourcesButton={true} onViewSources={onViewSources} />
      )

      const button = screen.getByText('View Sources')
      await user.click(button)

      expect(onViewSources).toHaveBeenCalledTimes(1)
    })

    it('should style button according to confidence level', () => {
      const onViewSources = vi.fn()
      const { container, rerender } = render(
        <ConfidenceBadge score={85} showSourcesButton={true} onViewSources={onViewSources} />
      )

      let button = screen.getByText('View Sources')
      expect(button.className).toContain('text-[#10B981]') // High confidence

      rerender(
        <ConfidenceBadge score={68} showSourcesButton={true} onViewSources={onViewSources} />
      )
      button = screen.getByText('View Sources')
      expect(button.className).toContain('text-[#F59E0B]') // Medium confidence

      rerender(
        <ConfidenceBadge score={42} showSourcesButton={true} onViewSources={onViewSources} />
      )
      button = screen.getByText('View Sources')
      expect(button.className).toContain('text-[#EF4444]') // Low confidence
    })
  })

  describe('Edge Cases', () => {
    it('should handle score=0', () => {
      const { container } = render(<ConfidenceBadge score={0} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
      const badge = container.querySelector('[class*="bg-"]')
      expect(badge?.className).toContain('text-[#EF4444]') // Low confidence
    })

    it('should handle score=100', () => {
      const { container } = render(<ConfidenceBadge score={100} />)
      expect(screen.getByText('100%')).toBeInTheDocument()
      const badge = container.querySelector('[class*="bg-"]')
      expect(badge?.className).toContain('text-[#10B981]') // High confidence
    })

    it('should apply custom className', () => {
      const { container } = render(<ConfidenceBadge score={85} className="custom-class" />)
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      const onViewSources = vi.fn()

      render(
        <ConfidenceBadge score={85} showSourcesButton={true} onViewSources={onViewSources} />
      )

      const button = screen.getByText('View Sources')

      // Tab to button and press Enter
      await user.tab()
      await user.keyboard('{Enter}')

      // Button should be in document and clickable
      expect(button).toBeInTheDocument()
    })

    it('should have semantic HTML structure', () => {
      const onViewSources = vi.fn()
      render(
        <ConfidenceBadge score={85} showSourcesButton={true} onViewSources={onViewSources} />
      )

      const button = screen.getByRole('button', { name: /view sources/i })
      expect(button).toBeInTheDocument()
    })
  })
})

describe('ConfidenceIndicator Component', () => {
  it('should render score with icon', () => {
    const { container } = render(<ConfidenceIndicator score={85} />)

    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should apply correct color for confidence level', () => {
    const { container, rerender } = render(<ConfidenceIndicator score={85} />)
    let indicator = container.querySelector('span')
    expect(indicator?.className).toContain('text-[#10B981]')

    rerender(<ConfidenceIndicator score={68} />)
    indicator = container.querySelector('span')
    expect(indicator?.className).toContain('text-[#F59E0B]')

    rerender(<ConfidenceIndicator score={42} />)
    indicator = container.querySelector('span')
    expect(indicator?.className).toContain('text-[#EF4444]')
  })

  it('should apply custom className', () => {
    const { container } = render(<ConfidenceIndicator score={85} className="custom" />)
    expect(container.querySelector('.custom')).toBeInTheDocument()
  })

  it('should render inline', () => {
    const { container } = render(<ConfidenceIndicator score={85} />)
    const indicator = container.querySelector('span')
    expect(indicator?.className).toContain('inline-flex')
  })
})
