import { describe, it, expect } from 'vitest';
import * as schemasModule from './schemas';
import {
  ContactFormSchema,
  ContactSubmissionResultSchema,
  ArticleSchema,
  AuthProfileSchema,
  AuthSessionBundleSchema,
  AuthSessionContextSchema,
  AuthSessionTokensSchema,
  AuthorSchema,
  CategorySchema,
  PasswordResetRequestSchema,
  PasswordResetResponseSchema,
  RefreshSessionRequestSchema,
  SignInRequestSchema,
  SignUpRequestSchema,
  SignUpResponseSchema,
  CreateArticleSchema,
  CreateAuthorSchema,
  CreateCategorySchema,
  CreateAppUserSchema,
  CreateParticipantSchema,
  CreateProgramSchema,
  CreateCohortSchema,
  CreateSessionSchema,
  CreateResourceSchema,
  CreateAnnouncementSchema,
  CreateEnrollmentSchema,
  CreateNotificationSchema,
  CreateSupportRequestSchema,
  CreateTagSchema,
  TagSchema,
  UpdateAppUserSchema,
  UpdateArticleSchema,
  UpdateAuthorSchema,
  UpdateCategorySchema,
  UpdateParticipantSchema,
  UpdateProgramSchema,
  UpdateCohortSchema,
  UpdateSessionSchema,
  UpdateResourceSchema,
  UpdateAnnouncementSchema,
  UpdateEnrollmentSchema,
  UpdateTagSchema,
  UpdateSupportRequestSchema,
  AppUserSchema,
  ParticipantSchema,
  ProgramSchema,
  CohortSchema,
  SessionSchema,
  ResourceSchema,
  AnnouncementSchema,
  EnrollmentSchema,
  NotificationSchema,
  SupportRequestSchema,
} from './schemas';

