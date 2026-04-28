import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MobilePushNotificationsService } from './mobile-push-notifications.service';

describe('MobilePushNotificationsService', () => {
  const getPlatformMock = vi.fn();

  beforeEach(() => {
    getPlatformMock.mockReset();
    vi.stubGlobal('Capacitor', {
      getPlatform: getPlatformMock,
    });
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('Given a non native platform, when initializing push notifications, then a stub token is returned', async () => {
    getPlatformMock.mockReturnValue('web');

    const service = TestBed.inject(MobilePushNotificationsService);
    const result = await service.initialize();

    expect(result.status).toBe('stub');
    expect(result.reason).toBe('non-native-platform');
    expect(result.token).toContain(
      'stub-mobile-token-local-non-native-platform',
    );
    expect(service.currentToken()).toBe(result.token);
  });

  it('Given a native platform and granted permission, when registration succeeds, then the FCM token is exposed', async () => {
    getPlatformMock.mockReturnValue('android');

    const service = TestBed.inject(MobilePushNotificationsService);
    const serviceForSpy = service as unknown as {
      resolveReceivePermission: () => Promise<'granted' | 'denied' | 'prompt'>;
      registerAndResolveToken: () => Promise<string>;
    };

    vi.spyOn(serviceForSpy, 'resolveReceivePermission').mockResolvedValue(
      'granted',
    );
    vi.spyOn(serviceForSpy, 'registerAndResolveToken').mockResolvedValue(
      'fcm-token-123',
    );

    const result = await service.initialize();

    expect(result.status).toBe('enabled');
    expect(result.reason).toBe('fcm-registration-ready');
    expect(result.token).toBe('fcm-token-123');
    expect(service.currentToken()).toBe('fcm-token-123');
  });
});
