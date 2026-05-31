import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersController } from './users.controller';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';

describe('UsersModule', () => {
  it('Given module metadata When inspected Then users dependencies are wired', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, UsersModule);
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      UsersModule,
    );
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      UsersModule,
    );
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, UsersModule);

    expect(imports).toEqual(
      expect.arrayContaining([AuthModule, SupabaseModule]),
    );
    expect(controllers).toEqual(expect.arrayContaining([UsersController]));
    expect(providers).toEqual(expect.arrayContaining([UsersService]));
    expect(exports).toEqual(expect.arrayContaining([UsersService]));
  });
});
