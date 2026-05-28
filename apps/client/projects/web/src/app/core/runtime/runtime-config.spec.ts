import { environment } from '../../../environments/environment';
import {
  canShowPreviewContent,
  getRuntimeConfig,
  isParticipantAreaEnabled,
  resolveApiBaseUrl,
  resolveSiteUrl,
} from './runtime-config';

const TEST_RUNTIME_API_BASE_URL = 'https://api.kraak.example';
const TEST_FALLBACK_API_BASE_URL = 'https://fallback.example';
const TEST_RUNTIME_SITE_URL = 'https://site.kraak.example';
const TEST_FALLBACK_SITE_URL = 'https://fallback-site.example';

describe('Runtime config helpers', () => {
  const originalConfig = globalThis.__KRAAK_RUNTIME_CONFIG__;

  afterEach(() => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = originalConfig;
  });

  describe('Given the runtime config is undefined', () => {
    it('When getRuntimeConfig is called Then it returns an empty object', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = undefined;

      expect(getRuntimeConfig()).toEqual({});
    });

    it('When isParticipantAreaEnabled is called Then it falls back to the environment default', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = undefined;

      expect(isParticipantAreaEnabled()).toBe(
        environment.enableParticipantArea,
      );
    });
  });

  describe('Given enableParticipantArea is true at runtime', () => {
    it('When isParticipantAreaEnabled is called Then it returns true', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: true };

      expect(isParticipantAreaEnabled()).toBe(true);
    });
  });

  describe('Given enableParticipantArea is false at runtime', () => {
    it('When isParticipantAreaEnabled is called Then it returns false', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: false };

      expect(isParticipantAreaEnabled()).toBe(false);
    });

    it('When canShowPreviewContent is called Then it returns false', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: false };

      expect(canShowPreviewContent()).toBe(false);
    });
  });

  describe('Given enableParticipantArea is true at runtime for canShowPreviewContent', () => {
    it('When canShowPreviewContent is called Then it returns true', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: true };

      expect(canShowPreviewContent()).toBe(true);
    });
  });

  describe('Given the runtime config exposes apiBaseUrl', () => {
    it('When resolveApiBaseUrl is called Then it returns the runtime value without trailing slash', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = {
        apiBaseUrl: `${TEST_RUNTIME_API_BASE_URL}/`,
      };

      expect(resolveApiBaseUrl(TEST_FALLBACK_API_BASE_URL)).toBe(
        TEST_RUNTIME_API_BASE_URL,
      );
    });

    it('When resolveApiBaseUrl receives a runtime value without trailing slash Then it returns it unchanged', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = {
        apiBaseUrl: TEST_RUNTIME_API_BASE_URL,
      };

      expect(resolveApiBaseUrl(`${TEST_FALLBACK_API_BASE_URL}/`)).toBe(
        TEST_RUNTIME_API_BASE_URL,
      );
    });
  });

  describe('Given the runtime config has no apiBaseUrl', () => {
    it('When resolveApiBaseUrl is called Then it returns the fallback value', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: false };

      expect(resolveApiBaseUrl(`${TEST_FALLBACK_API_BASE_URL}/`)).toBe(
        TEST_FALLBACK_API_BASE_URL,
      );
    });

    it('When resolveApiBaseUrl is called without fallback Then it returns an empty string', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = undefined;

      expect(resolveApiBaseUrl()).toBe('');
    });

    it('When resolveApiBaseUrl receives a runtime apiBaseUrl with only spaces Then it falls back to fallback', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { apiBaseUrl: '   ' };

      expect(resolveApiBaseUrl(`${TEST_FALLBACK_API_BASE_URL}/`)).toBe(
        TEST_FALLBACK_API_BASE_URL,
      );
    });
  });

  describe('Given the runtime config exposes siteUrl', () => {
    it('When resolveSiteUrl is called Then it returns the runtime value without trailing slash', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = {
        siteUrl: `${TEST_RUNTIME_SITE_URL}/`,
      };

      expect(resolveSiteUrl(TEST_FALLBACK_SITE_URL)).toBe(
        TEST_RUNTIME_SITE_URL,
      );
    });
  });

  describe('Given the runtime config has no siteUrl', () => {
    it('When resolveSiteUrl is called Then it returns the fallback value', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: false };

      expect(resolveSiteUrl(`${TEST_FALLBACK_SITE_URL}/`)).toBe(
        TEST_FALLBACK_SITE_URL,
      );
    });

    it('When resolveSiteUrl is called without fallback Then it returns an empty string', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = undefined;

      expect(resolveSiteUrl()).toBe('');
    });
  });
});
