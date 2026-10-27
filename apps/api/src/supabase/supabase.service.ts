import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient | undefined;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.readSupabaseSecretKey();

    if (!url || !key) {
      this.logger.warn(
        'SUPABASE_URL ou SUPABASE_SECRET_KEY manquant — le client Supabase est désactivé',
      );
      return;
    }

    this.client = createClient(url, key);
    this.logger.log('Client Supabase initialisé');
  }

  get enabled(): boolean {
    return this.client !== undefined;
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error(
        "Le client Supabase n'est pas disponible — vérifiez SUPABASE_URL et SUPABASE_SECRET_KEY",
      );
    }
    return this.client;
  }

  createAuthClient(): SupabaseClient {
    const url = this.configService.get<string>('SUPABASE_URL');
    const authKey =
      this.readSupabasePublishableKey() ?? this.readSupabaseSecretKey();

    if (!url || !authKey) {
      throw new Error(
        "Le client Auth Supabase n'est pas disponible — vérifiez SUPABASE_URL et SUPABASE_PUBLISHABLE_KEY (ou SUPABASE_ANON_KEY), ou SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY).",
      );
    }

    return createClient(url, authKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  private readSupabasePublishableKey(): string | undefined {
    return (
      this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY') ??
      this.configService.get<string>('SUPABASE_ANON_KEY')
    );
  }

  private readSupabaseSecretKey(): string | undefined {
    return (
      this.configService.get<string>('SUPABASE_SECRET_KEY') ??
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')
    );
  }
}
