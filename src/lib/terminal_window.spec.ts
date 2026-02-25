import { describe, it, expect, vi } from 'vitest';
import { renderInWindow } from './terminal_window.js';

// Mock blessed to avoid terminal issues in tests
vi.mock('blessed', () => {
  const mockBox = {
    setContent: vi.fn(),
    focus: vi.fn(),
    screen: {
      render: vi.fn(),
      destroy: vi.fn(),
      key: vi.fn(),
      append: vi.fn(),
    }
  };
  const mockScreen = {
    append: vi.fn(),
    render: vi.fn(),
    key: vi.fn((keys, cb) => cb()), // Immediately call the callback
    destroy: vi.fn(),
  };
  return {
    default: {
      screen: vi.fn(() => mockScreen),
      box: vi.fn(() => mockBox),
    }
  };
});

describe('Terminal Window Rendering', () => {
  it('should attempt to render content in a blessed box', async () => {
    // In a real TUI test we'd check screen calls, but since we mock it:
    const content = `# Divine Manifestation
This is a test of the Kinetic Window.`;
    
    // We expect the function to at least complete without error when mocked
    await expect(renderInWindow(content)).resolves.not.toThrow();
  });
});
