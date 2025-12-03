# 🚀 Quick MySQL Setup

## Setup dalam 5 Menit

### 1️⃣ Buat Database di PlanetScale (Gratis)

1. Daftar: **https://planetscale.com/**
2. Create database: `inovatech-db`
3. Region: **AWS Singapore** (ap-southeast-1)
4. Copy connection string

### 2️⃣ Setup Vercel Environment

1. Buka: **https://vercel.com/hafidzhqqs-projects/kek1/settings/environment-variables**
2. Add new variable:
   ```
   Name:  DATABASE_URL
   Value: mysql://xxxxxx@xxxxxx.aws.connect.psdb.cloud/inovatech-db?ssl={"rejectUnauthorized":true}
   ```
3. Apply to: **Production + Preview + Development**
4. Save

### 3️⃣ Redeploy

Vercel akan auto-deploy. Cek logs setelah deployment:

```
✅ [MySQL] Connection pool created successfully
✅ [MySQL] Tables initialized  
✅ [Auth] Using MySQL
✅ [Chat] Using MySQL 💾
```

## ✅ Selesai!

Aplikasi sekarang pakai MySQL. Data **permanent** dan tidak hilang lagi saat redeploy.

## 🔄 Rollback (jika ada masalah)

Hapus `DATABASE_URL` di Vercel → otomatis balik ke file storage.

## 📊 Monitoring

Cek PlanetScale Dashboard untuk:
- Query statistics
- Storage usage
- Connection analytics

---

**Free Tier PlanetScale:**
- ✅ 5GB storage
- ✅ 1 billion rows
- ✅ 100GB bandwidth/month
- ✅ Automatic backups

Lebih dari cukup untuk aplikasi production!
