import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { ProgramsController } from './programs.controller';
import { ProgramsModule } from './programs.module';
import { ProgramsService } from './programs.service';

describe('ProgramsModule', () => {
  it('Given the programs module metadata, When it is inspected, Then imports controllers and providers are registered', () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      ProgramsModule,
    );
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      ProgramsModule,
    );
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      ProgramsModule,
    );

    expect(imports).toEqual(
      expect.arrayContaining([AuthModule, SupabaseModule]),
    );
    expect(controllers).toEqual(expect.arrayContaining([ProgramsController]));
    expect(providers).toEqual(expect.arrayContaining([ProgramsService]));
  });
});
