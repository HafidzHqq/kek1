# 🚀 Setup Redis Gratis untuk Penyimpanan User

Data user dan session sekarang **sudah otomatis tersimpan ke Redis** (Upstash) jika environment variable tersedia. Jika tidak ada Redis, fallback ke file `/tmp` (tapi data hilang saat redeploy).

## ✅ Langkah Setup Redis Gratis (5 Menit)

### 1️⃣ Daftar Upstash (Gratis)
1. Buka: **https://upstash.com**
2. Klik **Sign Up** (bisa pakai GitHub/Google)
3. Verifikasi email

### 2️⃣ Buat Redis Database
1. Setelah login, klik **Create Database**
2. Pilih:
   - **Name**: `kek1-users` (atau nama bebas)
   - **Type**: Regional
   - **Region**: Pilih terdekat (misalnya: `ap-southeast-1` untuk Asia)
   - **Plan**: Free (10,000 commands/day)
3. Klik **Create**

### 3️⃣ Copy Kredensial Redis
Setelah database dibuat, scroll ke bawah ke bagian **REST API**:
1. Copy **UPSTASH_REDIS_REST_URL** (contoh: `https://xxx.upstash.io`)
2. Copy **UPSTASH_REDIS_REST_TOKEN** (string panjang)

### 4️⃣ Setup di Vercel
1. Buka dashboard Vercel: **https://vercel.com**
2. Pilih project **kek1**
3. Klik **Settings** → **Environment Variables**
4. Tambahkan variable:

**OPSI A: Redis Labs (Recommended - Sudah Ada):**
| Name | Value |
|------|-------|
| `REDIS_URL` | `redis://default:jenbs16mW1bjclUQlKP36oNuulzcP7Cc@redis-11507.crce194.ap-seast-1-1.ec2.cloud.redislabs.com:11507` |

**OPSI B: Upstash (Alternatif):**
| Name | Value |
|------|-------|
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` (dari dashboard Upstash) |
| `UPSTASH_REDIS_REST_TOKEN` | `AxxxxxxxxxxxA` (dari dashboard Upstash) |

5. **Environment**: Pilih **Production**, **Preview**, **Development** (centang semua)
6. Klik **Save**

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
