#!/bin/sh
# Notes de release à partir des commits entre le tag précédent et $1 (ex. v0.2.0).
# Regroupées en Nouveautés (feat), Corrections (fix) et Autres ; changements cassants (type!) en tête.
set -eu

tag="$1"
previous=$(git describe --tags --abbrev=0 "$tag^" 2>/dev/null || true)
range="${previous:+$previous..}$tag"

subjects=$(git log --no-merges --format=%s "$range" | grep -v '^merge:' || true)

section() {
  lines=$(printf '%s\n' "$subjects" | grep -E "$2" | sed -E 's/^[a-z]+(\([^)]*\))?!?: /- /' || true)
  [ -n "$lines" ] && printf '## %s\n\n%s\n\n' "$1" "$lines"
  return 0
}

breaking=$(printf '%s\n' "$subjects" | grep -E '^[a-z]+(\([^)]*\))?!:' || true)
if [ -n "$breaking" ]; then
  printf '## ⚠️ Changements cassants\n\n%s\n\nLire la section « Mise à jour » du README avant de mettre à jour.\n\n' \
    "$(printf '%s\n' "$breaking" | sed -E 's/^[a-z]+(\([^)]*\))?!: /- /')"
fi
section "Nouveautés" '^feat(\([^)]*\))?!?:'
section "Corrections" '^fix(\([^)]*\))?!?:'
section "Autres" '^(refactor|perf|docs|test|ci|build|chore)(\([^)]*\))?!?:'
printf 'Image Docker : `ghcr.io/seishiiinsan/digest:%s`\n' "$tag"
