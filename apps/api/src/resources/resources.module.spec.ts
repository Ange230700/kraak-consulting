import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { ResourcesController } from './resources.controller';
import { ResourcesModule } from './resources.module';
import { ResourcesService } from './resources.service';

describe('ResourcesModule', () => {
  it('Given the resources module metadata, When it is inspected, Then imports controllers providers and exports are registered', () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      ResourcesModule,
    );
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      ResourcesModule,
    );
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      ResourcesModule,
    );
    const exportsMetadata = Reflect.getMetadata(
      MODULE_METADATA.EXPORTS,
      ResourcesModule,
    );

    expect(imports).toEqual(
      expect.arrayContaining([AuthModule, SupabaseModule]),
    );
    expect(controllers).toEqual(expect.arrayContaining([ResourcesController]));
    expect(providers).toEqual(expect.arrayContaining([ResourcesService]));
    expect(exportsMetadata).toEqual(expect.arrayContaining([ResourcesService]));
  });
});
