import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { SupportRequestsController } from './support-requests.controller';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [SupabaseModule],
  controllers: [SupportController, SupportRequestsController],
  providers: [SupportService],
})
export class SupportModule {}
