// src/types/database.ts
export interface PlantData {
  id: string
  timestamp: string
  air_temperature: number   // Suhu Udara (Updated Key)
  air_humidity: number      // Kelembaban Udara
  soil_moisture: number     // Kelembaban Tanah
  created_at: string
}

export interface PlantProfile { // NEW TABLE
  id: string
  name: string
  latin_name: string
  optimal_air_temperature_min: number
  optimal_air_temperature_max: number
  optimal_air_humidity: number
  optimal_soil_moisture: number
  created_at: string
}

export type SensorType = 'air_temperature' | 'soil_moisture' | 'air_humidity' // Updated SensorType keys

export interface CalibrationSettings {
  id: string
  sensor_type: SensorType
  calibration_offset: number // Matches SQL
  scale: number
  min_value: number
  max_value: number
  unit: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      plant_data: {
        Row: PlantData
        Insert: Omit<PlantData, 'id' | 'created_at'>
        Update: Partial<Omit<PlantData, 'id' | 'created_at'>>
      }
      plant_profiles: { // NEW TABLE
        Row: PlantProfile
        Insert: Omit<PlantProfile, 'id' | 'created_at'>
        Update: Partial<Omit<PlantProfile, 'id' | 'created_at'>>
      }
      calibration_settings: {
        Row: CalibrationSettings
        Insert: Omit<CalibrationSettings, 'id' | 'updated_at'>
        Update: Partial<Omit<CalibrationSettings, 'id' | 'updated_at'>>
      }
    }
  }
}