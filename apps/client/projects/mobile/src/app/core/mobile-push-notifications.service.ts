import { inject, Injectable, signal } from '@angular/core';
import {
  PushNotifications,
  type PermissionStatus,
  type Token,
} from '@capacitor/push-notifications';
import { environment } from '../../environments/environment';

const FCM_REGISTRATION_TIMEOUT_MS = 5000;

export type PushInitializationStatus = 'enabled' | 'stub';

export interface PushInitializationResult {
  status: PushInitializationStatus;
  token: string;
  reason: string;
}

@Injectable({
  providedIn: 'root',
})
export class MobilePushNotificationsService {
  private readonly currentTokenState = signal<string | null>(null);
  private readonly currentStatusState =
    signal<PushInitializationStatus>('stub');
  private readonly currentReasonState = signal<string>('not-initialized');
  private initializationPromise: Promise<PushInitializationResult> | null =
    null;

  readonly currentToken = this.currentTokenState.asReadonly();
  readonly currentStatus = this.currentStatusState.asReadonly();
  readonly currentReason = this.currentReasonState.asReadonly();

  initialize(): Promise<PushInitializationResult> {
    this.initializationPromise ??= this.initializeInternal();
    return this.initializationPromise;
  }

  private async initializeInternal(): Promise<PushInitializationResult> {
    if (!environment.pushNotificationsEnabled) {
      return this.applyStubState('disabled-in-environment');
    }

    if (this.resolveCapacitorPlatform() === 'web') {
      return this.applyStubState('non-native-platform');
    }

    const receivePermission = await this.resolveReceivePermission();

    if (receivePermission !== 'granted') {
      return this.applyStubState('permission-not-granted');
    }

    const token = await this.registerAndResolveToken();
    return this.applyEnabledState(token);
  }

  private async resolveReceivePermission(): Promise<
    PermissionStatus['receive']
  > {
    const permission = await PushNotifications.checkPermissions();

    if (permission.receive !== 'prompt') {
      return permission.receive;
    }

    const requestedPermission = await PushNotifications.requestPermissions();
    return requestedPermission.receive;
  }

  private async registerAndResolveToken(): Promise<string> {
    let resolveToken: ((value: string) => void) | null = null;
    const tokenPromise = new Promise<string>((resolve) => {
      resolveToken = resolve;
    });

    const registrationListener = await PushNotifications.addListener(
      'registration',
      (token: Token) => {
        resolveToken?.(token.value);
      },
    );
    const registrationErrorListener = await PushNotifications.addListener(
      'registrationError',
      () => {
        resolveToken?.(this.buildStubToken('registration-error'));
      },
    );
    await PushNotifications.addListener(
      'pushNotificationReceived',
      () => undefined,
    );
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      () => undefined,
    );

    try {
      await PushNotifications.register();

      const timeoutFallbackToken = new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve(this.buildStubToken('registration-timeout'));
        }, FCM_REGISTRATION_TIMEOUT_MS);
      });

      return await Promise.race([tokenPromise, timeoutFallbackToken]);
    } finally {
      await registrationListener.remove();
      await registrationErrorListener.remove();
    }
  }

  private applyEnabledState(token: string): PushInitializationResult {
    this.currentTokenState.set(token);
    this.currentStatusState.set('enabled');
    this.currentReasonState.set('fcm-registration-ready');

    return {
      status: 'enabled',
      token,
      reason: 'fcm-registration-ready',
    };
  }

  private applyStubState(reason: string): PushInitializationResult {
    const token = this.buildStubToken(reason);

    this.currentTokenState.set(token);
    this.currentStatusState.set('stub');
    this.currentReasonState.set(reason);

    return {
      status: 'stub',
      token,
      reason,
    };
  }

  private buildStubToken(reason: string): string {
    return `stub-mobile-token-${environment.environmentName}-${reason}`;
  }

  private resolveCapacitorPlatform(): string {
    const platform =
      (
        globalThis as {
          Capacitor?: {
            getPlatform?: () => string;
          };
        }
      ).Capacitor?.getPlatform?.() ?? 'web';

    return platform;
  }
}

export function provideMobilePushNotificationsInitialization(): () => Promise<void> {
  return async () => {
    const pushNotificationsService = inject(MobilePushNotificationsService);

    await pushNotificationsService.initialize();
  };
}
