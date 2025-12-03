# ⚠️ PENTING: Cek Upstash Redis Setup

## Masalah yang Terjadi:
1. ❌ **Chat hilang saat refresh** → Data tidak tersimpan permanen
2. ❌ **Chat admin dan user tidak terhubung** → sessionId format berbeda (sudah difix)

## Root Cause:
**Redis belum aktif!** Data masih tersimpan di `/tmp` (file storage) yang reset setiap redeploy Vercel.

---

## ✅ Solusi: Pastikan Upstash Redis Credentials di Vercel

### Langkah Verifikasi:

1. **Buka Vercel Dashboard:** https://vercel.com/dashboard
2. Pilih project **kek1**
3. **Settings** → **Environment Variables**
4. **CEK apakah ada 2 variable ini:**

   ```
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```

5. **Jika TIDAK ADA atau SALAH:**
   
   **a. Buka Upstash:**
   - https://console.upstash.com
   - Login (pakai GitHub/Google)
   - Pilih database `kek1-user` atau yang Anda buat
   - Klik tab **REST** (bukan Redis CLI)
   - Copy **UPSTASH_REDIS_REST_URL** dan **UPSTASH_REDIS_REST_TOKEN**

   **b. Paste ke Vercel:**
   - Di Vercel Environment Variables, klik **Add New**
   - Variable 1:
     - Name: `UPSTASH_REDIS_REST_URL`
     - Value: `https://sharp-sunbird-32870.upstash.io` (dari Upstash)
     - Environment: ☑️ Production ☑️ Preview ☑️ Development
   - Variable 2:
     - Name: `UPSTASH_REDIS_REST_TOKEN`
     - Value: (token panjang dari Upstash)
     - Environment: ☑️ Production ☑️ Preview ☑️ Development
   - **Save**

6. **Redeploy:**
   ```bash
   cd C:\Users\Vivo7\Desktop\kek1
   git commit --allow-empty -m "trigger: activate Redis"
   git push
   ```

---

## Cara Tes Setelah Redis Aktif:

1. **Login sebagai User** (`test@gmail.com`)
2. Buka `/chat`
3. Kirim pesan: "Halo admin"
4. **Logout**
5. **Login sebagai Admin** (`gegefans0@gmail.com`)
6. Buka Dashboard → Tab **Chat**
7. Sidebar kiri akan tampil:
   - `test@gmail.com` (klik untuk buka chat)
8. Pesan "Halo admin" akan muncul di kanan
9. Admin balas: "Halo, ada yang bisa dibantu?"
10. **Logout admin**
11. **Login lagi sebagai user `test@gmail.com`**
12. Buka `/chat` → **pesan balasan admin muncul!** ✅

---

## ⚙️ Cara Cek Redis Sudah Aktif

**Di Browser Console (F12):**

Setelah redeploy, buka website → F12 → Console tab → refresh page.

**Jika Redis AKTIF:**
```
(tidak ada error "Failed to connect Redis")
```

**Jika Redis TIDAK AKTIF:**
```
REDIS_URL detected but @upstash/redis does not support redis:// format. Using file storage fallback.
```

**Cek di Upstash Dashboard:**
1. Login ke https://console.upstash.com
2. Pilih database Anda
3. Klik **Data Browser**
4. Lihat key `auth:users` dan `chat:stream:*`
5. Jika ada data → Redis aktif ✅

---

## 🔧 Fix yang Sudah Dilakukan (Commit Terakhir):

✅ **User sessionId sekarang selalu pakai format `email_xxx`**
- Sebelumnya: `user_123456789_abc` (random, tidak match dengan admin)
- Sekarang: `email_test_at_gmail_dot_com` (sama dengan yang admin lihat)

✅ **Fallback ke localStorage userEmail**
- Jika `userEmail` prop tidak ada, ambil dari `localStorage.getItem('userEmail')`

---

## 📌 Next Steps:

1. **Cek Vercel Environment Variables** (pastikan UPSTASH_REDIS_REST_URL dan TOKEN ada)
2. **Redeploy** jika belum
3. **Tes chat** antara user dan admin
4. **Refresh page** → chat tidak hilang (karena tersimpan di Redis)

---

**Kabari saya jika:**
- ✅ Redis credentials sudah di Vercel → saya trigger redeploy
- ❌ Belum ada credentials → ikuti panduan di atas untuk setup Upstash
