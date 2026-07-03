declare const __APP_BUILD_ID__: string;

export const APP_BUILD_ID =
  typeof __APP_BUILD_ID__ === 'string' && __APP_BUILD_ID__.length > 0
    ? __APP_BUILD_ID__
    : import.meta.env.VITE_BUILD_ID ?? 'dev';
