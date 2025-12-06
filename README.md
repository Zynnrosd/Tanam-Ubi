# Dashboard Sensor

Progressive Web App untuk monitoring sensor secara realtime dengan teknologi modern.

![Dashboard Sensor](https://github.com/user-attachments/assets/c6c83b4f-5349-4b58-800e-7fa70e01fcf4)

## Fitur

- 🏠 **Home** - Dashboard overview dengan statistik dan grafik sensor
- 📊 **Realtime Data** - Monitoring data sensor secara langsung dengan update otomatis
- ⚙️ **Calibration** - Kalibrasi sensor dengan offset dan scale
- 📋 **Data Log** - Riwayat data sensor dengan fitur pencarian, filter, dan export CSV
- ℹ️ **About** - Informasi aplikasi dan panduan konfigurasi

## Tech Stack

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend & Realtime Database
- **Recharts** - Data Visualization
- **Lucide React** - Icons
- **Vite PWA Plugin** - Progressive Web App

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/nabwelll/Dasshboard-Sensor.git
cd Dasshboard-Sensor

# Install dependencies
npm install

# Start development server
npm run dev

#diterminal rain run
npm run realtime-data

```

### Environment Variables

Buat file `.env` di root project:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase Setup

### 1. Buat tabel sensor_data

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
```

### 2. Buat tabel calibration_settings

```sql
CREATE TABLE calibration_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sensor_type TEXT NOT NULL UNIQUE,
  offset DOUBLE PRECISION DEFAULT 0,
  scale DOUBLE PRECISION DEFAULT 1,
  min_value DOUBLE PRECISION,
  max_value DOUBLE PRECISION,
  unit TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## PWA Installation

### Android / Chrome
1. Buka menu browser (⋮)
2. Pilih "Install app" atau "Add to Home screen"
3. Konfirmasi instalasi
4. Buka dari home screen

### iOS / Safari
1. Tap tombol Share (↑)
2. Scroll dan pilih "Add to Home Screen"
3. Beri nama aplikasi
4. Tap "Add"

## Screenshots

### Home
![Home](https://github.com/user-attachments/assets/c6c83b4f-5349-4b58-800e-7fa70e01fcf4)

### Realtime Data
![Realtime](https://github.com/user-attachments/assets/e6b4f2f3-2294-4eb3-90d3-a683de183523)

### Calibration
![Calibration](https://github.com/user-attachments/assets/0eb4c108-c3ae-4b3d-888b-bc8377287886)

### Data Log
![Data Log](https://github.com/user-attachments/assets/7f856eef-632b-408d-b6e8-10d611a88942)

### About
![About](https://github.com/user-attachments/assets/01b258e7-ec0e-446c-b669-36b230a5642a)

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT License

---

Made with ❤️ using React, TypeScript, and Supabase
