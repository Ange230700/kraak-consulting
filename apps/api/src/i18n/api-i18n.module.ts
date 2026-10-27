import { Global, Module } from '@nestjs/common';
import { ApiLocaleContext, ApiLocaleMiddleware } from './api-locale-context';

@Global()
@Module({
  providers: [ApiLocaleContext, ApiLocaleMiddleware],
  exports: [ApiLocaleContext, ApiLocaleMiddleware],
})
export class ApiI18nModule {}
