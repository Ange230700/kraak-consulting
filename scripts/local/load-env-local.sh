#!/usr/bin/env bash

# Charge les variables de .env.local (racine du repo) dans le shell courant.
# Usage: source scripts/local/load-env-local.sh

_script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_repo_root="$(cd "${_script_dir}/../.." && pwd)"
_env_file="${_repo_root}/.env.local"

if [[ ! -f "${_env_file}" ]]; then
  return 0 2>/dev/null || exit 0
fi

while IFS= read -r _line || [[ -n "${_line}" ]]; do
  # Ignore lignes vides et commentaires.
  if [[ "${_line}" =~ ^[[:space:]]*$ ]] || [[ "${_line}" =~ ^[[:space:]]*# ]]; then
    continue
  fi

  if [[ ! "${_line}" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
    continue
  fi

  _key="${_line%%=*}"
  _value="${_line#*=}"

  # Retire des guillemets simples/doubles englobants éventuels.
  if [[ "${_value}" =~ ^\".*\"$ ]]; then
    _value="${_value:1:${#_value}-2}"
  elif [[ "${_value}" =~ ^\'.*\'$ ]]; then
    _value="${_value:1:${#_value}-2}"
  fi

  export "${_key}=${_value}"
done < "${_env_file}"

unset _script_dir _repo_root _env_file _line _key _value
