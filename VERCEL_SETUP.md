# 🚀 SETUP VERCEL ENVIRONMENT VARIABLES

## Langkah-Langkah (5 Menit):

### 1️⃣ Buka Vercel Dashboard
🔗 **https://vercel.com/dashboard**
- Login dengan akun Anda

### 2️⃣ Pilih Project
- Cari project **kek1** (atau nama project Anda)
- Klik untuk buka

### 3️⃣ Buka Settings
- Klik tab **Settings** di bagian atas
- Scroll ke bawah, pilih **Environment Variables**

### 4️⃣ Tambahkan Variable Redis
Klik **Add New** dan masukkan:

```
Name (Key):
REDIS_URL

Value:
redis://default:jenbs16mW1bjclUQlKP36oNuulzcP7Cc@redis-11507.crce194.ap-seast-1-1.ec2.cloud.redislabs.com:11507

Environment:
☑️ Production
☑️ Preview  
☑️ Development

(Centang semua 3 options)
```

**Klik Save**

### 5️⃣ Redeploy Project

**OPSI A - Via Git Push:**
```bash
cd C:\Users\Vivo7\Desktop\kek1
git commit --allow-empty -m "trigger redeploy with Redis"
git push
```

**OPSI B - Via Dashboard:**
1. Buka tab **Deployments** di Vercel
2. Klik deployment paling atas (yang terbaru)
3. Klik tombol **⋮** (titik tiga) di kanan
4. Pilih **Redeploy**
5. Konfirmasi

### 6️⃣ Tunggu Deploy Selesai
- Status akan berubah dari "Building..." → "Ready"
- Biasanya 1-2 menit

### 7️⃣ Tes Website
1. Buka website Vercel Anda (misalnya: `https://kek1.vercel.app`)
2. **Register akun baru**
3. **Logout** (klik user dropdown → Logout)
4. **Login lagi** dengan email & password yang sama
5. ✅ **Berhasil masuk!** (data tersimpan di Redis)

---

## 🎯 Verifikasi Redis Aktif

Setelah login sebagai **admin**, buka `/chat`:
- Sidebar kiri akan tampil **Daftar User**
- Semua akun terdaftar akan muncul di list
- Klik user untuk buka room chat privat

---

## ❓ Troubleshooting

**Q: "Cannot read property 'hgetall' of null"**
- A: Environment variable belum tersimpan. Coba redeploy lagi.

**Q: Data masih hilang setelah redeploy**
- A: Pastikan `REDIS_URL` sudah di-save di Environment Variables (Production, Preview, Development).

**Q: Register error "Email sudah terdaftar" padahal baru pertama kali**
- A: ✅ Bagus! Artinya Redis sudah aktif dan data tersimpan.

---

## 📸 Screenshot Guide

### Tampilan Environment Variables di Vercel:
```
┌─────────────────────────────────────────────────────┐
│ Environment Variables                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Name (Key)         │ Value                          │
│────────────────────┼────────────────────────────────│
│ REDIS_URL          │ redis://default:jenbs16...     │
│                    │ [Sensitive - hidden]           │
│                    │                                │
│ Environments:                                        │
│ ☑️ Production  ☑️ Preview  ☑️ Development          │
│                                                      │
│ [Edit] [Delete]                                     │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] Buka Vercel Dashboard
- [ ] Pilih project kek1
- [ ] Settings → Environment Variables
- [ ] Add New → Name: `REDIS_URL`
- [ ] Paste value dari file ini
- [ ] Centang Production, Preview, Development
- [ ] Save
- [ ] Redeploy (git push atau manual)
- [ ] Tunggu deploy selesai
- [ ] Tes: Register → Logout → Login lagi
- [ ] ✅ Sukses! Data tidak hilang

---

**Butuh bantuan?** Kirim screenshot error atau status deployment!
