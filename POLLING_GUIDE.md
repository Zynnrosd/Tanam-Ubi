# 🔄 Realtime Data - Alternatif Polling (Gratis)

Implementasi realtime data menggunakan **Polling** - tidak perlu Supabase Realtime yang berbayar!

## 📊 Bagaimana Cara Kerjanya?

### Polling Flow:
```
Page Load
    ↓
Fetch 60 data terakhir dari database
    ↓
Setiap 5 detik:
  - Query database untuk data terbaru
  - Jika ada data baru → update chart
  - Jika error → status disconnect
    ↓
User pause/resume dengan tombol di UI
```

## ✅ Keuntungan Polling:

| Aspek | Polling | Realtime |
|-------|---------|----------|
| **Biaya** | 🟢 Gratis | 🔴 Berbayar |
| **Setup** | 🟢 Simple | 🔴 Kompleks |
| **Latency** | 🟡 5 detik | 🟢 <1 detik |
| **Bandwidth** | 🟡 Regular | 🟢 Minimal |
| **Skalabilitas** | 🟡 Moderate | 🟢 Unlimited |

## 🚀 Cara Pakai

### 1. Pastikan `.env` dikonfigurasi:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Buat tabel di Supabase:
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

CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp DESC);
```

### 3. Jalankan app:
```bash
npm run dev
```

### 4. Stream data:
```bash
npm run realtime-data
```

Buka `http://localhost:5173/realtime` → data akan auto-update setiap 5 detik!

## 🎛️ Customize Interval

Edit `src/pages/Realtime.tsx`:

```typescript
const POLL_INTERVAL = 5000 // ms (5 detik)
```

Pilihan interval:
- `2000` = 2 detik (lebih responsif, lebih query)
- `5000` = 5 detik (default - balanced)
- `10000` = 10 detik (hemat bandwidth)
- `30000` = 30 detik (minimal query)

## 📈 Performance Tips

### Untuk Dashboard Besar:
```typescript
// Kurangi data points yang disimpan
const MAX_DATA_POINTS = 30  // dari 60

// Increase polling interval
const POLL_INTERVAL = 10000  // 10 detik
```

### Untuk Real-Time Responsif:
```typescript
// Increase data points
const MAX_DATA_POINTS = 120  // 2 jam data

// Decrease polling interval
const POLL_INTERVAL = 2000   // 2 detik
```

## 🐛 Troubleshooting

### ❌ Data tidak update

**Cek:**
1. Network tab di DevTools - ada request ke Supabase?
2. Console - ada error message?
3. Pastikan `.env` punya VITE_SUPABASE_URL

**Solusi:**
```bash
# Cek connection
npm run dev

# Di browser console
fetch('https://your-project.supabase.co/rest/v1/sensor_data?limit=1')
  .then(r => r.json())
  .then(console.log)
```

### ❌ Terlalu banyak query

**Solusi:** Increase polling interval
```typescript
const POLL_INTERVAL = 15000  // 15 detik
```

### ✅ Monitor Queries

Di Supabase Dashboard:
1. **Analytics** → **Database**
2. Lihat query volume & latency

## 🔌 Mode Operasi

### Demo Mode (tanpa Supabase)
- Aktif jika `VITE_SUPABASE_URL` kosong
- Generate data fake
- Tidak perlu `.env`

### Real Mode (dengan polling)
- Aktif jika `VITE_SUPABASE_URL` valid
- Query database setiap 5 detik
- Perlu `.env` + tabel di Supabase

## 💡 Alternatif Lainnya

Jika ingin lebih responsif & gratis:

### 1. **Webhook + WebSocket** (DIY)
```
Device → Webhook → Your Backend → WebSocket → Dashboard
```
Cocok untuk: IoT dengan backend server sendiri

### 2. **MQTT** (untuk IoT)
```
Device → MQTT Broker → Dashboard
```
Cocok untuk: Sensor dengan MQTT support

### 3. **Edge Function** (Supabase)
```
Polling di Edge → WebSocket ke client
```
Cocok untuk: Scale besar dengan kontrol biaya

## 📚 Referensi

- [Supabase Query Guide](https://supabase.com/docs/guides/api)
- [React Polling Patterns](https://react.dev/learn/you-might-not-need-an-effect)

---

**Tip:** Polling polling sangat cocok untuk aplikasi monitoring dengan update frequency 5-30 detik. Lebih sering dari itu, pertimbangkan Realtime atau WebSocket!

Made with ❤️ for Dashboard Sensor project
