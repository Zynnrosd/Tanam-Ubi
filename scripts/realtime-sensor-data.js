/**
 * Script untuk mengirim data sensor realtime secara berkala ke Supabase
 * * Penggunaan:
 * npm run realtime-data
 * * Script ini akan mengirim data sensor baru setiap 10 detik (Simulasi input MQTT ke Supabase)
 * Tekan Ctrl+C untuk menghentikan
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const INTERVAL_MS = 10000; // 10 detik

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan di .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate realtime plant data
function generateRealtimeData() {
  return {
    timestamp: new Date().toISOString(),
    air_temperature: 24 + Math.random() * 5,
    soil_moisture: Math.max(10, 40 + Math.random() * 30),
    air_humidity: 60 + Math.random() * 15,
  };
}

// Format data untuk display
function formatPlantData(data) {
  return {
    'Timestamp': new Date(data.timestamp).toLocaleString('id-ID'),
    'Suhu Udara': `${data.air_temperature.toFixed(2)}°C`,
    'Kelembaban Tanah': `${data.soil_moisture.toFixed(2)}%`,
    'Kelembaban Udara': `${data.air_humidity.toFixed(2)}%`,
  };
}

let dataCount = 0;

async function sendRealtimeData() {
  try {
    const plantData = generateRealtimeData();
    
    // Insert ke Supabase. Target tabel 'plant_data'
    const { data, error } = await supabase
      .from('plant_data') 
      .insert([plantData])
      .select();
    
    if (error) {
      console.error('❌ Error saat insert data:', error.message);
      return;
    }
    
    dataCount++;
    console.log(`\n📡 Data #${dataCount} dikirim:`);
    console.table(formatPlantData(plantData));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

console.log('🚀 Mulai mengirim data monitoring tanaman realtime (Simulasi input Supabase/MQTT)...');
console.log(`⏱️  Interval: ${INTERVAL_MS / 1000} detik`);
console.log('🛑 Tekan Ctrl+C untuk menghentikan\n');

// Send data setiap 10 detik
const interval = setInterval(sendRealtimeData, INTERVAL_MS);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n✅ Menghentikan pengiriman data...');
  clearInterval(interval);
  console.log(`📊 Total data terkirim: ${dataCount}`);
  process.exit(0);
});