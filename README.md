# 🌿 Dashboard Monitoring Tanaman

**Progressive Web App (PWA) modern** untuk memantau kondisi lingkungan tanaman (**Suhu Udara, Kelembaban Tanah, Kelembaban Udara**) secara *realtime* dengan implementasi ketat Object-Oriented Programming (OOP) dan didukung oleh Supabase.

## ✨ Desain & Teknologi

* **Tema:** Tema Terang (Latar Belakang Putih) dengan aksen Hijau Emerald.
* **Fokus:** Tampilan modern, minimalis, dan *clean*.

## 🚀 Fitur Utama

| Halaman | Deskripsi Fungsional |
| :--- | :--- |
| 🏠 **Dashboard** | Menampilkan kartu nilai sensor terbaru (Suhu Udara, Kelembaban Tanah, Kelembaban Udara) dan **Grafik Statistik Harian** (Min, Max, Avg) yang diolah dari data historis. |
| 📊 **Tren 24 Jam** | Menampilkan semua data sensor dalam **satu grafik multiline** untuk analisis tren selama 24 jam terakhir. |
| ⚙️ **Kalibrasi** | Mengatur parameter kalibrasi (`Offset`, `Scale`, `Min/Max Value`) untuk setiap sensor dengan penerapan **Exception Handling** untuk validasi batas. |
| 📋 **Log Data** | Riwayat data sensor dengan fitur pencarian, filter, dan ekspor CSV. |
| 🌱 **Profil Tanaman** | Mengelola profil tanaman (misalnya: Sawi, Cabai). Pengguna dapat **menambah** profil baru dan **mengatur Treshold Optimal** yang otomatis di-upsert ke tabel `calibration_settings` untuk monitoring. |

***

## 🧩 Implementasi Prinsip OOP Wajib

Struktur aplikasi dibangun di atas arsitektur OOP yang ketat untuk memastikan modularitas dan *maintainability*.

| Prinsip OOP | Penerapan Kunci | File Terkait |
| :--- | :--- | :--- |
| **Interface & Abstraksi** | Mendefinisikan kontrak **`ISensor`** dan **`IDataSource`** untuk memisahkan logika bisnis dari implementasi sensor spesifik dan sumber data (Supabase). | `src/classes/Sensor.ts`, `src/lib/data-source.ts` |
| **Inheritance** | **`AbstractSensor`** menyediakan logika dasar kalibrasi dan validasi yang diwariskan ke semua sensor spesifik. | `src/classes/Sensor.ts` |
| **Polymorphism** | Metode **`sensor.getRawValue(data)`** dipanggil secara universal di seluruh aplikasi (misalnya di halaman Dashboard untuk menghitung Min/Max/Avg) meskipun setiap sensor memiliki implementasi pengambilan data dari kolom yang berbeda (`air_temperature`, `soil_moisture`, dll.). | `src/classes/Sensor.ts`, `src/pages/Home.tsx` |
| **Exception Handling** | Implementasi custom error **`CalibrationError`** dan **`PlantProfileError`** untuk menangani kesalahan validasi *runtime* (misalnya, jika nilai kalibrasi melanggar batas Min/Max) dan kegagalan CRUD data. | `src/classes/Sensor.ts`, `src/pages/Calibration.tsx`, `src/pages/About.tsx` |

***

## 🛠️ Tech Stack

-   **Frontend:** React 18, TypeScript, Vite
-   **Styling:** Tailwind CSS (Theme Light/Emerald)
-   **Data Visualization:** Recharts
-   **Backend & Database:** Supabase (digunakan untuk Database & Simulasi MQTT/Realtime)

***

## ⚙️ Getting Started

### Prerequisites

-   Node.js 18+
-   npm atau yarn

### Installation

```bash
# Clone repository
git clone [YOUR_REPO_URL]
cd Dashboard-Monitoring-Tanaman

# Install dependencies
npm install

# Start development server
npm run dev
