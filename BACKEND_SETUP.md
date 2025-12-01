# 🚀 Cara Menjalankan Backend

## Opsi 1: Double-click file (TERMUDAH!)
```
backend/run_backend.bat
```
- Otomatis buka terminal baru
- Backend jalan di `http://127.0.0.1:8000`
- Tekan CTRL+C untuk stop

## Opsi 2: Jalankan Frontend + Backend bersamaan
```
run_all.bat
```
- Buka dua terminal secara bersamaan
- Frontend di `http://localhost:3000` (atau 3001 jika port 3000 sudah terpakai)
- Backend di `http://127.0.0.1:8000`

## Opsi 3: Manual dari terminal
```powershell
cd backend
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```

## URLs Penting
| Layanan | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://127.0.0.1:8000/api/ |
| API Docs (Swagger) | http://127.0.0.1:8000/docs |
| Contact Endpoint | POST http://127.0.0.1:8000/api/contact |

## Troubleshooting
- **Port 8000 sudah dipakai?** Ubah port di `run_backend.bat` line 4
- **Port 3000 sudah dipakai?** Frontend otomatis pindah ke 3001
- **Python tidak ditemukan?** Install Python 3.10+ dari python.org

## Data Kontak
Semua kontak otomatis tersimpan di:
```
backend/contacts.json
```
