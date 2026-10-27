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
ssh-keyscan -p "$PORT" -t ed25519 "$HOST" 2>/dev/null > ~/.ssh/known_hosts.tmp
GOT="$(ssh-keygen -lf ~/.ssh/known_hosts.tmp -E sha256 | awk '{print $2}' | head -n1)"
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
ssh hostinger 'echo "Conexión SSH verificada"'
