#!/bin/bash
# Deploy pyArchInit website to ganesh@10.0.1.13
# Usage: ./scripts/deploy.sh

set -e

SERVER="ganesh@10.0.1.13"
REMOTE_DIR="/home/ganesh/pyarchinit-website"
PROJECT_NAME="pyarchinit-website"

echo "═══════════════════════════════════════"
echo "  pyArchInit Website Deploy"
echo "═══════════════════════════════════════"

# 1. Build check
echo ""
echo "→ Verifico TypeScript..."
npx tsc --noEmit
echo "  ✓ TypeScript OK"

# 2. Sync files to server (exclude node_modules, .next, uploads, .git)
echo ""
echo "→ Sincronizzazione file al server..."
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='uploads' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='*.mp4' \
  -e "ssh -v" \
  ./ ${SERVER}:${REMOTE_DIR}/

# 3. Copy .env if not exists on server
echo ""
echo "→ Verifico .env sul server..."
ssh -v ${SERVER} "test -f ${REMOTE_DIR}/.env || cp ${REMOTE_DIR}/.env.example ${REMOTE_DIR}/.env"

# 4. Build and deploy with Docker Compose
echo ""
echo "→ Build e deploy con Docker Compose..."
ssh -v ${SERVER} "cd ${REMOTE_DIR} && \
  docker compose down --remove-orphans 2>/dev/null; \
  docker compose up -d --build && \
  echo '→ Aspetto che il DB sia pronto...' && \
  sleep 5 && \
  docker compose exec -T app npx prisma db push && \
  docker compose exec -T app npx prisma db seed && \
  echo '' && \
  echo '═══════════════════════════════════════' && \
  echo '  ✓ Deploy completato!' && \
  echo '  Sito: http://10.0.1.13' && \
  echo '  Admin: http://10.0.1.13/admin/login' && \
  echo '  User: admin@pyarchinit.org / admin123' && \
  echo '═══════════════════════════════════════'"

echo ""
echo "Done!"
