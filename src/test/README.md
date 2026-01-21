# GrantSignal Trust Architecture Tests

Comprehensive test suite for GrantSignal's Trust Architecture, covering confidence scoring, source attribution, RAG retrieval, audit trails, and UI components.

## Test Structure

### Integration Tests (`trust-architecture/`)

#### 1. Confidence Scoring Tests (`confidence-scoring.test.ts`)
Tests the three-tier confidence system:
- **High Confidence (≥80%)**: Multiple relevant sources with high similarity
- **Medium Confidence (60-79%)**: Partial context with moderate relevance
- **Low Confidence (<60%)**: Insufficient sources, blocks generation

**Key Test Cases:**
- Confidence calculation formula validation
- Threshold boundary testing (80%, 60%)
- Source quality impact on confidence
- Content display rules per tier

#### 2. Source Attribution Tests (`source-attribution.test.ts`)
Validates mandatory source tracking:
- Every AI generation returns source references
- Complete source metadata (documentId, name, relevance)
- Source ordering by relevance score
- "Copy with Attribution" functionality

**Key Test Cases:**
- Source presence in all generations
- Metadata completeness validation
- Empty sources handling
- Attribution text formatting

#### 3. RAG Retrieval Tests (`rag-retrieval.test.ts`)
Tests semantic search and retrieval:
- Similarity threshold enforcement (≥0.7 cosine similarity)
- No sources = no generation allowed
- Organization namespace isolation
- Top-K result limiting

**Key Test Cases:**
- Similarity score filtering
- Empty result handling
- Metadata preservation
- Cross-org isolation

#### 4. Audit Trail Tests (`audit-trail.test.ts`)
Validates generation logging:
- Timestamp tracking for all generations
- User/organization context capture
- Source and confidence logging
- Model and token usage tracking

**Key Test Cases:**
- Complete audit record structure
- Query capabilities (by user, org, grant)
- Record immutability
- Compliance requirements

### Component Tests (`components/`)

#### 5. ConfidenceBadge Tests (`confidence-badge.test.tsx`)
UI component for confidence display:
- Color coding per tier (green/amber/red)
- Icon display (Check/AlertTriangle/XCircle)
- Size variants (sm/md/lg)
- Tooltip content

**Key Test Cases:**
- Visual styling per confidence level
- Boundary value rendering (80%, 60%)
- "View Sources" button interaction
- Accessibility testing

#### 6. SourceAttributionPanel Tests (`source-attribution-panel.test.tsx`)
Collapsible source display panel:
- Collapse/expand functionality
- Source item rendering with metadata
- Relevance bar color coding
- Copy with attribution

**Key Test Cases:**
- Default collapsed state
- Source list display when expanded
- Click handlers for navigation
- Empty state handling

#### 7. AIContentWrapper Tests (`ai-content-wrapper.test.tsx`)
Main wrapper enforcing trust architecture:
- Content visibility per confidence tier
- Warning banner display
- Action buttons (Accept/Edit/Regenerate)
- Streaming state handling

**Key Test Cases:**
- High confidence: normal display
- Medium confidence: amber warning + content
- Low confidence: content blocked
- Always show sources

## Test Fixtures

### Mock Documents (`fixtures/documents.ts`)
- **mockDocuments**: Documents with varying parse confidence
- **mockRAGContexts**: RAG responses with different similarity scores
- **mockSources**: Source objects for UI testing
- **mockGenerations**: Complete AI generation responses

### Mock Services (`mocks/`)
- **pinecone.ts**: Mock Pinecone vector database
- **anthropic.ts**: Mock Claude API responses

## Running Tests

### Run All Tests
```bash
npm run test
```

### Run Specific Test Suite
```bash
npm run test confidence-scoring
npm run test source-attribution
npm run test rag-retrieval
npm run test audit-trail
npm run test confidence-badge
npm run test source-attribution-panel
npm run test ai-content-wrapper
```

### Run with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Configuration

### Vitest Config (`vitest.config.ts`)
- Environment: jsdom (for React component testing)
- Setup file: `setup.ts` (extends matchers, cleanup)
- Coverage: v8 provider, HTML/JSON/text reports
- Path aliases: `@/` mapped to `src/`

### Coverage Targets
- `src/components/ai/**`
- `src/components/ui/confidence-badge.tsx`
- `src/components/ui/source-attribution-panel.tsx`
- `src/server/services/ai/**`

## Key Testing Principles

### 1. Confidence Threshold Enforcement
Every test validates that:
- High confidence (≥80%) displays normally
- Medium confidence (60-79%) shows warning but allows content
- Low confidence (<60%) blocks generation

### 2. Mandatory Source Attribution
All tests ensure:
- Sources are always present (even if empty array)
- Source metadata is complete
- Sources are traceable to documents
- Attribution survives all UI states

### 3. RAG Quality Gates
Tests verify:
- Only high-quality chunks (≥0.7 similarity) are used
- No sources prevents generation
- Organization isolation is maintained
- Relevance scores are preserved

### 4. Audit Trail Completeness
Tests validate:
- All generations are logged with timestamp
- User context is captured
- Sources and confidence are recorded
- Records support querying and retrieval

## Dependencies

### Testing Libraries
- **vitest**: Test runner with Vite integration
- **@testing-library/react**: React component testing
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: DOM matchers

### Mocking
- **vi** (Vitest): Function mocking
- Custom mocks for Pinecone and Anthropic APIs

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Test Behavior, Not Implementation**: Focus on user-facing outcomes
3. **Mock External Dependencies**: Isolate unit under test
4. **Use Fixtures**: Consistent test data across suites
5. **Test Edge Cases**: Boundaries, empty states, errors
6. **Accessibility**: Keyboard navigation, semantic HTML
7. **Integration Over Unit**: Test realistic scenarios

## Troubleshooting

### Common Issues

**Tests fail with "Cannot find module '@/...'"**
- Check `vitest.config.ts` path alias configuration
- Ensure `tsconfig.json` has matching path mappings

**Component tests fail with "window.matchMedia is not a function"**
- `setup.ts` includes matchMedia mock
- Verify setup file is imported in vitest.config

**Mock not being used**
- Use `vi.mock()` at top of file before imports
- Check mock path matches actual import path
- Clear mocks between tests with `vi.clearAllMocks()`

**Coverage not including files**
- Update `coverage.include` in vitest.config
- Check file paths are relative to project root

## Contributing

When adding new Trust Architecture features:

1. Add test fixtures to `fixtures/documents.ts`
2. Create integration tests in `trust-architecture/`
3. Add component tests in `components/`
4. Update this README with new test categories
5. Ensure coverage remains above 80%

## Related Documentation

- [Trust Architecture Overview](../../docs/SOURCE_ATTRIBUTION_INTEGRATION.md)
- [Confidence Scoring Algorithm](../../src/server/services/ai/writer.ts)
- [RAG Retrieval](../../src/server/services/ai/rag.ts)
- [UI Components](../../src/components/ai/)
