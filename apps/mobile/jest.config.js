// Render-test harness (W2-A). jest-expo is the officially supported runner for
// @testing-library/react-native; it lives alongside Vitest, which keeps every
// logic test. The two are extension-disjoint: Jest owns `*.test.tsx`, Vitest
// owns `*.test.ts` (see vitest.config.ts include). Nothing runs under both.
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    // CSS side-effect imports (global.css) → no-op; the stylesheet is a Metro
    // transformer artifact, absent under jest.
    '\\.css$': '<rootDir>/jest/style-mock.js',
    // Consume the in-memory storage seam (lib/adapters/storage.ts) instead of
    // the MMKV-backed .native sibling jest-expo would otherwise resolve — keeps
    // react-native-mmkv's native binding out of the node test process. Both the
    // relative import (featureFlags.ts → './storage') and the aliased import
    // (tests → '@/lib/adapters/storage') are pinned here, BEFORE the '^@/'
    // catch-all. This maps the seam, it does not edit it (storage*.ts untouched).
    '^\\./storage$': '<rootDir>/lib/adapters/storage.ts',
    '/adapters/storage$': '<rootDir>/lib/adapters/storage.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
};
