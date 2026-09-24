#!/bin/sh
# Sauvegarde quotidienne de la base (format custom, restaurable avec pg_restore).
set -eu

retention="${BACKUP_RETENTION_DAYS:-14}"

while true; do
  file="/backups/digest-$(date -u +%Y%m%d-%H%M%S).dump"
  if pg_dump --format=custom --file="$file.tmp"; then
    mv "$file.tmp" "$file"
    echo "[backup] $file ($(du -h "$file" | cut -f1))"
  else
    rm -f "$file.tmp"
    echo "[backup] échec du pg_dump" >&2
  fi
  find /backups -name 'digest-*.dump' -mtime +"$retention" -delete
  sleep 86400
done
