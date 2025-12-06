// src/classes/Sensor.ts
import type { PlantData, SensorType, CalibrationSettings } from '../types/database' 
import { Thermometer, Droplets, CloudRain } from 'lucide-react'
import React from 'react'

// --- Custom Exceptions (EXCEPTION HANDLING) ---
// Exception umum untuk masalah sensor/data
export class SensorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SensorError'
  }
}

// Exception spesifik untuk kegagalan kalibrasi
export class CalibrationError extends SensorError {
  constructor(sensorType: SensorType, message: string) {
    super(`[${sensorType}] Calibration Error: ${message}`)
    this.name = 'CalibrationError'
  }
}

// --- Sensor Interface (INTERFACE/ABSTRACTION) ---
export interface ISensor {
  type: SensorType
  name: string
  unit: string
  icon: React.ComponentType<any> 
  color: 'blue' | 'cyan' | 'orange' | 'purple' | 'green'
  
  // Metode untuk mendapatkan nilai mentah (Implementasi Polimorfisme)
  getRawValue(data: PlantData): number
  
  // Metode untuk mendapatkan nilai terkalibrasi (Implementasi Polymorphism)
  getCalibratedValue(data: PlantData, settings: CalibrationSettings): number
  
  // Metode validasi batas (Implementasi Polymorphism)
  validate(value: number, settings: CalibrationSettings): boolean
}

// --- Abstract Class (INHERITANCE) ---
export abstract class AbstractSensor implements ISensor {
  abstract type: SensorType
  abstract name: string
  abstract unit: string
  abstract icon: React.ComponentType<any>
  abstract color: 'blue' | 'cyan' | 'orange' | 'purple' | 'green'

  // Metode Abstrak: Harus diimplementasikan oleh setiap Sensor turunan
  abstract getRawValue(data: PlantData): number

  // Metode Polimorfisme: Logika kalibrasi umum untuk semua sensor
  getCalibratedValue(data: PlantData, settings: CalibrationSettings): number {
    const rawValue = this.getRawValue(data)
    
    // Formula Kalibrasi: (Nilai Mentah * Scale) + Offset
    const calibrated = (rawValue * settings.scale) + settings.calibration_offset
    
    // Validasi nilai setelah kalibrasi
    if (!this.validate(calibrated, settings)) {
      // Melempar Exception jika validasi gagal (EXCEPTION HANDLING)
      throw new CalibrationError(this.type, `Nilai terkalibrasi (${calibrated.toFixed(2)}${this.unit}) di luar batas range (${settings.min_value} - ${settings.max_value}${this.unit})`)
    }
    
    return calibrated
  }

  // Metode Polimorfisme: Logika validasi umum
  validate(value: number, settings: CalibrationSettings): boolean {
    return value >= settings.min_value && value <= settings.max_value
  }
}

// --- Concrete Sensor Implementations (INHERITANCE & POLYMORPHISM) ---

// 1. Suhu Udara
export class AirTemperatureSensor extends AbstractSensor {
  type: SensorType = 'air_temperature'
  name = 'Suhu Udara'
  unit = '°C'
  color = 'orange' as const
  icon = Thermometer

  // Implementasi Polimorfisme: Mengambil data dari field 'air_temperature'
  getRawValue(data: PlantData): number {
    return data.air_temperature
  }
}

// 2. Kelembaban Tanah
export class SoilMoistureSensor extends AbstractSensor {
  type: SensorType = 'soil_moisture'
  name = 'Kelembaban Tanah'
  unit = '%'
  color = 'blue' as const
  icon = Droplets

  // Implementasi Polimorfisme: Mengambil data dari field 'soil_moisture'
  getRawValue(data: PlantData): number {
    return data.soil_moisture
  }
}

// 3. Kelembaban Udara
export class AirHumiditySensor extends AbstractSensor {
  type: SensorType = 'air_humidity'
  name = 'Kelembaban Udara'
  unit = '%'
  color = 'cyan' as const
  icon = CloudRain

  // Implementasi Polimorfisme: Mengambil data dari field 'air_humidity'
  getRawValue(data: PlantData): number {
    return data.air_humidity
  }
}

// Map untuk akses mudah ke semua sensor
export const ALL_SENSORS: ISensor[] = [
  new AirTemperatureSensor(),
  new SoilMoistureSensor(),
  new AirHumiditySensor(),
]

// Helper untuk mendapatkan sensor berdasarkan tipe (Memanfaatkan Exception Handling)
export const getSensorByType = (type: SensorType): ISensor => {
  const sensor = ALL_SENSORS.find(s => s.type === type)
  if (!sensor) throw new SensorError(`Sensor type '${type}' tidak ditemukan.`)
  return sensor
}