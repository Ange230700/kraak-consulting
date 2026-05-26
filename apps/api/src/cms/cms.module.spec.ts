import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { CmsController } from './cms.controller';
import { CmsModule } from './cms.module';
import { CmsService } from './cms.service';

describe('CmsModule', () => {
  it('Given module metadata When inspected Then CMS dependencies are wired', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, CmsModule);
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      CmsModule,
    );
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, CmsModule);
    const exportsMetadata = Reflect.getMetadata(
      MODULE_METADATA.EXPORTS,
      CmsModule,
    );

    expect(imports).toEqual(
      expect.arrayContaining([AuthModule, SupabaseModule]),
    );
    expect(controllers).toEqual(expect.arrayContaining([CmsController]));
    expect(providers).toEqual(expect.arrayContaining([CmsService]));
    expect(exportsMetadata).toEqual(expect.arrayContaining([CmsService]));
  });
});
