# Test Suite Installation Guide

## Required Dependencies

The test suite requires these additional dependencies that may not be installed yet:

```bash
npm install --save-dev @testing-library/user-event @testing-library/jest-dom @vitejs/plugin-react
```

## Dependency Breakdown

### Already Installed ✅
- `vitest` - Test runner
- `@testing-library/react` - React component testing

### Need to Install 📦
- `@testing-library/user-event` - Simulates user interactions (clicks, typing, etc.)
- `@testing-library/jest-dom` - Custom matchers for DOM assertions (toBeInTheDocument, toHaveClass, etc.)
- `@vitejs/plugin-react` - Vite plugin for React (required for JSX in tests)

## Installation Steps

1. Install missing dependencies:
   ```bash
   npm install --save-dev @testing-library/user-event @testing-library/jest-dom @vitejs/plugin-react
   ```

2. Verify installation:
   ```bash
   npm list @testing-library/user-event @testing-library/jest-dom @vitejs/plugin-react
   ```

3. Run tests:
   ```bash
   npm run test
   ```

## Running Tests

### Add Test Scripts to package.json

If not already present, add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Run Test Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Configuration Files

The test suite includes these configuration files:

1. **src/test/vitest.config.ts** - Vitest configuration
   - Sets up jsdom environment
   - Configures path aliases
   - Defines coverage settings

2. **src/test/setup.ts** - Test setup file
   - Extends matchers with jest-dom
   - Configures cleanup after each test
   - Mocks window.matchMedia

## Verifying Installation

Run a single test file to verify everything is working:

```bash
npm run test -- src/test/components/confidence-badge.test.tsx
```

If successful, you should see output like:
```
✓ src/test/components/confidence-badge.test.tsx (XX tests)
  ✓ ConfidenceBadge Component
    ✓ should display high confidence with green styling
    ...
```

## Troubleshooting

### Error: "Cannot find module '@testing-library/user-event'"
**Solution:** Install the missing dependency:
```bash
npm install --save-dev @testing-library/user-event
```

### Error: "Cannot find module '@testing-library/jest-dom/matchers'"
**Solution:** Install the missing dependency:
```bash
npm install --save-dev @testing-library/jest-dom
```

### Error: "Unexpected token '<'" or JSX syntax errors
**Solution:** Install Vite React plugin:
```bash
npm install --save-dev @vitejs/plugin-react
```

### Tests pass but coverage shows 0%
**Solution:** Install coverage provider:
```bash
npm install --save-dev @vitest/coverage-v8
```

### Error: "window.matchMedia is not a function"
**Solution:** Verify `src/test/setup.ts` is included in vitest.config.ts:
```typescript
test: {
  setupFiles: ['./setup.ts'],
}
```

## Next Steps

After installation, you can:

1. Run the full test suite: `npm run test`
2. Generate coverage report: `npm run test:coverage`
3. View coverage in browser: Open `coverage/index.html`
4. Add new tests following the patterns in existing test files

## IDE Integration

### VS Code
Install these extensions for better testing experience:
- **Vitest** by ZixuanChen
- **Test Explorer UI** by Holger Benl

### WebStorm/IntelliJ
Vitest support is built-in. Right-click any test file and select "Run" or "Debug".

## CI/CD Integration

Add to your CI pipeline (e.g., GitHub Actions):

```yaml
- name: Install dependencies
  run: npm ci

- name: Run tests
  run: npm run test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```
