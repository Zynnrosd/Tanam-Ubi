# 📊 Sensor Data Scripts

Script untuk mengirim dummy data sensor ke Supabase untuk testing dan development.

## 🚀 Setup

1. **Install dependencies:**
```bash
npm install
```

Ini akan install `dotenv` yang diperlukan untuk script.

2. **Pastikan `.env` sudah dikonfigurasi:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. **Setup tabel di Supabase** (jika belum ada):

Jalankan SQL ini di Supabase SQL Editor:

```sql
CREATE TABLE sensor_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  temperature DOUBLE PRECISION NOT NULL,
  humidity DOUBLE PRECISION NOT NULL,
  pressure DOUBLE PRECISION NOT NULL,
  light DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buat index untuk query lebih cepat
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp DESC);
```

## 📝 Scripts

### 1. Seed Data (24 jam historis)

Mengirim 24 jam data sensor historis (1 data per jam):

```bash
npm run seed-data
```

**Output:**
```
📊 Mulai seed data sensor...
📝 Menyiapkan 24 data untuk dikirim...
✅ Berhasil mengirim 24 data sensor
📍 Data sudah tersimpan di tabel sensor_data
```

### 2. Realtime Data (streaming)

Mengirim data sensor baru setiap 10 detik secara terus-menerus:

```bash
npm run realtime-data
```

**Output:**
```
🚀 Mulai mengirim data sensor realtime...
⏱️  Interval: 10 detik
🛑 Tekan Ctrl+C untuk menghentikan

📡 Data #1 dikirim:
┌─────────────┬────────────────────────────────┐
│ (index)     │ Values                         │
├─────────────┼────────────────────────────────┤
│ Timestamp   │ '01/12/2024, 14:30:45'        │
│ Suhu        │ '25.32°C'                     │
│ Kelembaban  │ '58.45%'                      │
│ Tekanan     │ '1012.15 hPa'                 │
│ Cahaya      │ '450.23 lux'                  │
└─────────────┴────────────────────────────────┘
```

Untuk menghentikan, tekan **Ctrl+C**.

## 🔧 Customization

### Mengubah interval pengiriman data

Edit file `scripts/realtime-sensor-data.js`:

```javascript
// Ubah 10000 menjadi milliseconds yang diinginkan
// 10000 ms = 10 detik
const interval = setInterval(sendRealtimeData, 10000);
```

Contoh:
- 5 detik: `5000`
- 1 detik: `1000`
- 1 menit: `60000`

### Mengubah range nilai sensor

Edit fungsi `generateRealtimeData()` atau `generateSensorData()`:

```javascript
// Contoh: ubah range suhu
temperature: 18 + Math.random() * 12,  // Range: 18-30°C (default: 22-30°C)

// Contoh: ubah range kelembaban
humidity: 30 + Math.random() * 40,     // Range: 30-70% (default: 45-65%)
```

## 🐛 Troubleshooting

### Error: "VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan"

**Solusi:** Pastikan file `.env` ada di root project dan berisi:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### Error: "Table 'sensor_data' not found"

**Solusi:** Buat tabel di Supabase SQL Editor (lihat section Setup di atas).

### Error: "Permission denied"

**Solusi:** Pastikan Row Level Security (RLS) policy di Supabase mengizinkan insert untuk anon key, atau disable RLS untuk development.

## 📋 Workflow Typical

```bash
# 1. Setup awal: seed 24 jam data
npm run seed-data

# 2. Development: streaming data realtime
npm run realtime-data

# 3. Lihat di dashboard
npm run dev
```

## 📚 Referensi

- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Sensor Data Types](../src/types/database.ts)

---

Made with ❤️ for Dashboard Sensor project
