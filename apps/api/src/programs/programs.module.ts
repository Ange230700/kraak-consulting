import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';

@Module({
  imports: [AuthModule, SupabaseModule],
  controllers: [ProgramsController],
  providers: [ProgramsService],
})
export class ProgramsModule {}
