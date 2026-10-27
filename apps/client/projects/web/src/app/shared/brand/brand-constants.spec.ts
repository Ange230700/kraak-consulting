import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('brand constants', () => {
  beforeEach(() => {
    Reflect.deleteProperty(globalThis, '__KRAAK_RUNTIME_CONFIG__');
    vi.resetModules();
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, '__KRAAK_RUNTIME_CONFIG__');
    vi.resetModules();
  });

  it('Given runtime brand URLs, when the constants module loads, then it uses the runtime values', async () => {
    globalThis.__KRAAK_RUNTIME_CONFIG__ = {
      publicAssetBaseUrl: 'https://cdn.kraak.example/assets',
      contactPhoneE164: '+225000000001',
      contactPhoneDisplay: '+225 00 00 00 00 01',
      contactEmail: 'contact@kraak.example',
      whatsappContactHref: 'https://wa.me/225000000001',
      facebookUrl: 'https://www.facebook.com/kraak.example',
      instagramUrl: 'https://www.instagram.com/kraak.example',
      tiktokUrl: 'https://www.tiktok.com/@kraak.example',
    };

    const brandConstants = await import('./brand-constants');

    expect(brandConstants.KRAAK_PUBLIC_ASSET_BASE_URL).toBe(
      'https://cdn.kraak.example/assets',
    );
    expect(brandConstants.KRAAK_AVATAR_CIRCLE_BASE_URL).toBe(
      'https://cdn.kraak.example/assets/blocks/avatars/circle',
    );
    expect(brandConstants.CONTACT_PHONE_E164).toBe('+225000000001');
    expect(brandConstants.CONTACT_PHONE_DISPLAY).toBe('+225 00 00 00 00 01');
    expect(brandConstants.WHATSAPP_CONTACT_HREF).toBe(
      'https://wa.me/225000000001',
    );
    expect(brandConstants.CONTACT_EMAIL).toBe('contact@kraak.example');
    expect(brandConstants.KRAAK_SOCIAL_LINKS).toEqual([
      {
        label: 'Facebook',
        href: 'https://www.facebook.com/kraak.example',
        icon: 'pi-facebook',
      },
      {
        label: 'Instagram',
        href: 'https://www.instagram.com/kraak.example',
        icon: 'pi-instagram',
      },
      {
        label: 'WhatsApp',
        href: 'https://wa.me/225000000001',
        icon: 'pi-whatsapp',
      },
      {
        label: 'TikTok',
        href: 'https://www.tiktok.com/@kraak.example',
        icon: 'pi-tiktok',
      },
    ]);
  });
});
