#!/usr/bin/env bash
# Prepara SSH en el runner de GitHub verificando la huella del servidor.
# Variables: SSH_KEY HOST PORT USER_SSH FP (huella SHA256 ED25519 mostrada en hPanel).
set -euo pipefail
for v in SSH_KEY HOST PORT USER_SSH FP; do
  [ -n "${!v:-}" ] || { echo "::error::Falta configurar $v en el entorno de GitHub"; exit 1; }
done
install -m 700 -d ~/.ssh
printf '%s\n' "$SSH_KEY" > ~/.ssh/deploy_key
chmod 600 ~/.ssh/deploy_key
# Un timeout transitorio no debe abortar sin diagnóstico. Nunca aceptar otra huella.
scan_ok=0
for attempt in 1 2 3; do
  echo "Consultando huella SSH (intento $attempt de 3; espera máxima 20 s)"
  if ssh-keyscan -T 20 -p "$PORT" -t ed25519 "$HOST" > ~/.ssh/known_hosts.tmp 2> ~/.ssh/keyscan.err && [ -s ~/.ssh/known_hosts.tmp ]; then
    scan_ok=1
    break
  fi
  if [ "$attempt" -lt 3 ]; then sleep 3; fi
done
if [ "$scan_ok" -ne 1 ]; then
  echo "::error::No se pudo obtener la clave ED25519 del servidor SSH después de tres intentos. Revisa disponibilidad SSH, host, puerto y posibles bloqueos de red en Hostinger. No se enviaron archivos."
  tail -n 5 ~/.ssh/keyscan.err >&2
  exit 1
fi
if ! ssh-keygen -lf ~/.ssh/known_hosts.tmp -E sha256 > ~/.ssh/fingerprints.tmp; then
  echo "::error::El servidor no devolvió una clave SSH válida. Conexión cancelada."
  exit 1
fi
GOT="$(awk 'NR==1 {print $2}' ~/.ssh/fingerprints.tmp)"
if [ "$GOT" != "$FP" ]; then
  echo "::error::La huella del servidor ($GOT) no coincide con la registrada. Conexión cancelada."
  exit 1
fi
mv ~/.ssh/known_hosts.tmp ~/.ssh/known_hosts
cat > ~/.ssh/config <<EOF
Host hostinger
  HostName $HOST
  Port $PORT
  User $USER_SSH
  IdentityFile ~/.ssh/deploy_key
  IdentitiesOnly yes
  StrictHostKeyChecking yes
  BatchMode yes
  ServerAliveInterval 15
  ConnectTimeout 20
EOF
chmod 600 ~/.ssh/config
if ! ssh hostinger 'echo "Conexión SSH verificada"'; then
  echo "::error::La huella es correcta, pero falló el acceso SSH. Revisa la clave autorizada, el usuario y la disponibilidad del servicio. No se enviaron archivos."
  exit 1
fi
