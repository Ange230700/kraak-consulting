export type DebugContext = Readonly<Record<string, unknown>>;

export function logDebugError(
  scope: string,
  error: unknown,
  details?: DebugContext,
): void {
  const label = `[Debug] ${scope}`;

  if (!details || Object.keys(details).length === 0) {
    console.error(label, error);
    return;
  }

  console.groupCollapsed(label);

  try {
    console.error(error);
    console.debug('Contexte :', details);
  } finally {
    console.groupEnd();
  }
}
