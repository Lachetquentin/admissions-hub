import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { initI18n } from '@/i18n';

// Node ≥ 25 ships its own (file-backed, here unconfigured) `localStorage` global, which hides
// jsdom's. Point the global back to jsdom's storage so the app code behaves as in a browser.
const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window;
if (jsdomWindow && globalThis.localStorage !== jsdomWindow.localStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: jsdomWindow.localStorage,
    configurable: true,
  });
}

// Tests read the French copy unless they switch language themselves.
await initI18n('fr');

afterEach(cleanup);
