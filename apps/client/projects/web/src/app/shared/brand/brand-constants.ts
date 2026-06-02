export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}

import { resolveRuntimeClientConfig } from '../../../../../shared/runtime-client-config';
import { CLIENT_DEFAULTS } from '../client-defaults';

const runtimeClientConfig = resolveRuntimeClientConfig();

export const KRAAK_PUBLIC_ASSET_BASE_URL =
  runtimeClientConfig.publicAssetBaseUrl || CLIENT_DEFAULTS.publicAssetBaseUrl;

export const KRAAK_AVATAR_CIRCLE_BASE_URL = `${KRAAK_PUBLIC_ASSET_BASE_URL}/blocks/avatars/circle`;

export function buildAvatarCircleUrl(fileName: string): string {
  return `${KRAAK_AVATAR_CIRCLE_BASE_URL}/${fileName}`;
}

export const HERO_BACKGROUND_IMAGE_URL = `${KRAAK_PUBLIC_ASSET_BASE_URL}/blocks/hero/bw-hero-bg.jpg`;

export const CONTACT_VISUAL_URL = `${KRAAK_PUBLIC_ASSET_BASE_URL}/blocks/contact/map-4.jpg`;

export const FAQ_BACKGROUND_IMAGE_URL = `${KRAAK_PUBLIC_ASSET_BASE_URL}/blocks/faq/glassmorphic-accordion-bg.jpg`;

export const CONTACT_PHONE_E164 =
  runtimeClientConfig.contactPhoneE164 || CLIENT_DEFAULTS.contactPhoneE164;
export const CONTACT_PHONE_DISPLAY =
  runtimeClientConfig.contactPhoneDisplay ||
  CLIENT_DEFAULTS.contactPhoneDisplay;
export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE_E164}`;
export const WHATSAPP_CONTACT_HREF =
  runtimeClientConfig.whatsappContactHref ||
  CLIENT_DEFAULTS.whatsappContactHref;

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
    href: runtimeClientConfig.facebookUrl || CLIENT_DEFAULTS.facebookUrl,
    icon: 'pi-facebook',
  },
  {
    label: 'Instagram',
    href: runtimeClientConfig.instagramUrl || CLIENT_DEFAULTS.instagramUrl,
    icon: 'pi-instagram',
  },
  {
    label: 'WhatsApp',
    href: WHATSAPP_CONTACT_HREF,
    icon: 'pi-whatsapp',
  },
  {
    label: 'TikTok',
    href: runtimeClientConfig.tiktokUrl || CLIENT_DEFAULTS.tiktokUrl,
    icon: 'pi-tiktok',
  },
] as const;

export const CONTACT_EMAIL =
  runtimeClientConfig.contactEmail || CLIENT_DEFAULTS.contactEmail;
