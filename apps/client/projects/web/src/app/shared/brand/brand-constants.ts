export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}

export const HERO_BACKGROUND_STYLE = {
  background:
    "linear-gradient(0deg, color-mix(in srgb, var(--p-surface-950) 50%, transparent) 0%, transparent 100%), linear-gradient(0deg, var(--p-primary-500) 0%, var(--p-primary-500) 100%), linear-gradient(0deg, color-mix(in srgb, var(--p-primary-800) 60%, transparent) 0%, color-mix(in srgb, var(--p-primary-800) 60%, transparent) 100%), url('https://fqjltiegiezfetthbags.supabase.co/storage/v1/render/image/public/block.images/blocks/hero/bw-hero-bg.jpg') center/cover no-repeat",
  backgroundBlendMode: 'normal, multiply, lighten, normal',
} as const;

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
    href: 'https://wa.me/2250502741818',
    icon: 'pi-whatsapp',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@kraakconsulting',
    icon: 'pi-tiktok',
  },
] as const;
