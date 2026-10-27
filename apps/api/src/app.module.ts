import { APP_FILTER } from '@nestjs/core';
import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { CmsModule } from './cms/cms.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { ProgramsModule } from './programs/programs.module';
import { ResourcesModule } from './resources/resources.module';
import { resolveApiEnvFilePaths } from './config/environment-files';
import { ServicesModule } from './services/services.module';
import { SupabaseModule } from './supabase/supabase.module';
import { SupportModule } from './support/support.module';
import { UsersModule } from './users/users.module';
import { ApiLocaleMiddleware } from './i18n/api-locale-context';
import { ApiI18nModule } from './i18n/api-i18n.module';

import { LocalizedHttpExceptionFilter } from './i18n/localized-http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveApiEnvFilePaths(process.env['NODE_ENV']),
    }),
    ApiI18nModule,
    SupabaseModule,
    AuthModule,
    CmsModule,
    AnnouncementsModule,
    ArticlesModule,
    DashboardModule,
    CurriculumModule,
    ProgramsModule,
    ResourcesModule,
    ServicesModule,
    SupportModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: LocalizedHttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ApiLocaleMiddleware).forRoutes('*');
  }
}
