// Config adapter — typed object stub.
//
// Slice 7 establishes the surface; no shared consumer reads it this slice.
// A later slice (post analytics-vendor decision) will source real values from
// `expo-constants` / build-time injection.

export interface AppConfig {
  readonly appVersion: string;
  readonly env: 'dev' | 'prod';
}

export const config: AppConfig = {
  appVersion: '0.0.0',
  env: 'dev',
};
