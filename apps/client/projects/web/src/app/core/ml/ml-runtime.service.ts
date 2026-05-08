import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { TFJS_CONFIG } from './tfjs-config';

interface TfjsLikeModule {
  setBackend?: (backend: string) => Promise<void> | void;
  ready?: () => Promise<void> | void;
}

const TFJS_MODULE_SPECIFIER = '@tensorflow/tfjs';

@Injectable({ providedIn: 'root' })
export class MlRuntimeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tfjsConfig = inject(TFJS_CONFIG);

  private static initPromise: Promise<void> | null = null;
  private static initialized = false;

  initOnce(): Promise<void> {
    if (MlRuntimeService.initialized) {
      return Promise.resolve();
    }

    if (MlRuntimeService.initPromise !== null) {
      return MlRuntimeService.initPromise;
    }

    MlRuntimeService.initPromise = this.initializeRuntime().catch((error) => {
      MlRuntimeService.initPromise = null;
      throw error;
    });

    return MlRuntimeService.initPromise;
  }

  protected async initializeRuntime(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      MlRuntimeService.initialized = true;
      return;
    }

    try {
      const tfjs = await this.loadTfjsModule();
      if (!tfjs) {
        MlRuntimeService.initialized = true;
        return;
      }

      if (typeof tfjs.setBackend === 'function') {
        await tfjs.setBackend(this.tfjsConfig.backend);
      }

      if (typeof tfjs.ready === 'function') {
        await tfjs.ready();
      }
    } catch (error) {
      // Le bootstrap ne doit jamais échouer si tfjs n'est pas prêt/présent.
      console.warn('ML runtime initialization skipped:', error);
    }

    MlRuntimeService.initialized = true;
  }

  private async loadTfjsModule(): Promise<TfjsLikeModule | null> {
    try {
      const moduleSpecifier = TFJS_MODULE_SPECIFIER;
      const tfjsModule = (await import(
        /* @vite-ignore */ moduleSpecifier
      )) as TfjsLikeModule;
      return tfjsModule;
    } catch (error) {
      if (isMissingTfjsDependencyError(error)) {
        return null;
      }

      throw error;
    }
  }

  static resetForTests(): void {
    MlRuntimeService.initialized = false;
    MlRuntimeService.initPromise = null;
  }
}

function isMissingTfjsDependencyError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const mentionsTfjs = message.includes('@tensorflow/tfjs');
  const looksLikeResolutionError =
    message.includes('cannot find module') ||
    message.includes('cannot find package') ||
    message.includes('failed to resolve') ||
    message.includes('does not exist');

  return mentionsTfjs && looksLikeResolutionError;
}
