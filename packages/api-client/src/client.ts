import type {
  AppUserDto,
  AuthSessionBundleDto,
  AuthSessionContextDto,
  CreateAppUserDto,
  UpdateAppUserDto,
  PasswordResetRequestDto,
  PasswordResetResponseDto,
  ParticipantDto,
  CreateParticipantDto,
  UpdateParticipantDto,
  ProgramDto,
  CreateProgramDto,
  UpdateProgramDto,
  CohortDto,
  CreateCohortDto,
  UpdateCohortDto,
  SessionDto,
  CreateSessionDto,
  UpdateSessionDto,
  ResourceDto,
  CreateResourceDto,
  UpdateResourceDto,
  AnnouncementDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  EnrollmentDto,
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  NotificationDto,
  CreateNotificationDto,
  SupportRequestDto,
  CreateSupportRequestDto,
  UpdateSupportRequestDto,
  RefreshSessionRequestDto,
  SignInRequestDto,
  SignUpRequestDto,
  SignUpResponseDto,
  DashboardAggregateDto,
  ParticipantProgramDetailDto,
  ParticipantProgramListItemDto,
  MarkProgramSessionProgressRequestDto,
  MarkProgramSessionProgressResponseDto,
  ContactFormDto,
  ContactSubmissionResultDto,
} from '@kraak/contracts';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ApiClientConfig {
  baseUrl: string;
  getAuthToken?: () => string | null | Promise<string | null>;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Generic resource client types
// ---------------------------------------------------------------------------

export interface ReadonlyResourceClient<TDto> {
  getById(id: string, options?: RequestOptions): Promise<TDto>;
  list(options?: RequestOptions): Promise<TDto[]>;
}

export interface CreatableResourceClient<
  TDto,
  TCreate,
> extends ReadonlyResourceClient<TDto> {
  create(body: TCreate, options?: RequestOptions): Promise<TDto>;
}

export interface FullResourceClient<
  TDto,
  TCreate,
  TUpdate,
> extends CreatableResourceClient<TDto, TCreate> {
  update(id: string, body: TUpdate, options?: RequestOptions): Promise<TDto>;
  remove(id: string, options?: RequestOptions): Promise<void>;
}

export interface AuthClient {
  signIn(
    body: SignInRequestDto,
    options?: RequestOptions,
  ): Promise<AuthSessionBundleDto>;
  signUp(
    body: SignUpRequestDto,
    options?: RequestOptions,
  ): Promise<SignUpResponseDto>;
  refreshSession(
    body: RefreshSessionRequestDto,
    options?: RequestOptions,
  ): Promise<AuthSessionBundleDto>;
  requestPasswordReset(
    body: PasswordResetRequestDto,
    options?: RequestOptions,
  ): Promise<PasswordResetResponseDto>;
  getSession(options?: RequestOptions): Promise<AuthSessionContextDto>;
}

export interface ContactClient {
  submit(
    body: ContactFormDto,
    options?: RequestOptions,
  ): Promise<ContactSubmissionResultDto>;
}

export interface DashboardClient {
  getAggregate(options?: RequestOptions): Promise<DashboardAggregateDto>;
}

export interface ParticipantProgramsClient {
  getById(
    id: string,
    options?: RequestOptions,
  ): Promise<ParticipantProgramDetailDto>;
  list(options?: RequestOptions): Promise<ParticipantProgramListItemDto[]>;
  markSessionProgress(
    programId: string,
    body: MarkProgramSessionProgressRequestDto,
    options?: RequestOptions,
  ): Promise<MarkProgramSessionProgressResponseDto>;
}

// ---------------------------------------------------------------------------
// ApiClient interface
// ---------------------------------------------------------------------------

export interface ApiClient {
  auth: AuthClient;
  contact: ContactClient;
  dashboard: DashboardClient;
  participantPrograms: ParticipantProgramsClient;
  users: FullResourceClient<AppUserDto, CreateAppUserDto, UpdateAppUserDto>;
  participants: FullResourceClient<
    ParticipantDto,
    CreateParticipantDto,
    UpdateParticipantDto
  >;
  programs: FullResourceClient<ProgramDto, CreateProgramDto, UpdateProgramDto>;
  cohorts: FullResourceClient<CohortDto, CreateCohortDto, UpdateCohortDto>;
  sessions: FullResourceClient<SessionDto, CreateSessionDto, UpdateSessionDto>;
  resources: FullResourceClient<
    ResourceDto,
    CreateResourceDto,
    UpdateResourceDto
  >;
  announcements: FullResourceClient<
    AnnouncementDto,
    CreateAnnouncementDto,
    UpdateAnnouncementDto
  >;
  enrollments: FullResourceClient<
    EnrollmentDto,
    CreateEnrollmentDto,
    UpdateEnrollmentDto
  >;
  notifications: CreatableResourceClient<
    NotificationDto,
    CreateNotificationDto
  >;
  supportRequests: FullResourceClient<
    SupportRequestDto,
    CreateSupportRequestDto,
    UpdateSupportRequestDto
  >;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
  ) {
    super(`${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function buildHeaders(
  config: ApiClientConfig,
  options?: RequestOptions,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...config.defaultHeaders,
    ...options?.headers,
  };

  if (config.getAuthToken) {
    const token = await config.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

async function request<T>(
  config: ApiClientConfig,
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const url = `${config.baseUrl}${path}`;
  const headers = await buildHeaders(config, options);

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options?.signal,
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text().catch(() => null);
    }
    throw new ApiError(response.status, response.statusText, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Resource client factories (composed to avoid duplication)
// ---------------------------------------------------------------------------

function createReadonlyResourceClient<TDto>(
  config: ApiClientConfig,
  basePath: string,
): ReadonlyResourceClient<TDto> {
  return {
    getById: (id, options?) =>
      request<TDto>(config, 'GET', `${basePath}/${id}`, undefined, options),
    list: (options?) =>
      request<TDto[]>(config, 'GET', basePath, undefined, options),
  };
}

function createCreatableResourceClient<TDto, TCreate>(
  config: ApiClientConfig,
  basePath: string,
): CreatableResourceClient<TDto, TCreate> {
  return {
    ...createReadonlyResourceClient<TDto>(config, basePath),
    create: (body, options?) =>
      request<TDto>(config, 'POST', basePath, body, options),
  };
}

function createFullResourceClient<TDto, TCreate, TUpdate>(
  config: ApiClientConfig,
  basePath: string,
): FullResourceClient<TDto, TCreate, TUpdate> {
  return {
    ...createCreatableResourceClient<TDto, TCreate>(config, basePath),
    update: (id, body, options?) =>
      request<TDto>(config, 'PATCH', `${basePath}/${id}`, body, options),
    remove: (id, options?) =>
      request<void>(config, 'DELETE', `${basePath}/${id}`, undefined, options),
  };
}

function createAuthClient(config: ApiClientConfig): AuthClient {
  return {
    signIn: (body, options?) =>
      request<AuthSessionBundleDto>(
        config,
        'POST',
        '/auth/sign-in',
        body,
        options,
      ),
    signUp: (body, options?) =>
      request<SignUpResponseDto>(
        config,
        'POST',
        '/auth/sign-up',
        body,
        options,
      ),
    refreshSession: (body, options?) =>
      request<AuthSessionBundleDto>(
        config,
        'POST',
        '/auth/session/refresh',
        body,
        options,
      ),
    requestPasswordReset: (body, options?) =>
      request<PasswordResetResponseDto>(
        config,
        'POST',
        '/auth/password-reset',
        body,
        options,
      ),
    getSession: (options?) =>
      request<AuthSessionContextDto>(
        config,
        'GET',
        '/auth/session',
        undefined,
        options,
      ),
  };
}

function createContactClient(config: ApiClientConfig): ContactClient {
  return {
    submit: (body, options?) =>
      request<ContactSubmissionResultDto>(
        config,
        'POST',
        '/support/contact',
        body,
        options,
      ),
  };
}

function createDashboardClient(config: ApiClientConfig): DashboardClient {
  return {
    getAggregate: (options?) =>
      request<DashboardAggregateDto>(
        config,
        'GET',
        '/dashboard',
        undefined,
        options,
      ),
  };
}

function createParticipantProgramsClient(
  config: ApiClientConfig,
): ParticipantProgramsClient {
  return {
    getById: (id, options?) =>
      request<ParticipantProgramDetailDto>(
        config,
        'GET',
        `/programs/${id}`,
        undefined,
        options,
      ),
    list: (options?) =>
      request<ParticipantProgramListItemDto[]>(
        config,
        'GET',
        '/programs',
        undefined,
        options,
      ),
    markSessionProgress: (programId, body, options?) =>
      request<MarkProgramSessionProgressResponseDto>(
        config,
        'POST',
        `/programs/${programId}/progress`,
        body,
        options,
      ),
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createApiClient(config: ApiClientConfig): ApiClient {
  return {
    auth: createAuthClient(config),
    contact: createContactClient(config),
    dashboard: createDashboardClient(config),
    participantPrograms: createParticipantProgramsClient(config),
    users: createFullResourceClient(config, '/users'),
    participants: createFullResourceClient(config, '/participants'),
    programs: createFullResourceClient(config, '/programs'),
    cohorts: createFullResourceClient(config, '/cohorts'),
    sessions: createFullResourceClient(config, '/sessions'),
    resources: createFullResourceClient(config, '/resources'),
    announcements: createFullResourceClient(config, '/announcements'),
    enrollments: createFullResourceClient(config, '/enrollments'),
    notifications: createCreatableResourceClient(config, '/notifications'),
    supportRequests: createFullResourceClient(config, '/support-requests'),
  };
}
