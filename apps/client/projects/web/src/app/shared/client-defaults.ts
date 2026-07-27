// apps\client\projects\web\src\app\shared\client-defaults.ts

interface ClientDefaults {
  siteUrl: string;
  siteName: string;
  locale: string;
  robots: string;
  publicAssetBaseUrl: string;
  contactPhoneE164: string;
  contactPhoneDisplay: string;
  contactEmail: string;
  whatsappContactHref: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
}

type DefaultsProfile = 'local' | 'staging' | 'production';

const runtimeGlobals = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

function readEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = runtimeGlobals.process?.env?.[key]?.trim();
    if (value) {
      return value;
    }
  }

  return '';
}

function resolveDefaultsProfile(): DefaultsProfile {
  const profile = readEnv(
    'KRAAK_DEFAULTS_PROFILE',
    'CLIENT_RUNTIME_ENV',
    'NODE_ENV',
  ).toLowerCase();

  if (profile === 'local' || profile === 'development' || profile === 'dev') {
    return 'local';
  }

  if (profile === 'staging' || profile === 'stage') {
    return 'staging';
  }

  // Fallback production pour éviter toute régression sur les builds publics.
  return 'production';
}

const BASE_DEFAULTS: Omit<ClientDefaults, 'siteUrl'> = {
  siteName: 'KRAAK',
  locale: 'fr_CI',
  robots: 'index, follow',
  publicAssetBaseUrl:
    'https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images',
  contactPhoneE164: '+2250502741818',
  contactPhoneDisplay: '+225 05 02 74 18 18',
  contactEmail: 'kraakconsulting@gmail.com',
  whatsappContactHref: 'https://wa.me/2250502741818',
  facebookUrl: 'https://www.facebook.com/kraakconsulting/',
  instagramUrl: 'https://www.instagram.com/kraakconsulting/',
  tiktokUrl: 'https://www.tiktok.com/@kraakconsulting',
};

const DEFAULTS_BY_PROFILE: Record<DefaultsProfile, ClientDefaults> = {
  local: {
    ...BASE_DEFAULTS,
    siteUrl: 'http://localhost:4200',
  },
  staging: {
    ...BASE_DEFAULTS,
    siteUrl: 'https://kraak-web-staging.onrender.com',
  },
  production: {
    ...BASE_DEFAULTS,
    siteUrl: 'https://kraak-web-prod.onrender.com',
  },
};

export const CLIENT_DEFAULTS = DEFAULTS_BY_PROFILE[resolveDefaultsProfile()];
