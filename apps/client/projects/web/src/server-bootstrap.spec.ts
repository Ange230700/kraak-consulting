import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

const runtime = vi.hoisted(() => ({
  app: { get: vi.fn(), use: vi.fn(), listen: vi.fn() },
  static: vi.fn(),
  handle: vi.fn(),
  writeResponse: vi.fn(),
  main: vi.fn(),
  exists: vi.fn(),
}));

vi.mock('express', () => ({
  default: Object.assign(() => runtime.app, { static: runtime.static }),
}));
vi.mock('@angular/ssr/node', () => ({
  AngularNodeAppEngine: class {
    handle = runtime.handle;
  },
  createNodeRequestHandler: (app: unknown) => app,
  isMainModule: runtime.main,
  writeResponseToNodeResponse: runtime.writeResponse,
}));

type Middleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => void;

describe('Serveur SSR et délégation HTTP', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('pm_id', undefined);
    vi.stubEnv('PORT', undefined);
    runtime.main.mockReturnValue(false);
    runtime.exists.mockReturnValue(false);
    runtime.static.mockReturnValue('static-middleware');
    runtime.handle.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function request(
    originalUrl: string,
    method = 'GET',
    accepts = true,
  ): Request {
    return {
      originalUrl,
      method,
      accepts: () => accepts,
    } as unknown as Request;
  }

  function response() {
    return { setHeader: vi.fn(), sendFile: vi.fn() };
  }

  async function middlewares() {
    const module = await import('./server');
    expect(module.app).toBe(runtime.app);
    expect(module.reqHandler).toBe(runtime.app);
    return runtime.app.use.mock.calls
      .filter(([handler]) => typeof handler === 'function')
      .map(([handler]) => handler as Middleware)
      .slice(-2);
  }

  it('Given des URL publiques historiques, When le middleware reçoit GET, HEAD ou POST, Then seules les lectures historiques sont redirigées', async () => {
    await middlewares();
    const redirect = runtime.app.use.mock.calls[0][0] as Middleware;
    const res = { redirect: vi.fn() };
    const next = vi.fn();
    redirect(request('/contact?source=test'), res as unknown as Response, next);
    expect(res.redirect).toHaveBeenCalledWith(301, '/fr/contact?source=test');
    redirect(request('/fr/contact', 'HEAD'), res as unknown as Response, next);
    redirect(request('/contact', 'POST'), res as unknown as Response, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
  it('Given le fichier runtime, When il est demandé, Then le cache est désactivé et les erreurs de lecture sont déléguées', async () => {
    await middlewares();
    const handler = runtime.app.get.mock.calls.find(
      ([path]) => path === '/assets/runtime-config.js',
    )![1] as Middleware;
    const res = response();
    const next = vi.fn();
    handler(
      request('/assets/runtime-config.js'),
      res as unknown as Response,
      next,
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    expect(res.sendFile.mock.calls[0][0]).toMatch(/runtime-config\.js$/);
    const callback = res.sendFile.mock.calls[0][1] as (error?: Error) => void;
    callback();
    expect(next).not.toHaveBeenCalled();
    const error = new Error('lecture impossible');
    callback(error);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('Given les assets statiques, When leurs en-têtes sont calculés, Then seul le HTML désactive le cache long', async () => {
    await middlewares();
    const options = runtime.static.mock.calls[0][1] as {
      maxAge: string;
      index: boolean;
      redirect: boolean;
      setHeaders: (res: unknown, path: string) => void;
    };
    const res = response();
    expect(options).toMatchObject({
      maxAge: '1y',
      index: false,
      redirect: false,
    });
    options.setHeaders(res, 'page.html');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    res.setHeader.mockClear();
    options.setHeaders(res, 'image.png');
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('Given une page pré-rendue, When GET ou HEAD demande du HTML, Then le fichier est servi et ses erreurs sont déléguées', async () => {
    const { createPrerenderedPageMiddleware } = await import('./server');
    const prerender = createPrerenderedPageMiddleware(
      'C:\\browser',
      runtime.exists,
    );
    runtime.exists.mockReturnValue(true);
    for (const method of ['GET', 'HEAD']) {
      const res = response();
      const next = vi.fn();
      prerender(
        request('/fr/a-propos?source=test', method),
        res as unknown as Response,
        next,
      );
      expect(runtime.exists).toHaveBeenCalled();
      expect(res.sendFile.mock.calls[0][0]).toMatch(
        /a-propos[\\/]index\.html$/,
      );
      const callback = res.sendFile.mock.calls[0][1] as (error?: Error) => void;
      callback();
      expect(next).not.toHaveBeenCalled();
      const error = new Error('fichier absent');
      callback(error);
      expect(next).toHaveBeenCalledWith(error);
    }
  });

  it.each([
    ['/fr/a-propos', 'POST', true],
    ['/fr/a-propos', 'GET', false],
    ['/fr/a-propos', 'GET', true],
    ['/fr/%invalid', 'GET', true],
  ])(
    'Given une requête non pré-rendue %s %s, When le fichier est recherché, Then le middleware suivant prend le relais',
    async (url, method, accepts) => {
      const [prerender] = await middlewares();
      const res = response();
      const next = vi.fn();
      prerender(
        request(url, method, accepts),
        res as unknown as Response,
        next,
      );
      expect(next).toHaveBeenCalledOnce();
      expect(res.sendFile).not.toHaveBeenCalled();
    },
  );

  it('Given le moteur Angular, When une réponse est disponible ou absente, Then elle est écrite ou la requête est déléguée', async () => {
    const [, angular] = await middlewares();
    const req = request('/fr/contact');
    const res = response();
    const next = vi.fn();
    const rendered = new globalThis.Response('rendu SSR');
    runtime.handle.mockResolvedValueOnce(rendered);
    angular(req, res as unknown as Response, next);
    await vi.waitFor(() =>
      expect(runtime.writeResponse).toHaveBeenCalledWith(rendered, res),
    );
    angular(req, res as unknown as Response, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledOnce());
    const error = new Error('SSR indisponible');
    runtime.handle.mockRejectedValueOnce(error);
    angular(req, res as unknown as Response, next);
    await vi.waitFor(() => expect(next).toHaveBeenCalledWith(error));
  });

  it.each([false, true])(
    'Given un lancement direct %s ou PM2, When le serveur démarre, Then le port attendu est écouté',
    async (direct) => {
      runtime.main.mockReturnValue(direct);
      if (!direct) {
        vi.stubEnv('pm_id', '0');
        vi.stubEnv('PORT', '4123');
      }
      const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      await middlewares();
      expect(runtime.app.listen.mock.calls[0][0]).toBe(direct ? 4000 : '4123');
      const callback = runtime.app.listen.mock.calls[0][1] as (
        error?: Error,
      ) => void;
      callback();
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('Node Express server listening'),
      );
      const error = new Error('port occupé');
      expect(() => callback(error)).toThrow(error);
    },
  );
});
