import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProgramsModule } from './programs/programs.module';
import { ResourcesModule } from './resources/resources.module';
import { resolveApiEnvFilePaths } from './config/environment-files';
import { SupabaseModule } from './supabase/supabase.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveApiEnvFilePaths(process.env['NODE_ENV']),
    }),
    SupabaseModule,
    AuthModule,
    AnnouncementsModule,
    ArticlesModule,
    DashboardModule,
    ProgramsModule,
    ResourcesModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
