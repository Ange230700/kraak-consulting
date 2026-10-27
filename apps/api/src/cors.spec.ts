import { buildCorsOptions } from './cors';

type OriginCallback = (err: Error | null, allow?: boolean) => void;
type OriginFn = (origin: string | undefined, callback: OriginCallback) => void;

function callOrigin(fn: OriginFn, origin: string | undefined) {
  return new Promise<{ err: Error | null; allow?: boolean }>((resolve) => {
    fn(origin, (err, allow) => resolve({ allow, err }));
  });
}

describe('buildCorsOptions', () => {
  describe('Given no CORS env vars are configured', () => {
    it('When called Then it returns a permissive default policy', () => {
      const options = buildCorsOptions({});

      expect(options.origin).toBe(true);
      expect(options.credentials).toBeUndefined();
    });
  });

  describe('Given an exact allow-list via CORS_ALLOWED_ORIGINS', () => {
    const env = {
      CORS_ALLOWED_ORIGINS:
        'https://kraak-web-staging.onrender.com, https://kraak-web-prod.onrender.com',
    };

    it('When the request has no Origin header Then it is allowed', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(options.origin as OriginFn, undefined);

      expect(result.err).toBeNull();
      expect(result.allow).toBe(true);
    });

    it('When the Origin is the Render staging web app Then it is allowed', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        'https://kraak-web-staging.onrender.com',
      );

      expect(result.err).toBeNull();
      expect(result.allow).toBe(true);
    });

    it('When the Origin is the Render production web app Then it is allowed', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        'https://kraak-web-prod.onrender.com',
      );

      expect(result.err).toBeNull();
      expect(result.allow).toBe(true);
    });

    it('When the Origin does not match Then it is rejected', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        'https://unknown-origin.example',
      );

      expect(result.err).toBeInstanceOf(Error);
      expect(result.allow).toBeFalsy();
    });
  });

  describe('Given a regex allow-list via CORS_ALLOWED_ORIGIN_PATTERNS', () => {
    const env = {
      CORS_ALLOWED_ORIGIN_PATTERNS: String.raw`^https://preview-[a-z0-9-]+\.example\.com$`,
    };

    it('When an Origin matches the configured pattern Then it is allowed', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        'https://preview-abc123.example.com',
      );

      expect(result.err).toBeNull();
      expect(result.allow).toBe(true);
    });

    it('When an Origin does not match the configured pattern Then it is rejected', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        'https://other-preview.example.com',
      );

      expect(result.err).toBeInstanceOf(Error);
      expect(result.allow).toBeFalsy();
    });
  });

  describe('Given both exact and pattern allow-lists', () => {
    it('When the Origin matches either source Then it is allowed', async () => {
      const options = buildCorsOptions({
        CORS_ALLOWED_ORIGINS: 'https://kraak-web-prod.onrender.com',
        CORS_ALLOWED_ORIGIN_PATTERNS: String.raw`^https://preview-[a-z0-9-]+\.example\.com$`,
      });

      const exact = await callOrigin(
        options.origin as OriginFn,
        'https://kraak-web-prod.onrender.com',
      );
      const pattern = await callOrigin(
        options.origin as OriginFn,
        'https://preview-123.example.com',
      );

      expect(exact.allow).toBe(true);
      expect(pattern.allow).toBe(true);
    });
  });

  describe('Given a restrictive allow-list', () => {
    const env = {
      CORS_ALLOWED_ORIGINS: 'https://kraak-web-prod.onrender.com',
      CORS_ALLOWED_ORIGIN_PATTERNS: String.raw`^https://preview-[a-z0-9-]+\.example\.com$`,
    };

    it('When Origin is secure localhost Then it is allowed for mobile webview runtime', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        'https://localhost',
      );

      expect(result.err).toBeNull();
      expect(result.allow).toBe(true);
    });

    it('When Origin is non-secure localhost Then it is still rejected unless explicitly configured', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        'http://localhost',
      );

      expect(result.err).toBeInstanceOf(Error);
      expect(result.allow).toBeFalsy();
    });

    it('When Origin is malformed Then it is rejected safely', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        '::not-a-url::',
      );

      expect(result.err).toBeInstanceOf(Error);
      expect(result.allow).toBeFalsy();
    });
  });

  describe('Given an invalid regex pattern', () => {
    it('When called Then it throws a descriptive error', () => {
      expect(() =>
        buildCorsOptions({ CORS_ALLOWED_ORIGIN_PATTERNS: '([invalid' }),
      ).toThrow(/CORS_ALLOWED_ORIGIN_PATTERNS/);
    });
  });
});
