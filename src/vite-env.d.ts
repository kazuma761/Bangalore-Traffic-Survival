/// <reference types="vite/client" />

/**
 * Boot progress shim. Defined by an inline script in index.html so the bar is
 * already live while the module bundle is still downloading; optional because
 * nothing breaks if that script is stripped.
 */
declare global {
  interface Window {
    __boot?: { set(fraction: number, label?: string): void };
  }
}

export {};
