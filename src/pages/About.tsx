// src/pages/About.tsx
import { useState, useEffect } from 'react'
import { Leaf, Thermometer, Droplets, CloudRain, Plus, X, CheckCircle, AlertTriangle, Save } from 'lucide-react'
import { Card } from '../components/Card'
import { supabase, isDemoMode } from '../lib/supabase'
// Import Tipe dari generic Database Supabase
import type { PlantProfile, SensorType, Database } from '../types/database' 
import { SensorError } from '../classes/Sensor'

// --- Custom Exception for Data (OOP: EXCEPTION HANDLING) ---
class PlantProfileError extends SensorError {}

// Mendapatkan tipe Insert dari generic Database Supabase
type NewPlantInsert = Database['public']['Tables']['plant_profiles']['Insert'];

const initialNewPlant: NewPlantInsert = {
  name: '',
  latin_name: '',
  optimal_air_temperature_min: 20,
  optimal_air_temperature_max: 30,
  optimal_air_humidity: 70,
  optimal_soil_moisture: 60,
}

export function AboutPage() {
  const [profiles, setProfiles] = useState<PlantProfile[]>([])
  const [newPlant, setNewPlant] = useState(initialNewPlant)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tresholdMessage, setTresholdMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlantProfiles()
  }, [])

  // Function to fetch data (OOP: Exception Handling)
  const fetchPlantProfiles = async () => {
    setLoading(true)
    setError(null)
    
    if (isDemoMode) {
        const mockProfiles: PlantProfile[] = [
            { id: '1', name: 'Sawi', latin_name: 'Brassica rapa L.', optimal_air_temperature_min: 15, optimal_air_temperature_max: 25, optimal_air_humidity: 60, optimal_soil_moisture: 50, created_at: new Date().toISOString() },
            { id: '2', name: 'Cabai Rawit', latin_name: 'Capsicum frutescens', optimal_air_temperature_min: 25, optimal_air_temperature_max: 30, optimal_air_humidity: 70, optimal_soil_moisture: 75, created_at: new Date().toISOString() },
            { id: '3', name: 'Tomat', latin_name: 'Solanum lycopersicum', optimal_air_temperature_min: 20, optimal_air_temperature_max: 27, optimal_air_humidity: 65, optimal_soil_moisture: 60, created_at: new Date().toISOString() },
        ];
        setProfiles(mockProfiles);
        setLoading(false);
        return;
    }

    try {
      const { data, error } = await supabase
        .from('plant_profiles')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        throw new PlantProfileError(`Gagal mengambil profil tanaman: ${error.message}`)
      }
      setProfiles(data || [])
    } catch (e) {
      console.error(e)
      setError(e instanceof PlantProfileError ? e.message : 'Gagal memuat profil tanaman.')
    } finally {
      setLoading(false)
    }
  }

  // Function to handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setNewPlant(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  // Function to add a new plant profile (OOP: Exception Handling)
  const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (isDemoMode) {
      setError('Fitur tambah tanaman tidak aktif dalam Mode Demo. Data disimulasikan.')
      setLoading(false)
      return
    }

    try {
        const insertData: NewPlantInsert[] = [newPlant];

        // --- PERBAIKAN TS2769 (Insert) ---
        // Casting array ke 'any' untuk mengatasi masalah tipe 'never' Supabase.
        const { data, error } = await supabase
            .from('plant_profiles')
            .insert(insertData as any) 
            .select()
        
        if (error) {
            throw new PlantProfileError(`Gagal menambahkan profil: ${error.message}`)
        }
        
        if (data && data.length > 0) {
            setProfiles(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
            setNewPlant(initialNewPlant)
            setIsAdding(false)
            setTresholdMessage(`Profil ${newPlant.name} berhasil ditambahkan!`)
            setTimeout(() => setTresholdMessage(null), 3000)
        }
    } catch (e) {
        setError(e instanceof PlantProfileError ? e.message : 'Gagal menyimpan profil baru.')
    } finally {
        setLoading(false)
    }
  }

  // Function to simulate setting the treshold (OOP: Exception Handling/Error Notification)
  const applyTreshold = async (profile: PlantProfile) => {
    setError(null)
    setTresholdMessage(null)
    setLoading(true)
    
    if (isDemoMode) {
      setTresholdMessage(`[DEMO] Treshold untuk ${profile.name} disetel. Data tidak disimpan di database.`)
      setLoading(false)
      setTimeout(() => setTresholdMessage(null), 5000)
      return
    }

    try {
        // Data yang akan di-upsert ke tabel calibration_settings
        type CalibrationInsert = Database['public']['Tables']['calibration_settings']['Insert'];

        const tresholdUpdates: CalibrationInsert[] = [
            { 
                sensor_type: 'air_temperature' as SensorType, 
                min_value: profile.optimal_air_temperature_min, 
                max_value: profile.optimal_air_temperature_max, 
                unit: '°C',
                calibration_offset: 0, 
                scale: 1,
            },
            { 
                sensor_type: 'air_humidity' as SensorType, 
                min_value: profile.optimal_air_humidity, 
                max_value: 100, 
                unit: '%',
                calibration_offset: 0, 
                scale: 1,
            }, 
            { 
                sensor_type: 'soil_moisture' as SensorType, 
                min_value: profile.optimal_soil_moisture, 
                max_value: 100, 
                unit: '%',
                calibration_offset: 0, 
                scale: 1,
            },
        ];

        // --- PERBAIKAN TS2769 (Upsert) ---
        // Casting array ke 'any' untuk mengatasi masalah tipe 'never' Supabase.
        const { error: updateError } = await supabase
            .from('calibration_settings')
            .upsert(tresholdUpdates as any, { onConflict: 'sensor_type' }); 

        if (updateError) {
            throw new PlantProfileError(`Gagal update treshold: ${updateError.message}`)
        }

        setTresholdMessage(`Treshold berhasil diatur ke profil ${profile.name}!`)
        
    } catch (e) {
        setError(e instanceof PlantProfileError ? e.message : 'Gagal mengatur treshold.')
    } finally {
        setLoading(false)
        setTimeout(() => setTresholdMessage(null), 5000)
    }
  }

  const plantFields = [
    { label: 'Suhu Udara Min (°C)', key: 'optimal_air_temperature_min', icon: Thermometer, step: 0.1 },
    { label: 'Suhu Udara Max (°C)', key: 'optimal_air_temperature_max', icon: Thermometer, step: 0.1 },
    { label: 'Kelembaban Udara Min Treshold (%)', key: 'optimal_air_humidity', icon: CloudRain, step: 1 },
    { label: 'Kelembaban Tanah Min Treshold (%)', key: 'optimal_soil_moisture', icon: Droplets, step: 1 },
  ]
  
  if (loading && !profiles.length && !isAdding) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Memuat profil tanaman...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Profil Tanaman & Treshold Optimal</h1>
          <p className="text-slate-400">Pilih profil tanaman untuk mengatur treshold monitoring secara cepat.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            isAdding ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAdding ? 'Batal Tambah' : 'Tambah Profil Baru'}</span>
        </button>
      </div>

      {/* Treshold Message / Success Alert */}
      {tresholdMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-slate-300 text-sm">{tresholdMessage}</p>
        </div>
      )}
      
      {/* Error Alert (EXCEPTION HANDLING) */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Kesalahan Operasi</p>
            <p className="text-slate-400 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form Tambah Profil Baru */}
      {isAdding && (
        <Card className="p-6" gradient>
          <h2 className="text-xl font-semibold text-white mb-4">Tambahkan Profil Tanaman Baru (Manual Entry)</h2>
          <form onSubmit={handleAddPlant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nama Tanaman</label>
                <input
                  type="text"
                  name="name"
                  value={newPlant.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nama Latin (Opsional)</label>
                <input
                  type="text"
                  name="latin_name"
                  value={newPlant.latin_name || ''} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {plantFields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1">{field.label}</label>
                  <div className="relative">
                    <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      step={field.step}
                      name={field.key}
                      // @ts-ignore: We rely on NewPlantInsert keys here
                      value={newPlant[field.key]}
                      onChange={handleChange}
                      required
                      className="w-full pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Menyimpan...' : 'Simpan Profil'}</span>
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Plant Profiles Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.id} className="p-5 flex flex-col justify-between hover:border-green-500/50 transition-all" gradient>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Leaf className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                  <p className="text-sm text-slate-500 italic">{profile.latin_name}</p>
                </div>
              </div>
              
              <div className="space-y-2 mt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Thermometer className="w-4 h-4" /> Suhu Udara
                  </span>
                  <span className="font-semibold text-orange-400">
                    {profile.optimal_air_temperature_min}°C - {profile.optimal_air_temperature_max}°C
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <CloudRain className="w-4 h-4" /> Kelembaban Udara (Min Treshold)
                  </span>
                  <span className="font-semibold text-cyan-400">
                    {profile.optimal_air_humidity}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Droplets className="w-4 h-4" /> Kelembaban Tanah (Min Treshold)
                  </span>
                  <span className="font-semibold text-blue-400">
                    {profile.optimal_soil_moisture}%
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => applyTreshold(profile)}
              disabled={loading}
              className="mt-5 w-full py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              Atur Sebagai Treshold Monitoring
            </button>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-8">
        <p className="text-slate-500 text-sm">
          Aplikasi Monitoring Tanaman, Versi {profiles.length} Profil.
        </p>
      </div>
    </div>
  )
}