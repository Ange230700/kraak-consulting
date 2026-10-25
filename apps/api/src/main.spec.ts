import { DocumentBuilder } from '@nestjs/swagger';

describe('Given le démarrage de l’API', () => {
  const environment = { ...process.env };

  afterEach(() => {
    process.env = { ...environment };
    jest.resetModules();
    jest.dontMock('@nestjs/core');
    jest.dontMock('@nestjs/swagger');
    jest.dontMock('./app.module');
  });

  it.each([
    [undefined, undefined, 3000],
    [undefined, '4100', 4100],
    ['4200', '4100', 4200],
    ['abc', undefined, 3000],
    ['0', undefined, 3000],
    ['65536', undefined, 3000],
  ])(
    'When PORT=%p et API_PORT=%p, Then le serveur écoute sur %p avec sa sécurité et sa documentation',
    async (port, apiPort, expected) => {
      delete process.env['PORT'];
      delete process.env['API_PORT'];
      process.env['CORS_ALLOWED_ORIGINS'] = 'https://client.example';
      delete process.env['CORS_ALLOWED_ORIGIN_PATTERNS'];
      if (port !== undefined) process.env['PORT'] = port;
      if (apiPort !== undefined) process.env['API_PORT'] = apiPort;
      const app = {
        use: jest.fn(),
        enableCors: jest.fn(),
        listen: jest.fn().mockResolvedValue(undefined),
      };
      const create = jest.fn().mockResolvedValue(app);
      const setup = jest.fn();
      const createDocument = jest.fn().mockReturnValue({ openapi: '3.0.0' });
      jest.doMock('@nestjs/core', () => ({ NestFactory: { create } }));
      jest.doMock('./app.module', () => ({ AppModule: class AppModule {} }));
      jest.doMock('@nestjs/swagger', () => ({
        DocumentBuilder,
        SwaggerModule: { setup, createDocument },
      }));
      await import('./main');
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(app.listen).toHaveBeenCalledWith(expected);
      expect(app.use).toHaveBeenCalledWith(expect.any(Function));
      expect(app.enableCors).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: expect.any(Function),
        }),
      );
      expect(createDocument).toHaveBeenCalledWith(
        app,
        expect.objectContaining({
          info: expect.objectContaining({ title: 'KRAAK API' }),
        }),
      );
      expect(setup).toHaveBeenCalledWith('api-docs', app, { openapi: '3.0.0' });
    },
  );
});
