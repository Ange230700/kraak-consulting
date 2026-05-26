import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { ServicesController } from './services.controller';
import { ServicesModule } from './services.module';
import { ServicesService } from './services.service';

describe('ServicesModule', () => {
  it('Given the services module metadata, When it is inspected, Then imports controllers and providers are registered', () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      ServicesModule,
    );
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      ServicesModule,
    );
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      ServicesModule,
    );

    expect(imports).toEqual(
      expect.arrayContaining([AuthModule, SupabaseModule]),
    );
    expect(controllers).toEqual(expect.arrayContaining([ServicesController]));
    expect(providers).toEqual(expect.arrayContaining([ServicesService]));
  });
});
