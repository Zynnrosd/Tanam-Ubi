// src/pages/Calibration.tsx
import { useState, useEffect } from 'react'
import { Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react'
import { Card } from '../components/Card'
import { supabase, isDemoMode } from '../lib/supabase'
// Import Sensor Classes, Interface dan Exception Handling
import { ALL_SENSORS, type ISensor, CalibrationError, SensorError } from '../classes/Sensor'
// Import Tipe dari generic Database Supabase
import type { SensorType, CalibrationSettings, PlantData, Database } from '../types/database' 

interface CalibrationValue {
  calibration_offset: number
  scale: number
  minValue: number
  maxValue: number
}

// Initial state based on ALL_SENSORS types
const getInitialCalibrationState = (sensors: ISensor[]): Record<SensorType, CalibrationValue> => {
    const initialState: Partial<Record<SensorType, CalibrationValue>> = {}
    
    // Default values
    sensors.forEach(s => {
        let minValue = 0
        let maxValue = 100
        
        if (s.type === 'air_temperature') {
            minValue = -10
            maxValue = 50
        } else if (s.type === 'soil_moisture' || s.type === 'air_humidity') {
            minValue = 0
            maxValue = 100
        }

        initialState[s.type] = {
            calibration_offset: 0,
            scale: 1,
            minValue: minValue,
            maxValue: maxValue
        }
    })

    return initialState as Record<SensorType, CalibrationValue>
}

export function CalibrationPage() {
  const defaultCalibration = getInitialCalibrationState(ALL_SENSORS)
  const [calibration, setCalibration] = useState<Record<SensorType, CalibrationValue>>(defaultCalibration)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SensorType>(ALL_SENSORS[0].type)

  // Fetch current calibration settings on load
  useEffect(() => {
    if (!isDemoMode) {
      fetchCalibrationSettings()
    }
  }, [])

  const fetchCalibrationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('calibration_settings')
        .select('*')
      
      if (error) throw new SensorError(`Gagal memuat pengaturan kalibrasi: ${error.message}`)

      if (data) {
        setCalibration(prev => {
            const newState = { ...prev }
            
            const settingsArray = data as CalibrationSettings[];
            
            settingsArray.forEach((setting) => {
                (newState as any)[setting.sensor_type] = {
                    calibration_offset: setting.calibration_offset, 
                    scale: setting.scale,
                    minValue: setting.min_value,
                    maxValue: setting.max_value
                } as CalibrationValue;
            })
            
            return newState
        })
      }
    } catch (e) {
      console.error(e)
      setError(e instanceof SensorError ? e.message : 'Gagal memuat data awal.')
    } finally {
      // set loading false or handle other finalization logic if necessary
    }
  }

  const handleChange = (
    sensor: SensorType,
    field: keyof CalibrationValue,
    value: string
  ) => {
    const numValue = parseFloat(value) 
    setCalibration(prev => ({
      ...prev,
      [sensor]: {
        ...prev[sensor],
        // @ts-ignore: Ditoleransi karena type Check sudah dilakukan
        [field]: isNaN(numValue) ? value : numValue
      }
    } as Record<SensorType, CalibrationValue>))
    setSaved(false)
    setError(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    
    // Validate all settings using Polymorphism (getCalibratedValue + validate methods)
    try {
      if (!isDemoMode) {
        // Mendapatkan tipe Insert untuk Calibration Settings
        type CalibrationInsert = Database['public']['Tables']['calibration_settings']['Insert'];
        
        for (const sensor of ALL_SENSORS) {
            const values = calibration[sensor.type]
            
            const mockSettings: CalibrationSettings = {
                id: '', 
                sensor_type: sensor.type, 
                calibration_offset: values.calibration_offset,
                scale: values.scale,
                min_value: values.minValue,
                max_value: values.maxValue,
                unit: sensor.unit,
                updated_at: ''
            }

            // Mock data untuk validasi (nilai tengah 25)
            const mockDataForValidation: PlantData = { 
                id: 'mock', timestamp: new Date().toISOString(), air_temperature: 25, air_humidity: 25, soil_moisture: 25, created_at: '',
                [sensor.type]: 25 // Set nilai mock pada field yang relevan
            } as PlantData;

            try {
                // POLYMORPHISM: Panggil getCalibratedValue yang akan melempar CalibrationError (EXCEPTION)
                sensor.getCalibratedValue(mockDataForValidation, mockSettings)
            } catch (e) {
                if (e instanceof CalibrationError) {
                    throw new CalibrationError(sensor.type, `Pengaturan kalibrasi invalid! Cek rentang nilai Min/Max.`)
                }
                throw e
            }

            // Data untuk di-upsert
            const record: CalibrationInsert = {
                sensor_type: sensor.type,
                calibration_offset: values.calibration_offset,
                scale: values.scale,
                min_value: values.minValue,
                max_value: values.maxValue,
                unit: sensor.unit
            }
            
            // Casting array ke 'any' untuk mengatasi masalah tipe 'never' Supabase (TS2769)
            await supabase.from('calibration_settings').upsert([record] as any, { onConflict: 'sensor_type' })
        }
      }
      
      // Simulate save delay for demo
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error('Error saving calibration:', e)
      // EXCEPTION HANDLING
      setError(e instanceof CalibrationError || e instanceof SensorError ? e.message : 'Gagal menyimpan kalibrasi.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = (sensor: SensorType) => {
    setCalibration(prev => ({
      ...prev,
      [sensor]: defaultCalibration[sensor]
    }))
    setSaved(false)
    setError(null)
  }

  const handleResetAll = () => {
    setCalibration(defaultCalibration)
    setSaved(false)
    setError(null)
  }

  const activeSensor = ALL_SENSORS.find(s => s.type === activeTab)!
  const activeValues = calibration[activeTab]

  const colorClasses = {
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/30 text-orange-600 from-orange-600 to-red-500',
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/30 text-blue-600 from-blue-600 to-cyan-500',
    cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/30 text-cyan-600 from-cyan-600 to-teal-500',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/30 text-purple-600 from-purple-600 to-fuchsia-500',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/30 text-emerald-600 from-emerald-600 to-green-500'
  }

  const activeColorKey = activeSensor.color as keyof typeof colorClasses;
  const activeColors = colorClasses[activeColorKey];
  // Mengambil 4 kelas (bg, border, text, icon gradient)
  const [,,, icon] = activeColors.split(' '); 
  
  // Menggunakan ikon sensor aktif
  const ActiveIcon = activeSensor.icon;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Kalibrasi Sensor Tanaman</h1>
          <p className="text-slate-500">Atur parameter kalibrasi untuk setiap sensor</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Semua</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert (EXCEPTION HANDLING) */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-red-600 font-medium">Kesalahan Operasi</p>
            <p className="text-slate-600 text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sensor Selection Sidebar (POLYMORPHISM) */}
        <div className="lg:col-span-1">
          <Card className="p-4" gradient>
            <h3 className="text-sm font-medium text-slate-500 mb-4 px-2">Pilih Sensor</h3>
            <div className="space-y-2">
              {ALL_SENSORS.map((sensor) => {
                const Icon = sensor.icon
                const isActive = activeTab === sensor.type
                const colors = colorClasses[sensor.color as keyof typeof colorClasses]
                const [itemBg, itemBorder,, itemIcon] = colors.split(' ');

                return (
                  <button
                    key={sensor.type}
                    onClick={() => setActiveTab(sensor.type)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      isActive
                        ? `${itemBg} ${itemBorder} border`
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-linear-to-br ${itemIcon}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className={`font-medium ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                        {sensor.name}
                      </p>
                      <p className="text-xs text-slate-500">{sensor.unit}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Calibration Form */}
        <div className="lg:col-span-3">
          <Card className="p-6" gradient>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl bg-linear-to-br ${icon}`}>
                <ActiveIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">{activeSensor.name}</h2>
                <p className="text-sm text-slate-500">{activeSensor.name} ({activeSensor.unit})</p>
              </div>
              <button
                onClick={() => handleReset(activeTab)}
                className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Offset */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600">
                  Offset ({activeSensor.unit})
                </label>
                <div className="relative"> {/* KETERANGAN: Container relative untuk ikon */}
                  <ActiveIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /> {/* KETERANGAN: Ikon di kiri */}
                  <input
                    type="number"
                    step="0.1"
                    value={activeValues.calibration_offset} 
                    onChange={(e) => handleChange(activeTab, 'calibration_offset', e.target.value)} 
                    // KETERANGAN: Padding kiri disesuaikan (pl-10)
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="0.0"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Nilai yang ditambahkan ke pembacaan sensor
                </p>
              </div>

              {/* Scale */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600">
                  Scale (Multiplier)
                </label>
                <div className="relative"> {/* KETERANGAN: Container relative untuk ikon */}
                  <ActiveIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /> {/* KETERANGAN: Ikon di kiri */}
                  <input
                    type="number"
                    step="0.01"
                    value={activeValues.scale}
                    onChange={(e) => handleChange(activeTab, 'scale', e.target.value)}
                    // KETERANGAN: Padding kiri disesuaikan (pl-10)
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="1.0"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Faktor pengali untuk koreksi proporsional
                </p>
              </div>

              {/* Min Value */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600">
                  Nilai Minimum ({activeSensor.unit})
                </label>
                <div className="relative"> {/* KETERANGAN: Container relative untuk ikon */}
                  <ActiveIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /> {/* KETERANGAN: Ikon di kiri */}
                  <input
                    type="number"
                    value={activeValues.minValue}
                    onChange={(e) => handleChange(activeTab, 'minValue', e.target.value)}
                    // KETERANGAN: Padding kiri disesuaikan (pl-10)
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Batas bawah pembacaan sensor
                </p>
              </div>

              {/* Max Value */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600">
                  Nilai Maximum ({activeSensor.unit})
                </label>
                <div className="relative"> {/* KETERANGAN: Container relative untuk ikon */}
                  <ActiveIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /> {/* KETERANGAN: Ikon di kiri */}
                  <input
                    type="number"
                    value={activeValues.maxValue}
                    onChange={(e) => handleChange(activeTab, 'maxValue', e.target.value)}
                    // KETERANGAN: Padding kiri disesuaikan (pl-10)
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="100"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Batas atas pembacaan sensor
                </p>
              </div>
            </div>

            {/* Formula Preview (KOTAK PUTIH/TERANG) */}
            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-300">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Formula Kalibrasi</h3>
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-slate-600">Nilai Terkalibrasi =</span>
                <span className="text-blue-600">(Nilai Mentah × {activeValues.scale})</span>
                <span className="text-slate-600">+</span>
                <span className="text-emerald-600">{activeValues.calibration_offset}</span>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Range valid: {activeValues.minValue} {activeSensor.unit} - {activeValues.maxValue} {activeSensor.unit}
              </div>
            </div>

            {/* Example Calculation (KOTAK PUTIH/TERANG) */}
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-300">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Contoh Perhitungan (Raw Value = 25)</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Nilai Mentah</p>
                  <p className="text-lg font-semibold text-orange-600">25.0</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Proses</p>
                  <p className="text-slate-600">→ × {activeValues.scale} + {activeValues.calibration_offset} →</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Nilai Terkalibrasi</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    {(25 * activeValues.scale + activeValues.calibration_offset).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}