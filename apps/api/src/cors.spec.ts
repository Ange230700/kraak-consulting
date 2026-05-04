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
      expect(options.credentials).toBe(true);
    });
  });

  describe('Given an exact allow-list via CORS_ALLOWED_ORIGINS', () => {
    const env = {
      CORS_ALLOWED_ORIGINS: 'https://example.com, https://app.example.com',
    };

    it('When the request has no Origin header Then it is allowed', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(options.origin as OriginFn, undefined);

      expect(result.err).toBeNull();
      expect(result.allow).toBe(true);
    });

    it('When the Origin matches an entry Then it is allowed', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        'https://app.example.com',
      );

      expect(result.err).toBeNull();
      expect(result.allow).toBe(true);
    });

    it('When the Origin does not match Then it is rejected', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        'https://evil.test',
      );

      expect(result.err).toBeInstanceOf(Error);
      expect(result.allow).toBeFalsy();
    });
  });

  describe('Given a regex allow-list via CORS_ALLOWED_ORIGIN_PATTERNS', () => {
    const env = {
      CORS_ALLOWED_ORIGIN_PATTERNS: String.raw`^https://kraak-consulting(-[a-z0-9]+)?-ange230700s-projects\.vercel\.app$`,
    };

    it('When a Vercel preview Origin matches Then it is allowed', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        'https://kraak-consulting-7rc34lkhb-ange230700s-projects.vercel.app',
      );

      expect(result.err).toBeNull();
      expect(result.allow).toBe(true);
    });

    it('When the Vercel-shaped Origin belongs to another project Then it is rejected', async () => {
      const options = buildCorsOptions(env);
      const result = await callOrigin(
        options.origin as OriginFn,
        'https://other-project-abc-someone-else-projects.vercel.app',
      );

      expect(result.err).toBeInstanceOf(Error);
      expect(result.allow).toBeFalsy();
    });
  });

  describe('Given both exact and pattern allow-lists', () => {
    it('When the Origin matches either source Then it is allowed', async () => {
      const options = buildCorsOptions({
        CORS_ALLOWED_ORIGINS: 'https://kraak.app',
        CORS_ALLOWED_ORIGIN_PATTERNS: String.raw`^https://[a-z0-9-]+\.vercel\.app$`,
      });

      const exact = await callOrigin(
        options.origin as OriginFn,
        'https://kraak.app',
      );
      const pattern = await callOrigin(
        options.origin as OriginFn,
        'https://preview-123.vercel.app',
      );

      expect(exact.allow).toBe(true);
      expect(pattern.allow).toBe(true);
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
