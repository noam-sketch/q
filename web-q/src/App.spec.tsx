import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';
import React from 'react';

// Mock Worker
class MockWorker {
  postMessage() {}
  onmessage() {}
  addEventListener() {}
  removeEventListener() {}
  terminate() {}
}
(globalThis as any).Worker = MockWorker;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('App', () => {
  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});