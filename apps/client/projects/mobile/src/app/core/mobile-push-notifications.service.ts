// apps\client\projects\mobile\src\app\core\mobile-push-notifications.service.ts

import { inject, Injectable, signal } from '@angular/core';
import {
  type ActionPerformed,
  type PushNotificationSchema,
  PushNotifications,
  type PermissionStatus,
  type Token,
} from '@capacitor/push-notifications';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

const FCM_REGISTRATION_TIMEOUT_MS = 5000;

export type PushInitializationStatus = 'enabled' | 'stub';

export interface PushInitializationResult {
  status: PushInitializationStatus;
  token: string;
  reason: string;
}

interface TokenResolutionResult {
  token: string;
  status: PushInitializationStatus;
  reason: string;
}

type AnnouncementPriority = 'high' | 'critical';

interface PriorityAnnouncementPush {
  announcementId: string;
  priority: AnnouncementPriority;
}

@Injectable({
  providedIn: 'root',
})
export class MobilePushNotificationsService {
  private readonly router = inject(Router, { optional: true });
  private readonly currentTokenState = signal<string | null>(null);
  private readonly currentStatusState =
    signal<PushInitializationStatus>('stub');
  private readonly currentReasonState = signal<string>('not-initialized');
  private readonly lastPriorityAnnouncementPushState =
    signal<PriorityAnnouncementPush | null>(null);
  private initializationPromise: Promise<PushInitializationResult> | null =
    null;

  readonly currentToken = this.currentTokenState.asReadonly();
  readonly currentStatus = this.currentStatusState.asReadonly();
  readonly currentReason = this.currentReasonState.asReadonly();
  readonly lastPriorityAnnouncementPush =
    this.lastPriorityAnnouncementPushState.asReadonly();

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

    try {
      const receivePermission = await this.resolveReceivePermission();

      if (receivePermission !== 'granted') {
        return this.applyStubState('permission-not-granted');
      }

      const registrationResult = await this.registerAndResolveToken();

      if (registrationResult.status === 'stub') {
        return this.applyStubState(registrationResult.reason);
      }

      return this.applyEnabledState(registrationResult.token);
    } catch {
      return this.applyStubState('initialization-error');
    }
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

  private async registerAndResolveToken(): Promise<TokenResolutionResult> {
    let resolveToken: ((value: TokenResolutionResult) => void) | null = null;
    const tokenPromise = new Promise<TokenResolutionResult>((resolve) => {
      resolveToken = resolve;
    });

    const registrationListener = await PushNotifications.addListener(
      'registration',
      (token: Token) => {
        resolveToken?.({
          token: token.value,
          status: 'enabled',
          reason: 'fcm-registration-ready',
        });
      },
    );
    const registrationErrorListener = await PushNotifications.addListener(
      'registrationError',
      () => {
        resolveToken?.({
          token: this.buildStubToken('registration-error'),
          status: 'stub',
          reason: 'registration-error',
        });
      },
    );
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        this.handlePriorityAnnouncementPush(notification.data);
      },
    );
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        this.handlePriorityAnnouncementAction(action);
      },
    );

    try {
      await PushNotifications.register();

      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      const timeoutFallbackToken = new Promise<TokenResolutionResult>(
        (resolve) => {
          timeoutHandle = setTimeout(() => {
            resolve({
              token: this.buildStubToken('registration-timeout'),
              status: 'stub',
              reason: 'registration-timeout',
            });
          }, FCM_REGISTRATION_TIMEOUT_MS);
        },
      );

      const registrationResult = await Promise.race([
        tokenPromise,
        timeoutFallbackToken,
      ]);

      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }

      return registrationResult;
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

  private handlePriorityAnnouncementAction(action: ActionPerformed): void {
    const matchedPush = this.resolvePriorityAnnouncementPush(
      action.notification.data,
    );

    if (matchedPush === null) {
      return;
    }

    this.lastPriorityAnnouncementPushState.set(matchedPush);
    const navigationPromise = this.router?.navigateByUrl(
      `/tabs/annonces/${encodeURIComponent(matchedPush.announcementId)}`,
    );

    void navigationPromise?.catch((error) => {
      console.warn('Mobile push notification navigation failed.', {
        error,
        target: '/tabs/annonces/:announcementId',
      });
    });
  }

  private handlePriorityAnnouncementPush(data: unknown): void {
    const matchedPush = this.resolvePriorityAnnouncementPush(data);

    if (matchedPush !== null) {
      this.lastPriorityAnnouncementPushState.set(matchedPush);
    }
  }

  private resolvePriorityAnnouncementPush(
    data: unknown,
  ): PriorityAnnouncementPush | null {
    if (data === null || typeof data !== 'object') {
      return null;
    }

    let rawAnnouncementId: unknown;
    if ('announcementId' in data) {
      rawAnnouncementId = data.announcementId;
    } else if ('announcement_id' in data) {
      rawAnnouncementId = data.announcement_id;
    }

    const rawPriority = 'priority' in data ? data.priority : undefined;

    if (typeof rawAnnouncementId !== 'string') {
      return null;
    }

    if (rawPriority !== 'high' && rawPriority !== 'critical') {
      return null;
    }

    const announcementId = rawAnnouncementId.trim();
    if (announcementId.length === 0) {
      return null;
    }

    return {
      announcementId,
      priority: rawPriority,
    };
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

    void pushNotificationsService.initialize().catch((error) => {
      console.warn(
        'Mobile push notifications initialization failed during app bootstrap.',
        error,
      );
    });
  };
}
