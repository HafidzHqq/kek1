# MySQL Database Setup

## Setup MySQL di Vercel

### 1. Pilih MySQL Provider

#### A. PlanetScale (Recommended - Free Tier)
1. Buat akun: https://planetscale.com/
2. Create new database: `inovatech-db`
3. Region: `AWS ap-southeast-1` (Singapore - terdekat Indonesia)
4. Copy connection string dari dashboard
5. Format: `mysql://user:pass@host.planetscale.service.com/database?sslaccept=strict`

#### B. Railway (Alternatif)
1. Buat akun: https://railway.app/
2. New Project → Provision MySQL
3. Copy `DATABASE_URL` dari Variables tab

#### C. Aiven (Free Tier)
1. Buat akun: https://aiven.io/
2. Create MySQL service
3. Copy connection string

### 2. Set Environment Variable di Vercel

1. Buka: https://vercel.com/hafidzhqqs-projects/kek1/settings/environment-variables
2. Tambahkan variable:
   - **Key:** `DATABASE_URL` atau `MYSQL_URL`
   - **Value:** `mysql://user:password@host:port/database`
   - **Environments:** Production, Preview, Development
3. **Save**

### 3. Redeploy

Vercel otomatis detect MySQL dan akan:
- Create tables otomatis (users, sessions, messages)
- Migrate data dari file storage
- Faster performance dengan indexing

## Database Schema

### Table: users
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
)
```

### Table: sessions
```sql
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_id (session_id),
  INDEX idx_email (email),
  INDEX idx_token (token(255)),
  INDEX idx_expires (expires_at)
)
```

### Table: messages
```sql
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL UNIQUE,
  session_id VARCHAR(255) NOT NULL,
  sender VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `read` BOOLEAN DEFAULT FALSE,
  INDEX idx_message_id (message_id),
  INDEX idx_session_id (session_id),
  INDEX idx_sender (sender),
  INDEX idx_created_at (created_at),
  INDEX idx_session_created (session_id, created_at)
)
```

## Testing MySQL Connection

### Local Test (Optional)
```bash
cd frontend
node -e "const {getPool} = require('./api/_mysql'); getPool().then(db => console.log(db ? '✅ Connected' : '❌ Failed'))"
```

### Vercel Logs
Setelah deployment, cek logs:
```
✅ [MySQL] Connection pool created successfully
✅ [MySQL] Tables initialized
✅ [Auth] Using MySQL
✅ [Chat] Using MySQL 💾
```

## Migration dari File Storage

**Otomatis!** API akan:
1. Detect MySQL ada → pakai MySQL
2. MySQL tidak ada → fallback ke file storage
3. No data loss during transition

## Performance Benefits

| Feature | File Storage | MySQL |
|---------|--------------|-------|
| Data persistence | ❌ Lost on redeploy | ✅ Permanent |
| Concurrent users | ⚠️ Race conditions | ✅ ACID transactions |
| Query speed | 🐌 O(n) full scan | ⚡ O(log n) indexed |
| Scalability | ❌ Limited | ✅ Unlimited |
| Backup | ❌ Manual | ✅ Automatic |

## Troubleshooting

### Error: "Access denied for user"
- Check DATABASE_URL format
- Verify username/password correct
- Check IP whitelist (allow all: `0.0.0.0/0`)

### Error: "Connection timeout"
- Check SSL settings: add `?sslaccept=strict`
- Verify database is running
- Check region (use closest to Vercel)

### Fallback to File Storage
Jika MySQL gagal, API otomatis fallback ke file storage dengan log:
```
[Auth] Using File Storage
[Chat] Using File Storage 📂
```

## Free Tier Limits

| Provider | Storage | Rows | Bandwidth |
|----------|---------|------|-----------|
| PlanetScale | 5GB | 1B | 100GB/mo |
| Railway | 512MB | - | - |
| Aiven | 100MB | - | 10GB/mo |

**Recommendation:** PlanetScale (paling generous free tier)
