const repositoryContextVariables = [
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_PREFIX',
  'GIT_COMMON_DIR',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_QUARANTINE_PATH',
  'GIT_SUPER_PREFIX',
];

function getGitHookChildEnvironment(sourceEnvironment = process.env) {
  const childEnvironment = { ...sourceEnvironment };

  for (const variable of repositoryContextVariables) {
    delete childEnvironment[variable];
  }

  return childEnvironment;
}

export { getGitHookChildEnvironment };
