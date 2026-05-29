import type {
  AuthProfileDto,
  AuthSessionBundleDto,
  AuthSessionContextDto,
  AuthSessionTokensDto,
  PasswordResetRequestDto,
  PasswordResetResponseDto,
  SignInRequestDto,
  SignUpRequestDto,
  SignUpResponseDto,
} from '@kraak/contracts';

type SessionReader = () => AuthSessionTokensDto | null;
type ProfileReader = () => AuthProfileDto | null;
type SessionWriter = (value: AuthSessionTokensDto | null) => void;
type ProfileWriter = (value: AuthProfileDto | null) => void;

export function storeAuthBundle(
  bundle: AuthSessionBundleDto,
  setSession: SessionWriter,
  setProfile: ProfileWriter,
  persistBundle: () => void,
): void {
  setSession(bundle.session);
  setProfile(bundle.profile);
  persistBundle();
}

export function clearAuthBundle(
  setSession: SessionWriter,
  setProfile: ProfileWriter,
  removeStoredBundle: () => void,
): void {
  setSession(null);
  setProfile(null);
  removeStoredBundle();
}

export function persistAuthBundle(
  currentSession: SessionReader,
  currentProfile: ProfileReader,
  writeStoredBundle: (serializedBundle: string) => void,
  removeStoredBundle: () => void,
): void {
  const session = currentSession();
  const profile = currentProfile();

  if (!session || !profile) {
    removeStoredBundle();
    return;
  }

  writeStoredBundle(JSON.stringify({ session, profile }));
}

export function readStoredAuthBundle(
  rawValue: string | null,
  removeStoredBundle: () => void,
  onParseError?: (error: unknown) => void,
): AuthSessionBundleDto | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as AuthSessionBundleDto;

    if (
      !parsedValue.session?.accessToken ||
      !parsedValue.session?.refreshToken ||
      !parsedValue.profile?.appUser?.id
    ) {
      removeStoredBundle();
      return null;
    }

    return parsedValue;
  } catch (error) {
    onParseError?.(error);
    removeStoredBundle();
    return null;
  }
}

export async function signInAndStoreBundle(
  signIn: (body: SignInRequestDto) => Promise<AuthSessionBundleDto>,
  body: SignInRequestDto,
  persistBundle: (bundle: AuthSessionBundleDto) => void,
): Promise<AuthSessionBundleDto> {
  const bundle = await signIn(body);
  persistBundle(bundle);
  return bundle;
}

export async function signUpAndStoreBundle(
  signUp: (body: SignUpRequestDto) => Promise<SignUpResponseDto>,
  body: SignUpRequestDto,
  persistBundle: (bundle: AuthSessionBundleDto) => void,
): Promise<SignUpResponseDto> {
  const response = await signUp(body);

  if (response.session && response.profile) {
    persistBundle({
      session: response.session,
      profile: response.profile,
    });
  }

  return response;
}

export async function refreshAndStoreBundle(
  currentSession: SessionReader,
  refreshSession: (body: {
    refreshToken: string;
  }) => Promise<AuthSessionBundleDto>,
  persistBundle: (bundle: AuthSessionBundleDto) => void,
): Promise<AuthSessionBundleDto | null> {
  const session = currentSession();

  if (!session) {
    return null;
  }

  const bundle = await refreshSession({
    refreshToken: session.refreshToken,
  });

  persistBundle(bundle);
  return bundle;
}

export async function requestAuthPasswordReset(
  requestPasswordReset: (
    body: PasswordResetRequestDto,
  ) => Promise<PasswordResetResponseDto>,
  body: PasswordResetRequestDto,
): Promise<PasswordResetResponseDto> {
  return requestPasswordReset(body);
}

export async function getAndStoreSessionContext(
  currentSession: SessionReader,
  getSession: () => Promise<AuthSessionContextDto>,
  setProfile: ProfileWriter,
  persistBundle: () => void,
): Promise<AuthSessionContextDto | null> {
  if (!currentSession()) {
    return null;
  }

  const context = await getSession();
  setProfile(context.profile);
  persistBundle();

  return context;
}
