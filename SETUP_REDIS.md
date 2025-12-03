# 🚀 Setup Redis Gratis untuk Penyimpanan User

Data user dan session sekarang **sudah otomatis tersimpan ke Redis** (Upstash) jika environment variable tersedia. Jika tidak ada Redis, fallback ke file `/tmp` (tapi data hilang saat redeploy).

## ✅ Langkah Setup Upstash Redis (5 Menit)

### 1️⃣ Daftar Upstash (Gratis)
1. Buka: **https://console.upstash.com**
2. Klik **Sign Up** (bisa pakai GitHub/Google/Email)
3. Verifikasi email jika diminta

### 2️⃣ Buat Redis Database
1. Setelah login, klik **Create Database** (tombol hijau)
2. Pilih:
   - **Name**: `kek1-production` (atau nama bebas)
   - **Type**: **Regional**
   - **Region**: Pilih terdekat dengan Vercel region Anda
     - Kalau Vercel di **Washington DC (iad1)** → pilih **US East (Virginia)**
     - Kalau Vercel di **Singapore** → pilih **Asia Pacific (Singapore)**
   - **TLS**: Enabled (default)
   - **Eviction**: No Eviction (default)
3. Klik **Create** (tunggu ~10 detik)

### 3️⃣ Copy Kredensial Redis
Setelah database dibuat, Anda akan melihat dashboard database.

Scroll ke bagian **REST API** (bukan Redis tab):

1. Copy **UPSTASH_REDIS_REST_URL**
   - Format: `https://YOUR-ENDPOINT.upstash.io`
   - Contoh: `https://gusc1-merry-cat-12345.upstash.io`

2. Copy **UPSTASH_REDIS_REST_TOKEN**
   - Format: String panjang seperti: `AYMxASQgNDQ5...`
   - Klik icon **Copy** di sebelahnya

### 4️⃣ Setup di Vercel
1. Buka dashboard Vercel: **https://vercel.com**
2. Pilih project **kek1**
3. Klik **Settings** → **Environment Variables**
4. **HAPUS** variable `REDIS_URL` jika ada (Redis Labs tidak support)
5. Tambahkan 2 variable baru:

| Name | Value |
|------|-------|
| `UPSTASH_REDIS_REST_URL` | `https://gusc1-xxx.upstash.io` (paste dari Upstash) |
| `UPSTASH_REDIS_REST_TOKEN` | `AYMxASQg...` (paste dari Upstash) |

6. **Environment**: Pilih **Production**, **Preview**, **Development** (centang semua)
7. Klik **Save** untuk masing-masing variable

### 5️⃣ Redeploy
Setelah environment variables tersimpan, redeploy project:

**OPSI A - Via Git Push:**
```bash
cd C:\Users\Vivo7\Desktop\kek1
git commit --allow-empty -m "activate Upstash Redis"
git push
```

**OPSI B - Via Dashboard:**
1. Di dashboard Vercel, buka tab **Deployments**
2. Klik deployment teratas (yang terbaru)
3. Klik tombol **⋮** (titik tiga) di kanan
4. Pilih **Redeploy**
5. Konfirmasi

### 6️⃣ Tes
1. Tunggu deployment selesai (~2 menit)
2. Buka website Vercel: `https://your-app.vercel.app`
3. **Register akun baru**
4. **Logout** (klik user dropdown → Logout)
5. **Login lagi** dengan email & password yang sama → ✅ **Berhasil!** (data tersimpan permanen)

---

## 📊 Monitoring Redis (Optional)

Lihat data di Upstash dashboard:
1. Buka database `kek1-production` di Upstash
2. Klik tab **Data Browser**
3. Akan terlihat:
   - `auth:users` → Hash berisi semua akun terdaftar
   - `auth:sessions` → Hash berisi session token aktif
   - `chat:stream:*` → Stream pesan chat per user

---

## 💡 Keuntungan Upstash

✅ **Gratis selamanya**: 10,000 commands/day (cukup untuk ~300 user/hari)
✅ **Serverless-native**: Auto-scaling, bayar per request
✅ **Global edge**: Latency rendah
✅ **REST API**: Kompatibel dengan Vercel Edge Functions
✅ **Dashboard GUI**: Lihat data real-time

