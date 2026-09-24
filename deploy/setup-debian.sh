#!/bin/sh
# Prépare un VPS Debian vierge (12 ou 13) pour Digest. À lancer une fois, en root :
#   curl -fsSL https://raw.githubusercontent.com/seishiiinsan/digest/main/deploy/setup-debian.sh | sh -s -- gabin
#
# - crée l'utilisateur <nom> (sudo + docker) avec les clés SSH de root ;
# - SSH : connexion par clé uniquement, root interdit (seulement si la clé est bien en place) ;
# - pare-feu ufw : 22, 80 et 443 ouverts, le reste fermé ;
# - mises à jour de sécurité automatiques ;
# - Docker et Docker Compose depuis le dépôt officiel de Docker ;
# - 2 Go de swap si le serveur n'en a pas.
set -eu

user="${1:-}"
if [ "$(id -u)" -ne 0 ] || [ -z "$user" ]; then
  echo "Usage (en root) : sh setup-debian.sh <utilisateur>" >&2
  exit 1
fi

. /etc/os-release
if [ "$ID" != "debian" ]; then
  echo "Script prévu pour Debian (détecté : $ID)." >&2
  exit 1
fi

log() { printf '\n==> %s\n' "$1"; }

log "Mise à jour du système"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl sudo ufw unattended-upgrades

log "Utilisateur $user"
if ! id "$user" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$user"
fi
usermod -aG sudo "$user"
# sudo sans mot de passe : le compte n'en a pas, la connexion se fait par clé SSH.
echo "$user ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/90-$user"
chmod 440 "/etc/sudoers.d/90-$user"

home=$(getent passwd "$user" | cut -d: -f6)
if [ -s /root/.ssh/authorized_keys ] && [ ! -s "$home/.ssh/authorized_keys" ]; then
  install -d -m 700 -o "$user" -g "$user" "$home/.ssh"
  install -m 600 -o "$user" -g "$user" /root/.ssh/authorized_keys "$home/.ssh/authorized_keys"
fi

log "SSH"
if [ -s "$home/.ssh/authorized_keys" ]; then
  cat > /etc/ssh/sshd_config.d/10-digest.conf <<'CONF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
CONF
  systemctl reload ssh
  echo "Connexion par clé uniquement, root désactivé."
else
  echo "ATTENTION : aucune clé SSH pour $user, SSH laissé inchangé pour ne pas vous bloquer."
  echo "Ajoutez votre clé publique dans $home/.ssh/authorized_keys puis relancez ce script."
fi

log "Pare-feu"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

log "Mises à jour de sécurité automatiques"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'CONF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
CONF

log "Docker"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $VERSION_CODENAME stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
usermod -aG docker "$user"
systemctl enable --now docker

log "Swap"
if [ -z "$(swapon --show)" ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

log "Terminé"
docker compose version
cat <<NEXT

Prochaines étapes, connecté en tant que $user (ssh $user@<ip>) :
  git clone https://github.com/seishiiinsan/digest.git && cd digest
  cp .env.example .env    # puis remplir DOMAIN, secrets, SMTP, ADMIN_EMAILS (voir README)
  docker compose -f compose.yaml -f deploy/compose.prod.yaml up -d

Note : seuls les ports publiés par Docker (80/443 via Caddy) sont joignables ;
Docker contourne ufw pour ses ports, d'où l'absence de port publié pour web et db.
NEXT
