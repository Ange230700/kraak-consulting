import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesPublicController } from './articles-public.controller';
import { ArticlesService } from './articles.service';

@Module({
  controllers: [ArticlesController, ArticlesPublicController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
