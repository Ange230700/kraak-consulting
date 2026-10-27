import { Test } from '@nestjs/testing';
import type { MiddlewareConsumer } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { SupabaseService } from './supabase/supabase.service';
import { ApiLocaleMiddleware } from './i18n/api-locale-context';

describe('Given le module racine de l’API', () => {
  it('When les modules sont assemblés, Then le contrôle de santé est disponible et la langue couvre toutes les routes', async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SupabaseService)
      .useValue({ getClient: jest.fn() })
      .compile();
    expect(module.get(AppController).getHealth()).toMatchObject({
      status: 'ok',
      service: 'kraak-api',
    });
    const forRoutes = jest.fn();
    const apply = jest.fn().mockReturnValue({ forRoutes });
    module.get(AppModule).configure({ apply } as unknown as MiddlewareConsumer);
    expect(apply).toHaveBeenCalledWith(ApiLocaleMiddleware);
    expect(forRoutes).toHaveBeenCalledWith('*');
    await module.close();
  });
});
