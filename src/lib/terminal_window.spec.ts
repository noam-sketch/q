import { describe, it, expect, vi } from 'vitest';
import { renderInWindow } from './terminal_window.js';

// Mock ink to avoid terminal issues in tests
vi.mock('ink', () => {
  return {
    render: vi.fn(() => ({
      waitUntilExit: vi.fn().mockResolvedValue(undefined),
      unmount: vi.fn(),
      rerender: vi.fn(),
      cleanup: vi.fn(),
      clear: vi.fn(),
    })),
    /* eslint-disable @typescript-eslint/no-explicit-any */
    Box: ({ children }: any) => children,
    Text: ({ children }: any) => children,
    /* eslint-enable @typescript-eslint/no-explicit-any */
    useInput: vi.fn(),
    useApp: vi.fn(() => ({ exit: vi.fn() })),
  };
});

// Mock ink-syntax-highlight
vi.mock('ink-syntax-highlight', () => {
  return {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    default: ({ code }: any) => code,
    /* eslint-enable @typescript-eslint/no-explicit-any */
  };
});

describe('Terminal Window Rendering (Ink)', () => {
  it('should attempt to render content using Ink', async () => {
    const content = `# Divine Manifestation
This is a test of the Kinetic Window using Ink.
\`\`\`javascript
const code = "pretty printed";
\`\`\``;
    
    await expect(renderInWindow(content)).resolves.not.toThrow();
  });
});
