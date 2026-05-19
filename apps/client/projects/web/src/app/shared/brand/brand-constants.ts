export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}

export const KRAAK_PUBLIC_ASSET_BASE_URL =
  'https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images';

export const KRAAK_AVATAR_CIRCLE_BASE_URL = `${KRAAK_PUBLIC_ASSET_BASE_URL}/blocks/avatars/circle`;

export function buildAvatarCircleUrl(fileName: string): string {
  return `${KRAAK_AVATAR_CIRCLE_BASE_URL}/${fileName}`;
}

export const HERO_BACKGROUND_IMAGE_URL = `${KRAAK_PUBLIC_ASSET_BASE_URL}/blocks/hero/bw-hero-bg.jpg`;

export const CONTACT_VISUAL_URL = `${KRAAK_PUBLIC_ASSET_BASE_URL}/blocks/contact/map-4.jpg`;

export const FAQ_BACKGROUND_IMAGE_URL = `${KRAAK_PUBLIC_ASSET_BASE_URL}/blocks/faq/glassmorphic-accordion-bg.jpg`;

export const CONTACT_PHONE_E164 = '+2250502741818';
export const CONTACT_PHONE_DISPLAY = '+225 05 02 74 18 18';
export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE_E164}`;
export const WHATSAPP_CONTACT_HREF = 'https://wa.me/2250502741818';

export function buildHeroBackgroundStyle(imageUrl: string) {
  return {
    background: `linear-gradient(0deg, color-mix(in srgb, var(--p-surface-950) 50%, transparent) 0%, transparent 100%), linear-gradient(0deg, var(--p-primary-500) 0%, var(--p-primary-500) 100%), linear-gradient(0deg, color-mix(in srgb, var(--p-primary-800) 60%, transparent) 0%, color-mix(in srgb, var(--p-primary-800) 60%, transparent) 100%), url('${imageUrl}') center/cover no-repeat`,
    backgroundBlendMode: 'normal, multiply, lighten, normal',
  } as const;
}

export const HERO_BACKGROUND_STYLE = buildHeroBackgroundStyle(
  HERO_BACKGROUND_IMAGE_URL,
);

export const KRAAK_SOCIAL_LINKS: readonly SocialLink[] = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/kraakconsulting/',
    icon: 'pi-facebook',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/kraakconsulting/',
    icon: 'pi-instagram',
  },
  {
    label: 'WhatsApp',
    href: WHATSAPP_CONTACT_HREF,
    icon: 'pi-whatsapp',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@kraakconsulting',
    icon: 'pi-tiktok',
  },
] as const;

export const CONTACT_EMAIL = 'kraakconsulting@gmail.com';
