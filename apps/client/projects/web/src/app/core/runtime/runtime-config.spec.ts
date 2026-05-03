import { getRuntimeConfig, isParticipantAreaEnabled } from './runtime-config';

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

    it('When isParticipantAreaEnabled is called Then it returns false', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = undefined;
      expect(isParticipantAreaEnabled()).toBe(false);
    });
  });

  describe('Given enableParticipantArea is true', () => {
    it('When isParticipantAreaEnabled is called Then it returns true', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: true };
      expect(isParticipantAreaEnabled()).toBe(true);
    });
  });

  describe('Given enableParticipantArea is false or absent', () => {
    it('When isParticipantAreaEnabled is called Then it returns false', () => {
      globalThis.__KRAAK_RUNTIME_CONFIG__ = { enableParticipantArea: false };
      expect(isParticipantAreaEnabled()).toBe(false);

      globalThis.__KRAAK_RUNTIME_CONFIG__ = {};
      expect(isParticipantAreaEnabled()).toBe(false);
    });
  });
});
