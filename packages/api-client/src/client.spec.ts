import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApiClient, ApiError } from './client';
import type { ApiClientConfig } from './client';
import type {
  CreateAppUserDto,
  CreateNotificationDto,
  SignInRequestDto,
  SignUpRequestDto,
} from '@kraak/contracts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(status: number, body: unknown = null, statusText = 'OK') {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } satisfies Partial<Response> as unknown as Response);
}

function baseConfig(overrides?: Partial<ApiClientConfig>): ApiClientConfig {
  return { baseUrl: 'https://api.test', ...overrides };
}

// ---------------------------------------------------------------------------
// Structure tests
// ---------------------------------------------------------------------------

describe('createApiClient', () => {
  it('retourne un objet avec les 13 groupes de ressources', () => {
    const client = createApiClient(baseConfig());
    const keys = Object.keys(client).sort((a, b) => a.localeCompare(b));
    expect(keys).toEqual([
      'announcements',
      'auth',
      'cohorts',
      'dashboard',
      'enrollments',
      'notifications',
      'participantPrograms',
      'participants',
      'programs',
      'resources',
      'sessions',
      'supportRequests',
      'users',
    ]);
  });

  it.each([
    'users',
    'participants',
    'programs',
    'cohorts',
    'sessions',
    'resources',
    'announcements',
    'enrollments',
    'supportRequests',
  ] as const)('%s expose getById, list, create, update, remove', (resource) => {
    const client = createApiClient(baseConfig()) as unknown as Record<
      string,
      Record<string, unknown>
    >;
    expect(typeof client[resource].getById).toBe('function');
    expect(typeof client[resource].list).toBe('function');
    expect(typeof client[resource].create).toBe('function');
    expect(typeof client[resource].update).toBe('function');
    expect(typeof client[resource].remove).toBe('function');
  });

  it('notifications expose getById, list, create mais PAS update ni remove', () => {
    const client = createApiClient(baseConfig());
    expect(typeof client.notifications.getById).toBe('function');
    expect(typeof client.notifications.list).toBe('function');
    expect(typeof client.notifications.create).toBe('function');
    expect(
      (client.notifications as unknown as Record<string, unknown>)['update'],
    ).toBeUndefined();
    expect(
      (client.notifications as unknown as Record<string, unknown>)['remove'],
    ).toBeUndefined();
  });

  it('auth expose signIn, signUp, refreshSession, requestPasswordReset et getSession', () => {
    const client = createApiClient(baseConfig());
    expect(typeof client.auth.signIn).toBe('function');
    expect(typeof client.auth.signUp).toBe('function');
    expect(typeof client.auth.refreshSession).toBe('function');
    expect(typeof client.auth.requestPasswordReset).toBe('function');
    expect(typeof client.auth.getSession).toBe('function');
  });

  it('dashboard expose getAggregate', () => {
    const client = createApiClient(baseConfig());
    expect(typeof client.dashboard.getAggregate).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// HTTP behaviour tests
// ---------------------------------------------------------------------------

describe('HTTP behaviour', () => {
  let fetchSpy: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    fetchSpy = mockFetch(200, { id: '1' });
    vi.stubGlobal('fetch', fetchSpy);
  });

  it('GET /users/42 appelle fetch avec la bonne URL et méthode', async () => {
    const client = createApiClient(baseConfig());
    await client.users.getById('42');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.test/users/42');
    expect(init.method).toBe('GET');
  });

  it('GET /programs liste sans body', async () => {
    fetchSpy = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchSpy);

    const client = createApiClient(baseConfig());
    await client.programs.list();

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.test/programs');
    expect(init.body).toBeUndefined();
  });

  it('POST /users envoie le body JSON et retourne le DTO', async () => {
    const created = { id: 'u1', email: 'a@b.c' };
    fetchSpy = mockFetch(201, created);
    vi.stubGlobal('fetch', fetchSpy);

    const client = createApiClient(baseConfig());
    const body: CreateAppUserDto = {
      email: 'a@b.c',
      role: 'admin',
      firstName: 'A',
      lastName: 'B',
      phone: null,
      preferredContactChannel: null,
      isActive: true,
    };
    const result = await client.users.create(body);

    const [, init] = fetchSpy.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(body);
    expect(result).toEqual(created);
  });

  it('PATCH /cohorts/:id envoie le body de mise à jour', async () => {
    fetchSpy = mockFetch(200, { id: 'c1', name: 'updated' });
    vi.stubGlobal('fetch', fetchSpy);

    const client = createApiClient(baseConfig());
    await client.cohorts.update('c1', { name: 'updated' });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.test/cohorts/c1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'updated' });
  });

  it('DELETE /sessions/:id envoie sans body', async () => {
    fetchSpy = mockFetch(204);
    vi.stubGlobal('fetch', fetchSpy);

    const client = createApiClient(baseConfig());
    await client.sessions.remove('s1');

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.test/sessions/s1');
    expect(init.method).toBe('DELETE');
    expect(init.body).toBeUndefined();
  });

  it('POST /notifications crée une notification (immutable)', async () => {
    const dto = { id: 'n1', title: 'Hello' };
    fetchSpy = mockFetch(201, dto);
    vi.stubGlobal('fetch', fetchSpy);

    const client = createApiClient(baseConfig());
    const body: CreateNotificationDto = {
      userId: 'u1',
      title: 'Hello',
      body: 'World',
      notificationType: 'system',
      channel: 'in_app',
      sourceType: null,
      sourceId: null,
    };
    const result = await client.notifications.create(body);

    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.test/notifications');
    expect(result).toEqual(dto);
  });

  it('support-requests utilise le bon chemin avec tiret', async () => {
    fetchSpy = mockFetch(200, []);
    vi.stubGlobal('fetch', fetchSpy);

    const client = createApiClient(baseConfig());
    await client.supportRequests.list();

    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.test/support-requests');
  });

  it('POST /auth/sign-in envoie les identifiants au bon endpoint', async () => {
    fetchSpy = mockFetch(200, { session: {}, profile: {} });
    vi.stubGlobal('fetch', fetchSpy);

    const client = createApiClient(baseConfig());
    const body: SignInRequestDto = {
      email: 'alice@example.com',
      password: 'motdepasse-securise',
    };

    await client.auth.signIn(body);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.test/auth/sign-in');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(body);
  });

  it('POST /auth/sign-up envoie le payload complet au bon endpoint', async () => {
    fetchSpy = mockFetch(201, {
      message: 'ok',
      requiresEmailConfirmation: true,
      session: null,
      profile: null,
    });
    vi.stubGlobal('fetch', fetchSpy);

    const client = createApiClient(baseConfig());
    const body: SignUpRequestDto = {
      email: 'alice@example.com',
      password: 'motdepasse-securise',
      firstName: 'Alice',
      lastName: 'Dupont',
      phone: null,
      preferredContactChannel: null,
      redirectTo: 'kraak://auth/callback',
    };

    await client.auth.signUp(body);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.test/auth/sign-up');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(body);
  });

  it('GET /dashboard appelle le endpoint aggregate', async () => {
    fetchSpy = mockFetch(200, {
      generatedAt: '2026-04-29T11:00:00.000Z',
      programs: [],
      upcomingSessions: [],
      recentAnnouncements: [],
    });
    vi.stubGlobal('fetch', fetchSpy);

    const client = createApiClient(baseConfig());
    await client.dashboard.getAggregate();

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.test/dashboard');
    expect(init.method).toBe('GET');
  });

  it('POST /programs/:id/progress envoie le marquage progression minimal', async () => {
    fetchSpy = mockFetch(200, {
      enrollmentId: 'enr-1',
      enrollmentStatus: 'active',
      progress: {
        totalSessions: 2,
        completedSessions: 1,
        completionRate: 50,
        status: 'in_progress',
        completedSessionIds: ['session-1'],
        updatedAt: '2026-04-29T10:00:00.000Z',
      },
    });
    vi.stubGlobal('fetch', fetchSpy);

    const client = createApiClient(baseConfig());
    await client.participantPrograms.markSessionProgress('prog-1', {
      sessionId: 'session-1',
      completed: true,
    });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.test/programs/prog-1/progress');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      sessionId: 'session-1',
      completed: true,
    });
  });
});