---

## ❓ FAQ

**Q: Redis gratis cukup?**  
A: Ya! 10,000 commands/day = ~300 user aktif/hari. Untuk upgrade: https://upstash.com/pricing

**Q: Bagaimana jika Redis down?**  
A: Otomatis fallback ke file storage (tapi data hilang saat redeploy).

**Q: Bisa pakai Redis Labs?**  
A: Tidak, `@upstash/redis` hanya support REST API. Redis Labs butuh `ioredis` (package tambahan).

**Q: Data lama di file `/tmp` hilang?**  
A: Ya, setelah setup Upstash, data lama tidak otomatis migrate. User harus register ulang sekali.

**Q: Region mana yang harus dipilih?**  
A: Pilih yang paling dekat dengan Vercel deployment region Anda (lihat di Vercel deployment log: "Running build in Washington, D.C." → pilih US East).

---

## ✅ Checklist

- [ ] Daftar Upstash.com
- [ ] Create Redis database (Regional, pilih region terdekat)
- [ ] Copy UPSTASH_REDIS_REST_URL dari tab REST API
- [ ] Copy UPSTASH_REDIS_REST_TOKEN dari tab REST API
- [ ] Hapus REDIS_URL dari Vercel (jika ada)
- [ ] Paste kedua variable ke Vercel Environment Variables
- [ ] Centang Production, Preview, Development
- [ ] Save
- [ ] Redeploy project
- [ ] Tunggu deployment selesai
- [ ] Tes: Register → Logout → Login lagi
- [ ] ✅ Sukses! Data tersimpan permanen

---

**Need help?** Screenshot error atau chat di GitHub Issues!

### 5️⃣ Redeploy
1. Di dashboard Vercel, buka tab **Deployments**
2. Klik titik 3 di deployment terakhir → **Redeploy**
3. Atau commit dummy:
```bash
cd C:\Users\Vivo7\Desktop\kek1
git commit --allow-empty -m "redeploy: activate Redis storage"
git push
```

### 6️⃣ Tes
1. Buka website Vercel: `https://your-app.vercel.app`
2. **Register akun baru**
3. **Logout**
4. **Login lagi** dengan akun yang sama → ✅ **Berhasil!** (data tidak hilang)

---

## 📊 Monitoring Redis (Optional)

Lihat data di Upstash dashboard:
1. Buka database `kek1-users` di Upstash
2. Klik tab **Data Browser**
3. Akan terlihat:
   - `auth:users` → Semua akun terdaftar
   - `auth:sessions` → Semua session token aktif
   - `chat:stream:*` → Pesan chat per user

---

## 🔧 Cara Kerja

**File yang menggunakan Redis:**
- `frontend/api/_redis.js` → Koneksi ke Upstash
- `frontend/api/auth/[...slug].js` → Simpan user & session
- `frontend/api/chat.js` → Simpan pesan chat

**Logika:**
```javascript
if (Redis tersedia) {
  → Simpan ke Redis (permanen)
  → Simpan ke file sebagai backup
} else {
  → Simpan ke file saja (hilang saat redeploy)
}
```

---

## ❓ FAQ

**Q: Redis gratis cukup?**  
A: Ya! 10,000 commands/day = ~300 user aktif/hari.

**Q: Bagaimana jika Redis down?**  
A: Otomatis fallback ke file storage (tapi data hilang saat redeploy).

**Q: Bisa pakai database lain?**  
A: Bisa! Alternatif: Vercel KV, MongoDB Atlas, Supabase PostgreSQL.

**Q: Data lama di file `/tmp` hilang?**  
A: Ya, setelah setup Redis, data lama tidak otomatis migrate. User harus register ulang sekali.

---

## ✅ Checklist

- [ ] Daftar Upstash
- [ ] Buat Redis database
- [ ] Copy UPSTASH_REDIS_REST_URL
- [ ] Copy UPSTASH_REDIS_REST_TOKEN
- [ ] Paste ke Vercel Environment Variables
- [ ] Redeploy project
- [ ] Tes register + logout + login lagi

---

**Need help?** Hubungi developer atau buka issue di GitHub!
