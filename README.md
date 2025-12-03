# Project kek1 – Setup Ringkas

- Frontend: CRA + CRACO, Tailwind, React 18
- API (serverless, Vercel): berada di `frontend/api/*`
- Driver DB berurutan: MongoDB → Postgres → MySQL → File (fallback)

## Konfigurasi MongoDB Atlas

1) Buat Cluster gratis (M0), buat Database User, izinkan IP (sementara 0.0.0.0/0 untuk uji cepat).
2) Ambil connection string (Driver: Node.js), ganti `<db_password>` dan tambahkan nama DB (mis. `app_db`).

Contoh:

```
mongodb+srv://USERNAME:PASSWORD_ENCODED@cluster0.xxxxx.mongodb.net/app_db?retryWrites=true&w=majority&appName=Cluster0
```

Jika password mengandung karakter spesial (`@:/#?&`), pastikan di-URL-encode.

3) Set environment variable di Vercel (Project → Settings → Environment Variables):

- `MONGODB_URI` = connection string di atas
- `MONGODB_DB_NAME` = `app_db` (opsional; default `app_db`)

4) Redeploy. Cek health endpoint:

- `GET /api/health-db` → response `{ driver: "mongo", ... }` jika sukses.

## Endpoint Utama

- Auth v2: `/api/auth-v2/register`, `/api/auth-v2/login`, `/api/auth-v2/verify`, `/api/auth-v2/logout`, `/api/auth-v2/users`
- Chat v2: `/api/chat-v2` (GET: conversations), `/api/chat-v2?sessionId=...` (GET: messages), `/api/chat-v2` (POST: kirim pesan)

## Build Lokal

```
cd frontend
npm install
npm run build
```

