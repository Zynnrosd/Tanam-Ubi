// src/lib/data-source.ts

import { SupabaseClient } from '@supabase/supabase-js'
// --- PERBAIKAN: Tambahkan 'type' di depan PlantData dan Database
import type { PlantData, Database } from '../types/database' 
import { SensorError } from '../classes/Sensor' 

// --- Data Source Interface (INTERFACE/ABSTRACTION) ---
export interface IDataSource {
  // Metode ini akan diimplementasikan oleh sumber data nyata (Polymorphism)
  fetchLatestData(limit: number): Promise<PlantData[]>
  subscribeToRealtime(callback: (data: PlantData) => void): () => void 
  
  // Metode untuk mode demo
  generateDemoData(count: number): PlantData[]
  isDemoMode: boolean
}

// --- Concrete Supabase Data Source (IMPLEMENTASI POLYMORPHISM) ---
export class SupabaseDataSource implements IDataSource {
  private supabase: SupabaseClient<Database>
  isDemoMode: boolean

  constructor(supabase: SupabaseClient<Database>, isDemoMode: boolean) {
    this.supabase = supabase
    this.isDemoMode = isDemoMode
  }

  async fetchLatestData(limit: number): Promise<PlantData[]> {
    if (this.isDemoMode) {
      return this.generateDemoData(limit)
    }

    try {
      const { data, error } = await this.supabase
        .from('plant_data') 
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      // Memanfaatkan Exception Handling
      if (error) throw new SensorError(`Gagal mengambil data dari Supabase: ${error.message}`)
      
      return (data || []).reverse()
    } catch (error) {
      console.error(error)
      // Fallback ke data demo saat error (EXCEPTION HANDLING)
      return this.generateDemoData(limit)
    }
  }

  // Mock Realtime Subscription (Simulasi MQTT/Realtime Supabase)
  subscribeToRealtime(callback: (data: PlantData) => void): () => void {
    if (this.isDemoMode) {
        let interval: ReturnType<typeof setInterval> | null = null;
        
        interval = setInterval(() => {
          callback(this.generateRealtimeData())
        }, 3000) 

        return () => {
            if (interval) clearInterval(interval);
        }
    } else {
        // Implementasi Supabase Realtime 
        const channel = this.supabase
          .channel('plant-monitoring-realtime')
          .on<PlantData>('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'plant_data' 
          }, (payload) => {
            callback(payload.new as PlantData)
          })
          .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }
  }
  
  // Metode Helper untuk Demo Data
  generateDemoData(count: number): PlantData[] {
    const data = []
    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(Date.now() - i * (60 * 60 * 1000 / count))
      data.push({
        id: crypto.randomUUID(),
        timestamp: time.toISOString(),
        air_temperature: 24 + Math.random() * 5 + Math.sin(i / 10) * 2, 
        soil_moisture: Math.max(10, 40 + Math.random() * 30 + Math.cos(i / 8) * 15),
        air_humidity: 60 + Math.random() * 15 + Math.sin(i / 6) * 10, 
        created_at: time.toISOString()
      })
    }
    return data
  }

  generateRealtimeData(): PlantData {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      air_temperature: 24 + Math.random() * 5,
      soil_moisture: Math.max(10, 40 + Math.random() * 30),
      air_humidity: 60 + Math.random() * 15,
      created_at: new Date().toISOString()
    }
  }
}