// ---------------------------------------------------------------------------
// Module resolution smoke test
// ---------------------------------------------------------------------------
describe('schemas module', () => {
  it('should be importable at runtime', () => {
    expect(schemasModule).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------
describe('ContactFormSchema', () => {
  const valid = {
    name: 'Alice Dupont',
    email: 'alice@exemple.com',
    subject: 'Demande de renseignements',
    message: 'Bonjour, je souhaite en savoir plus sur vos services.',
  };

  it('should accept valid public contact data and default category to other', () => {
    const result = ContactFormSchema.safeParse(valid);

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error('Expected ContactFormSchema to accept valid data.');
    }

    expect(result.data.category).toBe('other');
  });

  it('should trim textual fields before returning parsed data', () => {
    const result = ContactFormSchema.safeParse({
      ...valid,
      name: '  Alice Dupont  ',
      subject: '  Demande de renseignements  ',
      message: '  Bonjour, je souhaite en savoir plus sur vos services.  ',
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error('Expected ContactFormSchema to trim valid data.');
    }

    expect(result.data.name).toBe('Alice Dupont');
    expect(result.data.subject).toBe('Demande de renseignements');
    expect(result.data.message).toBe(
      'Bonjour, je souhaite en savoir plus sur vos services.',
    );
  });

  it('should accept public operational contact categories', () => {
    for (const category of [
      'training',
      'project_management',
      'immigration',
      'business',
      'partnership',
    ]) {
      expect(ContactFormSchema.safeParse({ ...valid, category }).success).toBe(
        true,
      );
    }
  });

  it('should reject malformed email addresses', () => {
    expect(
      ContactFormSchema.safeParse({ ...valid, email: 'not-an-email' }).success,
    ).toBe(false);
  });
});

describe('ContactSubmissionResultSchema', () => {
  it('should accept a minimal success acknowledgement payload', () => {
    expect(
      ContactSubmissionResultSchema.safeParse({
        success: true,
        message: 'Votre message a bien été reçu.',
      }).success,
    ).toBe(true);
  });

  it('should accept an authenticated support tracking acknowledgement payload', () => {
    expect(
      ContactSubmissionResultSchema.safeParse({
        success: true,
        message: 'Votre demande a bien été enregistrée.',
        requestId: 'req-1',
        requestStatus: 'open',
      }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Auth / Session
// ---------------------------------------------------------------------------
describe('SignInRequestSchema', () => {
  const valid = {
    email: 'alice@example.com',
    password: 'motdepasse-securise',
  };

  it('should accept valid credentials', () => {
    expect(SignInRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject a short password', () => {
    expect(
      SignInRequestSchema.safeParse({ ...valid, password: 'court' }).success,
    ).toBe(false);
  });
});

describe('SignUpRequestSchema', () => {
  const valid = {
    email: 'alice@example.com',
    password: 'motdepasse-securise',
    firstName: 'Alice',
    lastName: 'Dupont',
    phone: null,
    preferredContactChannel: null,
    redirectTo: 'kraak://auth/callback',
  };

  it('should accept a participant signup payload', () => {
    expect(SignUpRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('should trim textual fields', () => {
    const result = SignUpRequestSchema.safeParse({
      ...valid,
      firstName: '  Alice  ',
      lastName: '  Dupont  ',
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error('Expected SignUpRequestSchema to trim valid data.');
    }

    expect(result.data.firstName).toBe('Alice');
    expect(result.data.lastName).toBe('Dupont');
  });

  it('should reject an invalid redirect target', () => {
    expect(
      SignUpRequestSchema.safeParse({ ...valid, redirectTo: 'pas-un-lien' })
        .success,
    ).toBe(false);
  });
});

describe('RefreshSessionRequestSchema', () => {
  it('should accept a refresh token payload', () => {
    expect(
      RefreshSessionRequestSchema.safeParse({ refreshToken: 'refresh-token' })
        .success,
    ).toBe(true);
  });
});

describe('PasswordResetRequestSchema', () => {
  it('should accept an email with redirect target', () => {
    expect(
      PasswordResetRequestSchema.safeParse({
        email: 'alice@example.com',
        redirectTo: 'http://localhost:4300/auth/reset',
      }).success,
    ).toBe(true);
  });

  it('should reject an invalid email', () => {
    expect(
      PasswordResetRequestSchema.safeParse({
        email: 'alice',
        redirectTo: 'http://localhost:4300/auth/reset',
      }).success,
    ).toBe(false);
  });
});

describe('AuthSessionTokensSchema', () => {
  it('should accept a normalized token bundle', () => {
    expect(
      AuthSessionTokensSchema.safeParse({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        expiresAt: '2026-04-14T12:00:00.000Z',
        tokenType: 'bearer',
      }).success,
    ).toBe(true);
  });
});

describe('AuthProfileSchema', () => {
  it('should accept a profile with app user and optional participant', () => {
    expect(
      AuthProfileSchema.safeParse({
        appUser: {
          id: 'user-1',
          email: 'alice@example.com',
          role: 'participant',
          firstName: 'Alice',
          lastName: 'Dupont',
          phone: null,
          preferredContactChannel: null,
          isActive: true,
          createdAt: '2026-04-14T12:00:00.000Z',
          updatedAt: '2026-04-14T12:00:00.000Z',
        },
        participant: null,
      }).success,
    ).toBe(true);
  });
});

describe('AuthSessionBundleSchema', () => {
  it('should accept session tokens plus profile', () => {
    expect(
      AuthSessionBundleSchema.safeParse({
        session: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          expiresAt: '2026-04-14T12:00:00.000Z',
          tokenType: 'bearer',
        },
        profile: {
          appUser: {
            id: 'user-1',
            email: 'alice@example.com',
            role: 'participant',
            firstName: 'Alice',
            lastName: 'Dupont',
            phone: null,
            preferredContactChannel: null,
            isActive: true,
            createdAt: '2026-04-14T12:00:00.000Z',
            updatedAt: '2026-04-14T12:00:00.000Z',
          },
          participant: null,
        },
      }).success,
    ).toBe(true);
  });
});

describe('SignUpResponseSchema', () => {
  it('should accept a pending-confirmation signup response', () => {
    expect(
      SignUpResponseSchema.safeParse({
        message:
          'Votre compte a été créé. Vérifiez votre email pour confirmer votre accès.',
        requiresEmailConfirmation: true,
        session: null,
        profile: null,
      }).success,
    ).toBe(true);
  });
});

describe('PasswordResetResponseSchema', () => {
  it('should accept a reset acknowledgement', () => {
    expect(
      PasswordResetResponseSchema.safeParse({
        success: true,
        message:
          'Si cette adresse existe, un email de réinitialisation vient d’être envoyé.',
      }).success,
    ).toBe(true);
  });
});

describe('AuthSessionContextSchema', () => {
  it('should accept the current authenticated profile payload', () => {
    expect(
      AuthSessionContextSchema.safeParse({
        profile: {
          appUser: {
            id: 'user-1',
            email: 'alice@example.com',
            role: 'participant',
            firstName: 'Alice',
            lastName: 'Dupont',
            phone: null,
            preferredContactChannel: null,
            isActive: true,
            createdAt: '2026-04-14T12:00:00.000Z',
            updatedAt: '2026-04-14T12:00:00.000Z',
          },
          participant: null,
        },
      }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CMS / Editorial model
// ---------------------------------------------------------------------------
describe('CreateAuthorSchema', () => {
  const valid = {
    email: 'editorialiste@kraak-consulting.com',
    displayName: 'Nadia Kouam',
    bio: 'Consultante en apprentissage et orientation professionnelle.',
    avatarUrl: 'https://cdn.kraak.test/authors/nadia-kouam.jpg',
  };

  it('Given a valid author payload When parsed Then the schema accepts it', () => {
    expect(CreateAuthorSchema.safeParse(valid).success).toBe(true);
  });

  it('Given a malformed author email When parsed Then the schema rejects it', () => {
    expect(
      CreateAuthorSchema.safeParse({ ...valid, email: 'email-invalide' })
        .success,
    ).toBe(false);
  });

  it('Given update author payload with one field When parsed Then partial updates are accepted', () => {
    expect(
      UpdateAuthorSchema.safeParse({ displayName: 'Nadia K.' }).success,
    ).toBe(true);
  });
});

describe('CreateCategorySchema', () => {
  const valid = {
    slug: 'actualites-formation',
    label: 'Actualités Formation',
    description: 'Contenus éditoriaux liés aux programmes et ateliers.',
  };

  it('Given a valid category payload When parsed Then the schema accepts it', () => {
    expect(CreateCategorySchema.safeParse(valid).success).toBe(true);
  });

  it('Given an empty category label When parsed Then the schema rejects it', () => {
    expect(
      CreateCategorySchema.safeParse({ ...valid, label: ' ' }).success,
    ).toBe(false);
  });

  it('Given update category payload with one field When parsed Then partial updates are accepted', () => {
    expect(UpdateCategorySchema.safeParse({ label: 'Insights' }).success).toBe(
      true,
    );
  });
});

describe('CreateTagSchema', () => {
  const valid = {
    slug: 'leadership',
    label: 'Leadership',
  };

  it('Given a valid tag payload When parsed Then the schema accepts it', () => {
    expect(CreateTagSchema.safeParse(valid).success).toBe(true);
  });

  it('Given an empty tag slug When parsed Then the schema rejects it', () => {
    expect(CreateTagSchema.safeParse({ ...valid, slug: ' ' }).success).toBe(
      false,
    );
  });

  it('Given update tag payload with one field When parsed Then partial updates are accepted', () => {
    expect(
      UpdateTagSchema.safeParse({ label: 'Leadership inclusif' }).success,
    ).toBe(true);
  });
});

describe('CreateArticleSchema', () => {
  const valid = {
    slug: 'comment-reussir-son-dossier-dimmigration',
    title: "Comment réussir son dossier d'immigration",
    excerpt:
      'Un cadre simple pour préparer les justificatifs, prioriser les étapes et réduire les risques de rejet.',
    content:
      '<p>Commencez par cartographier vos échéances puis vérifiez chaque pièce justificative.</p>',
    status: 'draft',
    coverImageUrl: 'https://cdn.kraak.test/articles/dossier-immigration.jpg',
    seoTitle: "Réussir son dossier d'immigration | KRAAK",
    seoDescription:
      "Méthode pratique pour structurer un dossier d'immigration et sécuriser vos démarches.",
    publishedAt: null,
    authorId: 'author-1',
    categoryIds: ['category-1'],
    tagIds: ['tag-1', 'tag-2'],
  };

  it('Given a valid article payload When parsed Then the schema accepts it', () => {
    expect(CreateArticleSchema.safeParse(valid).success).toBe(true);
  });

  it('Given an article without categories and tags When parsed Then the schema rejects it', () => {
    expect(
      CreateArticleSchema.safeParse({
        ...valid,
        categoryIds: [],
        tagIds: [],
      }).success,
    ).toBe(false);
  });

  it('Given update article payload with one field When parsed Then partial updates are accepted', () => {
    expect(
      UpdateArticleSchema.safeParse({ title: 'Nouveau titre' }).success,
    ).toBe(true);
  });
});

describe('Editorial base schemas', () => {
  it('Given full author/category/tag/article payloads When parsed Then entity schemas accept them', () => {
    expect(
      AuthorSchema.safeParse({
        id: 'author-1',
        email: 'editorialiste@kraak-consulting.com',
        displayName: 'Nadia Kouam',
        bio: null,
        avatarUrl: null,
        createdAt: '2026-05-24T09:00:00.000Z',
        updatedAt: '2026-05-24T09:00:00.000Z',
      }).success,
    ).toBe(true);

    expect(
      CategorySchema.safeParse({
        id: 'category-1',
        slug: 'actualites-formation',
        label: 'Actualités Formation',
        description: null,
        createdAt: '2026-05-24T09:00:00.000Z',
        updatedAt: '2026-05-24T09:00:00.000Z',
      }).success,
    ).toBe(true);

    expect(
      TagSchema.safeParse({
        id: 'tag-1',
        slug: 'leadership',
        label: 'Leadership',
        createdAt: '2026-05-24T09:00:00.000Z',
        updatedAt: '2026-05-24T09:00:00.000Z',
      }).success,
    ).toBe(true);

    expect(
      ArticleSchema.safeParse({
        id: 'article-1',
        slug: 'comment-reussir-son-dossier-dimmigration',
        title: "Comment réussir son dossier d'immigration",
        excerpt: 'Résumé article',
        content: '<p>Contenu</p>',
        status: 'published',
        coverImageUrl: null,
        seoTitle: null,
        seoDescription: null,
        publishedAt: '2026-05-24T09:00:00.000Z',
        authorId: 'author-1',
        categoryIds: ['category-1'],
        tagIds: ['tag-1'],
        createdAt: '2026-05-24T09:00:00.000Z',
        updatedAt: '2026-05-24T09:00:00.000Z',
      }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AppUser
// ---------------------------------------------------------------------------
describe('CreateAppUserSchema', () => {
  const valid = {
    email: 'alice@example.com',
    role: 'participant',
    firstName: 'Alice',
    lastName: 'Dupont',
    phone: null,
    preferredContactChannel: null,
    isActive: true,
  };

  it('should accept valid data', () => {
    const result = CreateAppUserSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const result = CreateAppUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid role', () => {
    const result = CreateAppUserSchema.safeParse({
      ...valid,
      role: 'superadmin',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = CreateAppUserSchema.safeParse({
      ...valid,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateAppUserSchema', () => {
  it('should accept partial data', () => {
    const result = UpdateAppUserSchema.safeParse({ firstName: 'Bob' });
    expect(result.success).toBe(true);
  });

  it('should accept empty object', () => {
    const result = UpdateAppUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('AppUserSchema', () => {
  it('should accept a full entity', () => {
    const result = AppUserSchema.safeParse({
      id: 'a1b2c3',
      email: 'alice@example.com',
      role: 'admin',
      firstName: 'Alice',
      lastName: 'Dupont',
      phone: '+33612345678',
      preferredContactChannel: 'email',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing id', () => {
    const result = AppUserSchema.safeParse({
      email: 'alice@example.com',
      role: 'admin',
      firstName: 'Alice',
      lastName: 'Dupont',
      phone: null,
      preferredContactChannel: null,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Participant
// ---------------------------------------------------------------------------
describe('CreateParticipantSchema', () => {
  const valid = {
    userId: 'user-1',
    lifecycleStatus: 'invited',
    referenceCode: null,
    country: null,
    city: null,
    notes: null,
  };

  it('should accept valid data', () => {
    expect(CreateParticipantSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject invalid lifecycleStatus', () => {
    expect(
      CreateParticipantSchema.safeParse({
        ...valid,
        lifecycleStatus: 'unknown',
      }).success,
    ).toBe(false);
  });
});

describe('UpdateParticipantSchema', () => {
  it('should accept partial data', () => {
    expect(
      UpdateParticipantSchema.safeParse({ city: 'Montréal' }).success,
    ).toBe(true);
  });
});

describe('ParticipantSchema', () => {
  it('should accept a full entity', () => {
    expect(
      ParticipantSchema.safeParse({
        id: 'p-1',
        userId: 'user-1',
        lifecycleStatus: 'active',
        referenceCode: 'REF-001',
        country: 'CA',
        city: 'Montréal',
        notes: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------
describe('CreateProgramSchema', () => {
  const valid = {
    slug: 'formation-leadership',
    title: 'Formation Leadership',
    summary: 'Résumé du programme',
    description: 'Description complète',
    status: 'draft',
    visibility: 'private',
  };

  it('should accept valid data', () => {
    expect(CreateProgramSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject invalid status', () => {
    expect(
      CreateProgramSchema.safeParse({ ...valid, status: 'deleted' }).success,
    ).toBe(false);
  });

  it('should reject invalid visibility', () => {
    expect(
      CreateProgramSchema.safeParse({ ...valid, visibility: 'secret' }).success,
    ).toBe(false);
  });
});

describe('UpdateProgramSchema', () => {
  it('should accept partial data', () => {
    expect(
      UpdateProgramSchema.safeParse({ title: 'Nouveau titre' }).success,
    ).toBe(true);
  });
});

describe('ProgramSchema', () => {
  it('should accept a full entity', () => {
    expect(
      ProgramSchema.safeParse({
        id: 'prg-1',
        slug: 'formation-leadership',
        title: 'Formation Leadership',
        summary: 'Résumé',
        description: 'Description',
        status: 'published',
        visibility: 'public',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cohort
// ---------------------------------------------------------------------------
describe('CreateCohortSchema', () => {
  const valid = {
    programId: 'prg-1',
    name: 'Cohorte A',
    code: null,
    status: 'draft',
    startDate: '2025-06-01',
    endDate: null,
    capacity: null,
  };

  it('should accept valid data', () => {
    expect(CreateCohortSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject invalid status', () => {
    expect(
      CreateCohortSchema.safeParse({ ...valid, status: 'cancelled' }).success,
    ).toBe(false);
  });
});

describe('UpdateCohortSchema', () => {
  it('should accept partial data', () => {
    expect(UpdateCohortSchema.safeParse({ capacity: 25 }).success).toBe(true);
  });
});

describe('CohortSchema', () => {
  it('should accept a full entity', () => {
    expect(
      CohortSchema.safeParse({
        id: 'coh-1',
        programId: 'prg-1',
        name: 'Cohorte A',
        code: 'COH-A',
        status: 'open',
        startDate: '2025-06-01',
        endDate: '2025-12-01',
        capacity: 30,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
describe('CreateSessionSchema', () => {
  const valid = {
    cohortId: 'coh-1',
    title: 'Session 1',
    description: null,
    status: 'scheduled',
    startsAt: '2025-06-15T09:00:00Z',
    endsAt: '2025-06-15T12:00:00Z',
    locationType: 'online',
    locationLabel: null,
    meetingLink: null,
    trainerUserId: null,
  };

  it('should accept valid data', () => {
    expect(CreateSessionSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject invalid status', () => {
    expect(
      CreateSessionSchema.safeParse({ ...valid, status: 'pending' }).success,
    ).toBe(false);
  });

  it('should reject invalid locationType', () => {
    expect(
      CreateSessionSchema.safeParse({ ...valid, locationType: 'remote' })
        .success,
    ).toBe(false);
  });
});

describe('UpdateSessionSchema', () => {
  it('should accept partial data', () => {
    expect(
      UpdateSessionSchema.safeParse({ title: 'Session modifiée' }).success,
    ).toBe(true);
  });
});

describe('SessionSchema', () => {
  it('should accept a full entity', () => {
    expect(
      SessionSchema.safeParse({
        id: 'ses-1',
        cohortId: 'coh-1',
        title: 'Session 1',
        description: 'Intro',
        status: 'live',
        startsAt: '2025-06-15T09:00:00Z',
        endsAt: '2025-06-15T12:00:00Z',
        locationType: 'hybrid',
        locationLabel: 'Salle A',
        meetingLink: 'https://meet.example.com/abc',
        trainerUserId: 'user-42',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------
describe('CreateResourceSchema', () => {
  const valid = {
    programId: 'prog-1',
    cohortId: null,
    title: 'Guide PDF',
    description: null,
    resourceType: 'document',
    resourceTheme: 'training',
    resourceAudience: 'young_professionals_students',
    url: null,
    filePath: '/uploads/guide.pdf',
    status: 'draft',
    publishedAt: null,
  };

  it('should accept valid data', () => {
    expect(CreateResourceSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject when both programId and cohortId are null', () => {
    expect(
      CreateResourceSchema.safeParse({
        ...valid,
        programId: null,
        cohortId: null,
      }).success,
    ).toBe(false);
  });

  it('should reject invalid resourceType', () => {
    expect(
      CreateResourceSchema.safeParse({ ...valid, resourceType: 'audio' })
        .success,
    ).toBe(false);
  });

  it('should reject invalid resourceTheme', () => {
    expect(
      CreateResourceSchema.safeParse({ ...valid, resourceTheme: 'finance' })
        .success,
    ).toBe(false);
  });

  it('should reject invalid resourceAudience', () => {
    expect(
      CreateResourceSchema.safeParse({ ...valid, resourceAudience: 'parents' })
        .success,
    ).toBe(false);
  });
});

describe('UpdateResourceSchema', () => {
  it('should accept partial data', () => {
    expect(UpdateResourceSchema.safeParse({ title: 'Guide v2' }).success).toBe(
      true,
    );
  });
});

describe('ResourceSchema', () => {
  it('should accept a full entity', () => {
    expect(
      ResourceSchema.safeParse({
        id: 'res-1',
        programId: 'prg-1',
        cohortId: null,
        title: 'Guide PDF',
        description: 'Un guide utile',
        resourceType: 'file',
        resourceTheme: 'project_management',
        resourceAudience: 'all',
        url: null,
        filePath: '/uploads/guide.pdf',
        status: 'published',
        publishedAt: '2025-03-01T00:00:00Z',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Announcement
// ---------------------------------------------------------------------------
describe('CreateAnnouncementSchema', () => {
  const valid = {
    title: 'Bienvenue',
    body: "Contenu de l'annonce",
    priority: 'normal',
    audienceType: 'all_participants',
    programId: null,
    cohortId: null,
    status: 'draft',
    publishedAt: null,
    createdByUserId: 'user-1',
  };

  it('should accept valid data', () => {
    expect(CreateAnnouncementSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject invalid audienceType', () => {
    expect(
      CreateAnnouncementSchema.safeParse({ ...valid, audienceType: 'everyone' })
        .success,
    ).toBe(false);
  });

  it('should reject all_participants with program or cohort scope', () => {
    expect(
      CreateAnnouncementSchema.safeParse({
        ...valid,
        audienceType: 'all_participants',
        programId: 'prg-1',
      }).success,
    ).toBe(false);
  });

  it('should reject program audience without programId', () => {
    expect(
      CreateAnnouncementSchema.safeParse({
        ...valid,
        audienceType: 'program',
        programId: null,
        cohortId: null,
      }).success,
    ).toBe(false);
  });

  it('should reject cohort audience without both programId and cohortId', () => {
    expect(
      CreateAnnouncementSchema.safeParse({
        ...valid,
        audienceType: 'cohort',
        programId: 'prg-1',
        cohortId: null,
      }).success,
    ).toBe(false);
  });

  it('should reject custom audience for MVP format', () => {
    expect(
      CreateAnnouncementSchema.safeParse({
        ...valid,
        audienceType: 'custom',
      }).success,
    ).toBe(false);
  });

  it('should accept program audience with programId only', () => {
    expect(
      CreateAnnouncementSchema.safeParse({
        ...valid,
        audienceType: 'program',
        programId: 'prg-1',
        cohortId: null,
      }).success,
    ).toBe(true);
  });

  it('should accept cohort audience with programId and cohortId', () => {
    expect(
      CreateAnnouncementSchema.safeParse({
        ...valid,
        audienceType: 'cohort',
        programId: 'prg-1',
        cohortId: 'coh-1',
      }).success,
    ).toBe(true);
  });
});

describe('UpdateAnnouncementSchema', () => {
  it('should accept partial data', () => {
    expect(
      UpdateAnnouncementSchema.safeParse({ title: 'Mise à jour' }).success,
    ).toBe(true);
  });
});

describe('AnnouncementSchema', () => {
  it('should accept a full entity', () => {
    expect(
      AnnouncementSchema.safeParse({
        id: 'ann-1',
        title: 'Bienvenue',
        body: 'Contenu',
        priority: 'high',
        audienceType: 'program',
        programId: 'prg-1',
        cohortId: null,
        status: 'published',
        publishedAt: '2025-03-01T00:00:00Z',
        createdByUserId: 'user-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Enrollment
// ---------------------------------------------------------------------------
describe('CreateEnrollmentSchema', () => {
  const valid = {
    participantId: 'p-1',
    programId: 'prg-1',
    cohortId: null,
    status: 'pending',
    completedAt: null,
  };

  it('should accept valid data', () => {
    expect(CreateEnrollmentSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject invalid status', () => {
    expect(
      CreateEnrollmentSchema.safeParse({ ...valid, status: 'dropped' }).success,
    ).toBe(false);
  });
});

describe('UpdateEnrollmentSchema', () => {
  it('should accept partial data', () => {
    expect(UpdateEnrollmentSchema.safeParse({ status: 'active' }).success).toBe(
      true,
    );
  });
});

describe('EnrollmentSchema', () => {
  it('should accept a full entity', () => {
    expect(
      EnrollmentSchema.safeParse({
        id: 'enr-1',
        participantId: 'p-1',
        programId: 'prg-1',
        cohortId: 'coh-1',
        status: 'active',
        enrolledAt: '2025-02-01T00:00:00Z',
        completedAt: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Notification (immutable — no UpdateSchema)
// ---------------------------------------------------------------------------
describe('CreateNotificationSchema', () => {
  const valid = {
    userId: 'user-1',
    title: 'Nouvelle session',
    body: 'Votre session commence bientôt',
    notificationType: 'session_reminder',
    channel: 'in_app',
    sourceType: null,
    sourceId: null,
  };

  it('should accept valid data', () => {
    expect(CreateNotificationSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject invalid notificationType', () => {
    expect(
      CreateNotificationSchema.safeParse({
        ...valid,
        notificationType: 'email',
      }).success,
    ).toBe(false);
  });

  it('should reject invalid channel', () => {
    expect(
      CreateNotificationSchema.safeParse({ ...valid, channel: 'sms' }).success,
    ).toBe(false);
  });
});

describe('NotificationSchema', () => {
  it('should accept a full entity', () => {
    expect(
      NotificationSchema.safeParse({
        id: 'ntf-1',
        userId: 'user-1',
        title: 'Rappel',
        body: 'Session demain',
        notificationType: 'session_reminder',
        channel: 'push',
        isRead: false,
        readAt: null,
        sourceType: 'session',
        sourceId: 'ses-1',
        createdAt: '2025-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
  });

  it('should reject entity with updatedAt (immutable)', () => {
    const result = NotificationSchema.safeParse({
      id: 'ntf-1',
      userId: 'user-1',
      title: 'Rappel',
      body: 'Session demain',
      notificationType: 'session_reminder',
      channel: 'push',
      isRead: false,
      readAt: null,
      sourceType: null,
      sourceId: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });
    // Schema should use .strict() or not define updatedAt — extra keys rejected
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SupportRequest
// ---------------------------------------------------------------------------
describe('CreateSupportRequestSchema', () => {
  const valid = {
    userId: 'user-1',
    participantId: null,
    subject: 'Problème technique',
    message: 'Je ne peux pas accéder au cours',
    status: 'open',
    category: 'technical',
    assignedToUserId: null,
  };

  it('should accept valid data', () => {
    expect(CreateSupportRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('should reject invalid status', () => {
    expect(
      CreateSupportRequestSchema.safeParse({ ...valid, status: 'deleted' })
        .success,
    ).toBe(false);
  });

  it('should reject invalid category', () => {
    expect(
      CreateSupportRequestSchema.safeParse({ ...valid, category: 'finance' })
        .success,
    ).toBe(false);
  });
});

describe('UpdateSupportRequestSchema', () => {
  it('should accept partial data', () => {
    expect(
      UpdateSupportRequestSchema.safeParse({ status: 'resolved' }).success,
    ).toBe(true);
  });
});

describe('SupportRequestSchema', () => {
  it('should accept a full entity', () => {
    expect(
      SupportRequestSchema.safeParse({
        id: 'sr-1',
        userId: 'user-1',
        participantId: 'p-1',
        subject: 'Problème',
        message: 'Détails',
        status: 'in_progress',
        category: 'program',
        assignedToUserId: 'user-42',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }).success,
    ).toBe(true);
  });
});
