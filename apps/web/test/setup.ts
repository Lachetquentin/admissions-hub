import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Node ≥ 25 ships its own (file-backed, here unconfigured) `localStorage` global, which hides
// jsdom's. Point the global back to jsdom's storage so the app code behaves as in a browser.
const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window;
if (jsdomWindow && globalThis.localStorage !== jsdomWindow.localStorage) {
  Object.defineProperty(globalThis, 'localStorage', { value: jsdomWindow.localStorage, configurable: true });
}

afterEach(cleanup);