// ---------------------------------------------------------------------------
// Headers & auth tests
// ---------------------------------------------------------------------------

describe('en-têtes et authentification', () => {
  let fetchSpy: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    fetchSpy = mockFetch(200, {});
    vi.stubGlobal('fetch', fetchSpy);
  });

  it('envoie Content-Type et Accept par défaut', async () => {
    const client = createApiClient(baseConfig());
    await client.users.list();

    const headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json');
  });

  it('injecte le token Authorization quand getAuthToken est fourni', async () => {
    const client = createApiClient(
      baseConfig({ getAuthToken: () => 'tok_123' }),
    );
    await client.users.list();

    const headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer tok_123');
  });

  it('supporte getAuthToken asynchrone', async () => {
    const client = createApiClient(
      baseConfig({ getAuthToken: async () => 'async_tok' }),
    );
    await client.users.list();

    const headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer async_tok');
  });

  it("n'envoie pas Authorization quand getAuthToken retourne null", async () => {
    const client = createApiClient(baseConfig({ getAuthToken: () => null }));
    await client.users.list();

    const headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('fusionne defaultHeaders et requestOptions.headers', async () => {
    const client = createApiClient(
      baseConfig({ defaultHeaders: { 'X-Custom': 'default' } }),
    );
    await client.users.list({ headers: { 'X-Request': 'override' } });

    const headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['X-Custom']).toBe('default');
    expect(headers['X-Request']).toBe('override');
  });

  it('transmet le signal AbortSignal', async () => {
    const controller = new AbortController();
    const client = createApiClient(baseConfig());
    await client.users.list({ signal: controller.signal });

    expect(fetchSpy.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it('GET /auth/session réutilise Authorization via getAuthToken', async () => {
    const client = createApiClient(
      baseConfig({ getAuthToken: () => 'stored-access-token' }),
    );

    await client.auth.getSession();

    const [url, init] = fetchSpy.mock.calls[0];
    const headers = init.headers as Record<string, string>;
    expect(url).toBe('https://api.test/auth/session');
    expect(init.method).toBe('GET');
    expect(headers['Authorization']).toBe('Bearer stored-access-token');
  });
});

// ---------------------------------------------------------------------------
// Error handling tests
// ---------------------------------------------------------------------------

describe('gestion des erreurs', () => {
  it('lance ApiError pour une réponse non-ok avec body JSON', async () => {
    const errorBody = { message: 'Non trouvé' };
    vi.stubGlobal('fetch', mockFetch(404, errorBody, 'Not Found'));

    const client = createApiClient(baseConfig());

    await expect(client.users.getById('999')).rejects.toThrow(ApiError);

    try {
      await client.users.getById('999');
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.statusText).toBe('Not Found');
      expect(apiErr.body).toEqual(errorBody);
    }
  });

  it("lance ApiError même quand le body n'est pas du JSON", async () => {
    const badFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('invalid json')),
      text: () => Promise.resolve('crash'),
    });
    vi.stubGlobal('fetch', badFetch);

    const client = createApiClient(baseConfig());
    await expect(client.programs.list()).rejects.toThrow(ApiError);
  });

  it('ApiError.message contient status et statusText', () => {
    const err = new ApiError(403, 'Forbidden', null);
    expect(err.message).toBe('403 Forbidden');
    expect(err.name).toBe('ApiError');
  });
});
