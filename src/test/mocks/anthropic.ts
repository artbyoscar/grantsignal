import { vi } from 'vitest'

/**
 * Mock Claude API responses with different confidence scenarios
 */
export const createMockAnthropicClient = (scenario: 'high' | 'medium' | 'low' = 'high') => {
  const responses = {
    high: {
      content: [
        {
          type: 'text' as const,
          text: 'Our comprehensive after-school program has demonstrated exceptional impact, serving 500 students annually with a 95% completion rate. Based on our 2023 Impact Report, 87% of participants showed improved academic performance through our STEM-focused curriculum and mentorship approach.',
        },
      ],
      model: 'claude-sonnet-4-5-20250929',
      usage: {
        input_tokens: 1250,
        output_tokens: 450,
      },
      id: 'msg_01ABC123',
      role: 'assistant' as const,
      stop_reason: 'end_turn' as const,
      type: 'message' as const,
    },
    medium: {
      content: [
        {
          type: 'text' as const,
          text: 'Our organization runs community engagement programs including workshops and educational activities. We work to support local families through various initiatives and partner with community organizations.',
        },
      ],
      model: 'claude-sonnet-4-5-20250929',
      usage: {
        input_tokens: 800,
        output_tokens: 320,
      },
      id: 'msg_01ABC124',
      role: 'assistant' as const,
      stop_reason: 'end_turn' as const,
      type: 'message' as const,
    },
    low: {
      content: [
        {
          type: 'text' as const,
          text: 'Based on the limited information available, we can note that the organization engages in community activities. More specific details about programs and impact would strengthen this narrative.',
        },
      ],
      model: 'claude-sonnet-4-5-20250929',
      usage: {
        input_tokens: 400,
        output_tokens: 150,
      },
      id: 'msg_01ABC125',
      role: 'assistant' as const,
      stop_reason: 'end_turn' as const,
      type: 'message' as const,
    },
  }

  return {
    messages: {
      create: vi.fn(async () => responses[scenario]),
    },
  }
}

/**
 * Mock rate limit error
 */
export const mockRateLimitError = () => {
  const error = new Error('Rate limit exceeded') as any
  error.status = 429
  return error
}

/**
 * Mock authentication error
 */
export const mockAuthError = () => {
  const error = new Error('Invalid API key') as any
  error.status = 401
  return error
}
