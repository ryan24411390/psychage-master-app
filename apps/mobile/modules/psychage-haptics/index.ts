// Re-export the native module. On web, it will be resolved to PsychageHapticsModule.web.ts
// and on native platforms to PsychageHapticsModule.ts
export { default } from './src/PsychageHapticsModule';
export * from './src/PsychageHaptics.types';
