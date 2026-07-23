# Umami: Migration auf den eigenen VPS

Stand Juli 2026: Umami läuft auf einem Vercel-Free-Tier (`umami-eta-inky.vercel.app`).
Ziel: Self-Hosting auf dem eigenen VPS (derselbe wie chat.bern-hypnose.ch) unter
`stats.bern-hypnose.ch`. Die Website lädt den Tracker bereits über den First-Party-Proxy
`/stats/` (netlify.toml) — nach der Migration muss dort nur das Redirect-Ziel getauscht werden.

## 1. DNS

A-Record anlegen: `stats.bern-hypnose.ch` → IP des VPS (83.228.240.170).

## 2. Docker Compose auf dem VPS

```bash
mkdir -p /opt/umami && cd /opt/umami
cat > docker-compose.yml <<'EOF'
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    restart: always
    ports:
      - "127.0.0.1:3100:3000"
    environment:
      DATABASE_URL: postgresql://umami:CHANGE_ME_DB_PASSWORD@db:5432/umami
      APP_SECRET: CHANGE_ME_RANDOM_64_CHARS
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: CHANGE_ME_DB_PASSWORD
    volumes:
      - umami-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami"]
      interval: 5s
      retries: 5
volumes:
  umami-db:
EOF
docker compose up -d
```

Secrets generieren: `openssl rand -hex 32` für `APP_SECRET`, eigenes DB-Passwort setzen.

## 3. Nginx-vHost + TLS

```nginx
server {
    server_name stats.bern-hypnose.ch;
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    listen 80;
}
```

Dann `certbot --nginx -d stats.bern-hypnose.ch` (wie schon für chat.bern-hypnose.ch).

## 4. Umami einrichten

1. `https://stats.bern-hypnose.ch` öffnen, Login `admin` / `umami`, **Passwort sofort ändern**.
2. Website anlegen: `bern-hypnose.ch` → neue Website-ID kopieren.
3. Historische Daten (optional): Umami Cloud/Vercel-Instanz bietet keinen offiziellen
   Datenbank-Export über die UI. Pragmatisch: alte Instanz noch 2–3 Monate parallel
   laufen lassen (Read-only für Vergleiche), neu bei null starten. Falls die alte
   Postgres (Vercel-Storage) erreichbar ist: `pg_dump` → `pg_restore` in den Container.

## 5. Website umstellen (dieses Repo)

1. `netlify.toml`: in den beiden `/stats/*`-Redirects `umami-eta-inky.vercel.app`
   durch `stats.bern-hypnose.ch` ersetzen.
2. Neue Website-ID setzen: Netlify-Env `PUBLIC_UMAMI_WEBSITE_ID=<neue-id>`
   (Fallback-ID steht in `src/components/Analytics.astro`).
3. Deploy. Prüfen: Network-Tab → `/stats/script.js` lädt (200), `POST /stats/api/send` → 200,
   Events erscheinen im neuen Dashboard.
4. Nach Parallellauf: Vercel-Projekt löschen.

## Warum der Proxy?

Der Tracker lädt von der eigenen Domain (`/stats/script.js` mit `data-host-url="/stats"`),
dadurch blockieren Adblocker/Brave die Requests deutlich seltener als bei einer
Drittdomain — bessere Datenqualität, gleiche Privacy (Umami bleibt cookielos, DSGVO-konform,
wie in der Datenschutzrichtlinie beschrieben).
