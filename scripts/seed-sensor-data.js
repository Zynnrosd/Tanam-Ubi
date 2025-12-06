/**
 * Script untuk mengirim dummy data sensor tanaman ke Supabase
 * * Penggunaan:
 * npm run seed-data
 * * Script ini akan mengirim 24 jam data sensor historis
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan di .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate dummy plant data
function generatePlantData(hoursAgo) {
  const now = new Date();
  const time = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  
  return {
    timestamp: time.toISOString(),
    // Data Tanaman (Suhu Udara, Kelembaban Tanah, Kelembaban Udara)
    air_temperature: 24 + Math.random() * 5 + Math.sin(hoursAgo / 4) * 2, 
    soil_moisture: Math.max(10, 40 + Math.random() * 30 + Math.cos(hoursAgo / 8) * 15), 
    air_humidity: 60 + Math.random() * 15 + Math.sin(hoursAgo / 6) * 10, 
  };
}

async function seedData() {
  try {
    console.log('🌱 Mulai seed data monitoring tanaman...');
    
    // Generate 24 jam data (setiap jam)
    const dataToInsert = [];
    for (let i = 23; i >= 0; i--) {
      dataToInsert.push(generatePlantData(i));
    }
    
    console.log(`📝 Menyiapkan ${dataToInsert.length} data untuk dikirim...`);
    
    // Insert ke Supabase. Target tabel 'plant_data'
    const { data, error } = await supabase
      .from('plant_data') 
      .insert(dataToInsert)
      .select();
    
    if (error) {
      console.error('❌ Error saat insert data:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Berhasil mengirim ${data?.length || 0} data sensor`);
    console.log('📍 Data sudah tersimpan di tabel plant_data');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedData();