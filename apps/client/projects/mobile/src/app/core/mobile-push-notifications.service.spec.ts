// apps\client\projects\mobile\src\app\core\mobile-push-notifications.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pushNotificationsMock = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  addListener: vi.fn(),
  register: vi.fn(),
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: pushNotificationsMock,
}));

import { environment } from '../../environments/environment';
import {
  MobilePushNotificationsService,
  provideMobilePushNotificationsInitialization,
} from './mobile-push-notifications.service';

describe('MobilePushNotificationsService', () => {
  const getPlatformMock = vi.fn();
  const originalPushNotificationsEnabled = environment.pushNotificationsEnabled;

  beforeEach(() => {
    getPlatformMock.mockReset();

    vi.stubGlobal('Capacitor', {
      getPlatform: getPlatformMock,
    });

    environment.pushNotificationsEnabled = true;

    pushNotificationsMock.checkPermissions.mockReset();
    pushNotificationsMock.requestPermissions.mockReset();
    pushNotificationsMock.addListener.mockReset();
    pushNotificationsMock.register.mockReset();

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    environment.pushNotificationsEnabled = originalPushNotificationsEnabled;

    vi.useRealTimers();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  const mockPushListeners = () => {
    const listeners = new Map<string, (...args: unknown[]) => void>();
    const removers = new Map<string, ReturnType<typeof vi.fn>>();

    pushNotificationsMock.addListener.mockImplementation(
      async (eventName: string, callback: (...args: unknown[]) => void) => {
        listeners.set(eventName, callback);

        const remove = vi.fn().mockResolvedValue(undefined);
        removers.set(eventName, remove);

        return { remove };
      },
    );

    return { listeners, removers };
  };

  it('Given push notifications are disabled in the environment, when initializing, then a disabled stub token is returned', async () => {
    environment.pushNotificationsEnabled = false;
    getPlatformMock.mockReturnValue('android');

    const service = TestBed.inject(MobilePushNotificationsService);
    const result = await service.initialize();

    expect(result.status).toBe('stub');
    expect(result.reason).toBe('disabled-in-environment');
    expect(result.token).toBe(
      'stub-mobile-token-local-disabled-in-environment',
    );

    expect(service.currentToken()).toBe(result.token);
    expect(service.currentStatus()).toBe('stub');
    expect(service.currentReason()).toBe('disabled-in-environment');

    expect(getPlatformMock).not.toHaveBeenCalled();
    expect(pushNotificationsMock.checkPermissions).not.toHaveBeenCalled();
  });

  it('Given no Capacitor global exists, when initializing, then a non native platform stub token is returned', async () => {
    vi.unstubAllGlobals();

    const service = TestBed.inject(MobilePushNotificationsService);
    const result = await service.initialize();

    expect(result.status).toBe('stub');
    expect(result.reason).toBe('non-native-platform');
    expect(result.token).toBe('stub-mobile-token-local-non-native-platform');

    expect(service.currentToken()).toBe(result.token);
    expect(service.currentStatus()).toBe('stub');
    expect(service.currentReason()).toBe('non-native-platform');
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
    expect(service.currentStatus()).toBe('stub');
    expect(service.currentReason()).toBe('non-native-platform');
  });

  it('Given a native platform and denied permission, when initializing, then a permission stub token is returned', async () => {
    getPlatformMock.mockReturnValue('android');
    pushNotificationsMock.checkPermissions.mockResolvedValue({
      receive: 'denied',
    });

    const service = TestBed.inject(MobilePushNotificationsService);
    const result = await service.initialize();

    expect(result.status).toBe('stub');
    expect(result.reason).toBe('permission-not-granted');
    expect(result.token).toBe('stub-mobile-token-local-permission-not-granted');

    expect(pushNotificationsMock.checkPermissions).toHaveBeenCalledOnce();
    expect(pushNotificationsMock.requestPermissions).not.toHaveBeenCalled();
    expect(pushNotificationsMock.register).not.toHaveBeenCalled();

    expect(service.currentToken()).toBe(result.token);
    expect(service.currentStatus()).toBe('stub');
    expect(service.currentReason()).toBe('permission-not-granted');
  });

  it('Given a native platform and prompted permission is denied, when initializing, then a permission stub token is returned', async () => {
    getPlatformMock.mockReturnValue('ios');

    pushNotificationsMock.checkPermissions.mockResolvedValue({
      receive: 'prompt',
    });
    pushNotificationsMock.requestPermissions.mockResolvedValue({
      receive: 'denied',
    });

    const service = TestBed.inject(MobilePushNotificationsService);
    const result = await service.initialize();

    expect(result.status).toBe('stub');
    expect(result.reason).toBe('permission-not-granted');
    expect(result.token).toBe('stub-mobile-token-local-permission-not-granted');

    expect(pushNotificationsMock.checkPermissions).toHaveBeenCalledOnce();
    expect(pushNotificationsMock.requestPermissions).toHaveBeenCalledOnce();
    expect(pushNotificationsMock.register).not.toHaveBeenCalled();
  });

  it('Given a native platform and granted permission, when registration succeeds, then the FCM token is exposed', async () => {
    getPlatformMock.mockReturnValue('android');

    pushNotificationsMock.checkPermissions.mockResolvedValue({
      receive: 'granted',
    });

    const { listeners, removers } = mockPushListeners();

    pushNotificationsMock.register.mockImplementation(async () => {
      listeners.get('registration')?.({
        value: 'fcm-token-123',
      });
    });

    const service = TestBed.inject(MobilePushNotificationsService);
    const result = await service.initialize();

    expect(result.status).toBe('enabled');
    expect(result.reason).toBe('fcm-registration-ready');
    expect(result.token).toBe('fcm-token-123');

    expect(pushNotificationsMock.addListener).toHaveBeenCalledWith(
      'registration',
      expect.any(Function),
    );
    expect(pushNotificationsMock.addListener).toHaveBeenCalledWith(
      'registrationError',
      expect.any(Function),
    );
    expect(pushNotificationsMock.addListener).toHaveBeenCalledWith(
      'pushNotificationReceived',
      expect.any(Function),
    );
    expect(pushNotificationsMock.addListener).toHaveBeenCalledWith(
      'pushNotificationActionPerformed',
      expect.any(Function),
    );
    expect(pushNotificationsMock.register).toHaveBeenCalledOnce();

    expect(removers.get('registration')).toHaveBeenCalledOnce();
    expect(removers.get('registrationError')).toHaveBeenCalledOnce();

    expect(service.currentToken()).toBe('fcm-token-123');
    expect(service.currentStatus()).toBe('enabled');
    expect(service.currentReason()).toBe('fcm-registration-ready');
  });

  it('Given permission is prompted then granted, when registration succeeds, then the FCM token is exposed', async () => {
    getPlatformMock.mockReturnValue('ios');

    pushNotificationsMock.checkPermissions.mockResolvedValue({
      receive: 'prompt',
    });
    pushNotificationsMock.requestPermissions.mockResolvedValue({
      receive: 'granted',
    });

    const { listeners } = mockPushListeners();

    pushNotificationsMock.register.mockImplementation(async () => {
      listeners.get('registration')?.({
        value: 'prompt-granted-token',
      });
    });

    const service = TestBed.inject(MobilePushNotificationsService);
    const result = await service.initialize();

    expect(result.status).toBe('enabled');
    expect(result.reason).toBe('fcm-registration-ready');
    expect(result.token).toBe('prompt-granted-token');

    expect(pushNotificationsMock.checkPermissions).toHaveBeenCalledOnce();
    expect(pushNotificationsMock.requestPermissions).toHaveBeenCalledOnce();
    expect(pushNotificationsMock.register).toHaveBeenCalledOnce();
  });

  it('Given registration emits an error, when initializing, then a registration error fallback token is exposed', async () => {
    getPlatformMock.mockReturnValue('android');

    pushNotificationsMock.checkPermissions.mockResolvedValue({
      receive: 'granted',
    });

    const { listeners, removers } = mockPushListeners();

    pushNotificationsMock.register.mockImplementation(async () => {
      listeners.get('registrationError')?.();
    });

    const service = TestBed.inject(MobilePushNotificationsService);
    const result = await service.initialize();

    expect(result.status).toBe('enabled');
    expect(result.reason).toBe('fcm-registration-ready');
    expect(result.token).toBe('stub-mobile-token-local-registration-error');

    expect(removers.get('registration')).toHaveBeenCalledOnce();
    expect(removers.get('registrationError')).toHaveBeenCalledOnce();

    expect(service.currentToken()).toBe(
      'stub-mobile-token-local-registration-error',
    );
  });

  it('Given registration does not emit a token, when the timeout is reached, then a timeout fallback token is exposed', async () => {
    vi.useFakeTimers();

    getPlatformMock.mockReturnValue('android');

    pushNotificationsMock.checkPermissions.mockResolvedValue({
      receive: 'granted',
    });

    const { removers } = mockPushListeners();

    pushNotificationsMock.register.mockResolvedValue(undefined);

    const service = TestBed.inject(MobilePushNotificationsService);
    const initializationPromise = service.initialize();

    await vi.runAllTimersAsync();

    const result = await initializationPromise;

    expect(result.status).toBe('enabled');
    expect(result.reason).toBe('fcm-registration-ready');
    expect(result.token).toBe('stub-mobile-token-local-registration-timeout');

    expect(removers.get('registration')).toHaveBeenCalledOnce();
    expect(removers.get('registrationError')).toHaveBeenCalledOnce();
  });

  it('Given initialize is called more than once, when the first initialization is pending, then the same initialization result is reused', async () => {
    getPlatformMock.mockReturnValue('android');

    const service = TestBed.inject(MobilePushNotificationsService);
    const serviceForSpy = service as unknown as {
      resolveReceivePermission: () => Promise<'granted' | 'denied' | 'prompt'>;
      registerAndResolveToken: () => Promise<
        | { status: 'enabled'; token: string; reason: 'fcm-registration-ready' }
        | {
            status: 'stub';
            token: string;
            reason: 'registration-error' | 'registration-timeout';
          }
      >;
    };

    const resolveReceivePermissionSpy = vi
      .spyOn(serviceForSpy, 'resolveReceivePermission')
      .mockResolvedValue('granted');

    const registerAndResolveTokenSpy = vi
      .spyOn(serviceForSpy, 'registerAndResolveToken')
      .mockResolvedValue('memoized-token');

    const [firstResult, secondResult] = await Promise.all([
      service.initialize(),
      service.initialize(),
    ]);

    expect(firstResult).toEqual(secondResult);
    expect(firstResult.token).toBe('memoized-token');

    expect(resolveReceivePermissionSpy).toHaveBeenCalledOnce();
    expect(registerAndResolveTokenSpy).toHaveBeenCalledOnce();
  });

  it('Given the initialization provider is executed, when Angular injection context is available, then the service is initialized', async () => {
    const service = TestBed.inject(MobilePushNotificationsService);

    const initializeSpy = vi.spyOn(service, 'initialize').mockResolvedValue({
      status: 'stub',
      token: 'provider-token',
      reason: 'provider-test',
    });

    const initializer = provideMobilePushNotificationsInitialization();

    await TestBed.runInInjectionContext(initializer);

    expect(initializeSpy).toHaveBeenCalledOnce();
  });
});
