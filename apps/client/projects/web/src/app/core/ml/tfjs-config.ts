import { InjectionToken } from '@angular/core';

export type TfjsBackend = 'webgl' | 'wasm' | 'cpu';

export interface TfjsConfig {
  backend: TfjsBackend;
}

export const DEFAULT_TFJS_CONFIG: TfjsConfig = {
  backend: 'webgl',
};

export const TFJS_CONFIG = new InjectionToken<TfjsConfig>('KRAAK_TFJS_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_TFJS_CONFIG,
});
