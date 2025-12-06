// src/pages/Realtime.tsx

import { useEffect, useState, useRef } from 'react'
import { Thermometer, Droplets, CloudRain, Pause, Play, Leaf } from 'lucide-react' 
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, StatCard } from '../components/Card'
import { dataSource, isDemoMode } from '../lib/supabase' 
import type { PlantData } from '../types/database' 
import { AirHumiditySensor, AirTemperatureSensor, SoilMoistureSensor, AbstractSensor, SensorError } from '../classes/Sensor' 

const MAX_DATA_POINTS = 60
const REALTIME_UPDATE_INTERVAL = isDemoMode ? 3000 : 5000 // 3s for demo, 5s polling/realtime check

export function RealtimePage() {
  const [data, setData] = useState<PlantData[]>([])
  const [isLive, setIsLive] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Use the abstract sensor classes
  const tempSensor = new AirTemperatureSensor()
  const soilSensor = new SoilMoistureSensor()
  const airSensor = new AirHumiditySensor()

  // Function to handle new data (Polymorphism: using dataSource)
  const handleNewData = (newData: PlantData) => {
    setData(prev => {
        const updated = [...prev, newData]
        return updated.slice(-MAX_DATA_POINTS)
    })
    setConnectionStatus('connected')
  }

  // Effect for Realtime Subscription (Mqtt/Supabase Realtime Simulation)
  useEffect(() => {
    if (!isLive) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      return
    }

    setConnectionStatus('connecting')
    
    // Initial fetch to populate chart (Polymorphism: using dataSource)
    dataSource.fetchLatestData(MAX_DATA_POINTS).then(initialData => {
        setData(initialData)
        setConnectionStatus('connected')
    }).catch(err => {
        console.error('Initial fetch failed:', err)
        setConnectionStatus('disconnected')
    })
    
    // Subscribe to realtime updates
    if (!unsubscribeRef.current) {
        unsubscribeRef.current = dataSource.subscribeToRealtime(handleNewData)
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [isLive])

  const latestData = data[data.length - 1]

  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }),
    temperature: d.air_temperature, // Updated key
    soil_moisture: d.soil_moisture, 
    air_humidity: d.air_humidity
  }))

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-emerald-600'
      case 'disconnected': return 'bg-red-600'
      default: return 'bg-amber-500'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Terhubung'
      case 'disconnected': return 'Terputus'
      default: return 'Menghubungkan...'
    }
  }

  if (!latestData) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Memuat data sensor...</p>
          </div>
        </div>
      )
  }
  
  // Example of using OOP for value presentation 
  const displayValue = (sensor: AbstractSensor, rawValue: number) => {
    const mockSettings = { id: '', sensor_type: sensor.type, calibration_offset: 0, scale: 1, min_value: -Infinity, max_value: Infinity, unit: sensor.unit, updated_at: '' }
    
    try {
        const mockDataWithCurrentValue = { 
            ...latestData, 
            [sensor.type]: rawValue
        } as PlantData;

        const calibratedValue = sensor.getCalibratedValue(mockDataWithCurrentValue, mockSettings)
        return calibratedValue.toFixed(1)
    } catch (e) {
        // Exception Handling
        if (e instanceof SensorError) {
             return 'ERR'
        }
        return rawValue.toFixed(1)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Realtime Monitoring Tanaman</h1>
          <p className="text-slate-500">Data diperbarui melalui simulasi koneksi {isDemoMode ? 'Demo' : 'Realtime/Polling'} {REALTIME_UPDATE_INTERVAL / 1000} detik</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            <span className="text-sm text-slate-600">{getStatusText()}</span>
          </div>
          
          {/* Live/Pause Toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              isLive
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-300 text-slate-800 hover:bg-slate-400'
            }`}
          >
            {isLive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Lanjut</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Indicator */}
      {isLive && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <Leaf className="w-5 h-5 text-emerald-600 animate-pulse" />
          <div>
            <p className="text-emerald-600 font-medium">Monitoring Aktif</p>
            <p className="text-slate-500 text-sm">
              Menampilkan {data.length} data point terakhir
            </p>
          </div>
        </div>
      )}

      {/* Current Values (FIXED COLORS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title={tempSensor.name}
          value={displayValue(tempSensor, latestData.air_temperature)}
          unit={tempSensor.unit}
          icon={<Thermometer className="w-6 h-6 text-white" />}
          color={'orange'} // FIX: Explicitly set to 'orange'
        />
        <StatCard
          title={soilSensor.name}
          value={displayValue(soilSensor, latestData.soil_moisture)}
          unit={soilSensor.unit}
          icon={<Droplets className="w-6 h-6 text-white" />}
          color={'emerald'} // FIX: Explicitly set to 'emerald'
        />
        <StatCard
          title={airSensor.name}
          value={displayValue(airSensor, latestData.air_humidity)}
          unit={airSensor.unit}
          icon={<CloudRain className="w-6 h-6 text-white" />}
          color={'blue'} // FIX: Explicitly set to 'blue'
        />
      </div>

      {/* Realtime Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temperature Chart */}
        <Card className="p-6" gradient>
          <div className="flex items-center gap-2 mb-6">
            <Thermometer className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-slate-800">{tempSensor.name}</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}${tempSensor.unit}`, tempSensor.name]}
                />
                <Line 
                  type="monotone" 
                  dataKey="temperature"
                  stroke="#f97316" // Orange
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Soil Moisture Chart */}
        <Card className="p-6" gradient>
          <div className="flex items-center gap-2 mb-6">
            <Droplets className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-800">{soilSensor.name}</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}${soilSensor.unit}`, soilSensor.name]}
                />
                <Line 
                  type="monotone" 
                  dataKey="soil_moisture" 
                  stroke="#10b981" // Emerald
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Air Humidity Chart */}
        <Card className="p-6" gradient>
          <div className="flex items-center gap-2 mb-6">
            <CloudRain className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">{airSensor.name}</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}${airSensor.unit}`, airSensor.name]}
                />
                <Line 
                  type="monotone" 
                  dataKey="air_humidity" 
                  stroke="#3b82f6" // Blue
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}