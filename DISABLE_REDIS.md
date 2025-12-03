# Cara Disable Redis (Temporary Fix)

Karena Upstash Redis REST API ada compatibility issue dengan format response `xrange`, 
temporary solution adalah disable Redis dan pakai file storage.

## ⚠️ Trade-off:
- ✅ Chat AKAN berfungsi
- ❌ Data hilang setiap redeploy
- ❌ Akun user hilang setiap redeploy

## 🔧 Cara Disable Redis:

### Option 1: Via Vercel Dashboard (RECOMMENDED)
1. Buka https://vercel.com
2. Project **kek1** → **Settings** → **Environment Variables**
3. **RENAME** (jangan delete) kedua variable ini:
   - `UPSTASH_REDIS_REST_URL` → `DISABLED_UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN` → `DISABLED_UPSTASH_REDIS_REST_TOKEN`
4. Klik **Save**
5. **Redeploy**: Deployments → klik deployment teratas → ... → **Redeploy**
6. Tunggu 2 menit

### Option 2: Hapus dari Code
Edit `frontend/api/_redis.js`:
```javascript
async function getRedis() {
  // FORCE DISABLE Redis
  return null;
  
  // ... rest of code commented out
}
```

## ✅ Setelah Disable:

Log di Vercel akan show:
```
[Chat API] Redis status: ❌ Using file storage
[Chat API] File storage: Saving message for email_xxx...
[Chat API] File storage: Message saved, total messages: 1
[Chat API] File storage: Returning 1 messages for email_xxx...
```

Chat akan **100% berfungsi** dengan file storage!

## 🔄 Cara Enable Redis Lagi:

1. Rename kembali ke nama asli:
   - `DISABLED_UPSTASH_REDIS_REST_URL` → `UPSTASH_REDIS_REST_URL`
   - `DISABLED_UPSTASH_REDIS_REST_TOKEN` → `UPSTASH_REDIS_REST_TOKEN`
2. Redeploy

## 🎯 Permanent Fix (Nanti):

Ganti dari Upstash Redis ke:
- **Vercel KV** (official Vercel Redis, full compatibility)
- **MongoDB Atlas** (NoSQL database, free tier)
- **Supabase PostgreSQL** (relational database)

Atau tunggu fix compatibility issue dengan Upstash REST API format.
