import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsModule } from './announcements.module';
import { AnnouncementsService } from './announcements.service';

describe('AnnouncementsModule', () => {
  it('Given module metadata When inspected Then announcements dependencies are wired', () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      AnnouncementsModule,
    );
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      AnnouncementsModule,
    );
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      AnnouncementsModule,
    );

    expect(imports).toEqual(
      expect.arrayContaining([AuthModule, SupabaseModule]),
    );
    expect(controllers).toEqual(
      expect.arrayContaining([AnnouncementsController]),
    );
    expect(providers).toEqual(expect.arrayContaining([AnnouncementsService]));
  });
});
