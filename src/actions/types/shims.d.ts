declare module 'uuid' {
  export function v4(): string;
}

// Ambient module shims for JS utils used by actions
declare module '../utils/common';
declare module '../utils/aemCscUtils';
declare module '../utils/adobeAuthUtils';
