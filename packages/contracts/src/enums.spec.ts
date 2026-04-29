import { describe, it, expect } from 'vitest';
import {
  UserRole,
  LifecycleStatus,
  PublicationStatus,
  ProgramVisibility,
  CohortStatus,
  SessionStatus,
  LocationType,
  ResourceType,
  AudienceType,
  EnrollmentStatus,
  NotificationType,
  NotificationChannel,
  SupportRequestStatus,
  SupportCategory,
} from './enums';

describe('Enums', () => {
  describe('UserRole', () => {
    it('devrait contenir les rôles participant, admin, trainer', () => {
      expect(UserRole.PARTICIPANT).toBe('participant');
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.TRAINER).toBe('trainer');
    });

    it('devrait avoir exactement 3 valeurs', () => {
      expect(Object.values(UserRole)).toHaveLength(3);
    });
  });

  describe('LifecycleStatus', () => {
    it('devrait contenir les statuts de cycle de vie', () => {
      expect(LifecycleStatus.INVITED).toBe('invited');
      expect(LifecycleStatus.REGISTERED).toBe('registered');
      expect(LifecycleStatus.ACTIVE).toBe('active');
      expect(LifecycleStatus.COMPLETED).toBe('completed');
      expect(LifecycleStatus.INACTIVE).toBe('inactive');
    });

    it('devrait avoir exactement 5 valeurs', () => {
      expect(Object.values(LifecycleStatus)).toHaveLength(5);
    });
  });

  describe('PublicationStatus', () => {
    it('devrait contenir draft, published, archived', () => {
      expect(PublicationStatus.DRAFT).toBe('draft');
      expect(PublicationStatus.PUBLISHED).toBe('published');
      expect(PublicationStatus.ARCHIVED).toBe('archived');
    });

    it('devrait avoir exactement 3 valeurs', () => {
      expect(Object.values(PublicationStatus)).toHaveLength(3);
    });
  });

  describe('ProgramVisibility', () => {
    it('devrait contenir private, participants, public', () => {
      expect(ProgramVisibility.PRIVATE).toBe('private');
      expect(ProgramVisibility.PARTICIPANTS).toBe('participants');
      expect(ProgramVisibility.PUBLIC).toBe('public');
    });

    it('devrait avoir exactement 3 valeurs', () => {
      expect(Object.values(ProgramVisibility)).toHaveLength(3);
    });
  });

  describe('CohortStatus', () => {
    it('devrait contenir les statuts de cohorte', () => {
      expect(CohortStatus.DRAFT).toBe('draft');
      expect(CohortStatus.OPEN).toBe('open');
      expect(CohortStatus.ACTIVE).toBe('active');
      expect(CohortStatus.COMPLETED).toBe('completed');
      expect(CohortStatus.ARCHIVED).toBe('archived');
    });

    it('devrait avoir exactement 5 valeurs', () => {
      expect(Object.values(CohortStatus)).toHaveLength(5);
    });
  });

  describe('SessionStatus', () => {
    it('devrait contenir les statuts de session', () => {
      expect(SessionStatus.SCHEDULED).toBe('scheduled');
      expect(SessionStatus.LIVE).toBe('live');
      expect(SessionStatus.COMPLETED).toBe('completed');
      expect(SessionStatus.CANCELLED).toBe('cancelled');
    });

    it('devrait avoir exactement 4 valeurs', () => {
      expect(Object.values(SessionStatus)).toHaveLength(4);
    });
  });

  describe('LocationType', () => {
    it('devrait contenir online, onsite, hybrid', () => {
      expect(LocationType.ONLINE).toBe('online');
      expect(LocationType.ONSITE).toBe('onsite');
      expect(LocationType.HYBRID).toBe('hybrid');
    });

    it('devrait avoir exactement 3 valeurs', () => {
      expect(Object.values(LocationType)).toHaveLength(3);
    });
  });

  describe('ResourceType', () => {
    it('devrait contenir les types de ressource', () => {
      expect(ResourceType.LINK).toBe('link');
      expect(ResourceType.FILE).toBe('file');
      expect(ResourceType.VIDEO).toBe('video');
      expect(ResourceType.DOCUMENT).toBe('document');
    });

    it('devrait avoir exactement 4 valeurs', () => {
      expect(Object.values(ResourceType)).toHaveLength(4);
    });
  });

  describe('AudienceType', () => {
    it("devrait contenir les types d'audience", () => {
      expect(AudienceType.ALL_PARTICIPANTS).toBe('all_participants');
      expect(AudienceType.PROGRAM).toBe('program');
      expect(AudienceType.COHORT).toBe('cohort');
      expect(AudienceType.CUSTOM).toBe('custom');
    });

    it('devrait avoir exactement 4 valeurs', () => {
      expect(Object.values(AudienceType)).toHaveLength(4);
    });
  });

  describe('EnrollmentStatus', () => {
    it("devrait contenir les statuts d'inscription", () => {
      expect(EnrollmentStatus.PENDING).toBe('pending');
      expect(EnrollmentStatus.ACTIVE).toBe('active');
      expect(EnrollmentStatus.COMPLETED).toBe('completed');
      expect(EnrollmentStatus.CANCELLED).toBe('cancelled');
    });

    it('devrait avoir exactement 4 valeurs', () => {
      expect(Object.values(EnrollmentStatus)).toHaveLength(4);
    });
  });

  describe('NotificationType', () => {
    it('devrait contenir les types de notification', () => {
      expect(NotificationType.ANNOUNCEMENT).toBe('announcement');
      expect(NotificationType.SESSION_REMINDER).toBe('session_reminder');
      expect(NotificationType.SYSTEM).toBe('system');
      expect(NotificationType.SUPPORT_UPDATE).toBe('support_update');
    });

    it('devrait avoir exactement 4 valeurs', () => {
      expect(Object.values(NotificationType)).toHaveLength(4);
    });
  });

  describe('NotificationChannel', () => {
    it('devrait contenir in_app, push', () => {
      expect(NotificationChannel.IN_APP).toBe('in_app');
      expect(NotificationChannel.PUSH).toBe('push');
    });

    it('devrait avoir exactement 2 valeurs', () => {
      expect(Object.values(NotificationChannel)).toHaveLength(2);
    });
  });

  describe('SupportRequestStatus', () => {
    it('devrait contenir les statuts de demande de support', () => {
      expect(SupportRequestStatus.OPEN).toBe('open');
      expect(SupportRequestStatus.IN_PROGRESS).toBe('in_progress');
      expect(SupportRequestStatus.RESOLVED).toBe('resolved');
      expect(SupportRequestStatus.CLOSED).toBe('closed');
    });

    it('devrait avoir exactement 4 valeurs', () => {
      expect(Object.values(SupportRequestStatus)).toHaveLength(4);
    });
  });

  describe('SupportCategory', () => {
    it('devrait contenir les catégories de support', () => {
      expect(SupportCategory.TECHNICAL).toBe('technical');
      expect(SupportCategory.PROGRAM).toBe('program');
      expect(SupportCategory.SESSION).toBe('session');
      expect(SupportCategory.BILLING).toBe('billing');
      expect(SupportCategory.OTHER).toBe('other');
    });

    it('devrait avoir exactement 5 valeurs', () => {
      expect(Object.values(SupportCategory)).toHaveLength(5);
    });
  });
});
