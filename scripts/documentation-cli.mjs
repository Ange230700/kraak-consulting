export function parseDocumentationMode(args) {
  if (args.includes('--help') || args.includes('-h')) {
    return { mode: 'help' };
  }

  const unknown = args.filter((arg) => !['--check', '--write'].includes(arg));
  if (unknown.length > 0) {
    return { error: `Unknown option: ${unknown.join(', ')}` };
  }

  const check = args.includes('--check');
  if (check === args.includes('--write')) {
    return { error: 'Choose exactly one mode: --check or --write.' };
  }

  return { mode: check ? 'check' : 'write' };
}
