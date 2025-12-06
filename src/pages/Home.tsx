// src/pages/Home.tsx
import { useEffect, useState } from 'react'
import { Leaf, Clock, AlertTriangle, Thermometer, Droplets, CloudRain } from 'lucide-react'
// Menggunakan BarChart untuk visualisasi statistik Min/Max/Avg
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts' 
import { StatCard, Card } from '../components/Card'
import { dataSource, isDemoMode } from '../lib/supabase'
import type { PlantData } from '../types/database'
import { AirTemperatureSensor, SoilMoistureSensor, AirHumiditySensor, AbstractSensor } from '../classes/Sensor' 

const TREND_UPDATE_INTERVAL = 30000 // Refresh setiap 30 detik
const DATA_POINTS_TO_FETCH = 7 * 24 // Ambil data 7 hari x 24 points untuk demonstrasi agregasi harian

interface DailyStats {
  date: string;
  // Suhu
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  // Kelembaban Tanah
  avgSoil: number;
  maxSoil: number;
  minSoil: number;
  // Kelembaban Udara
  avgAir: number;
  maxAir: number;
  minAir: number;
}

export function HomePage() {
  const [plantData, setPlantData] = useState<PlantData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [dailyStatsChartData, setDailyStatsChartData] = useState<DailyStats[]>([]);

  // Sensor Instances (POLYMORPHISM)
  const tempSensor = new AirTemperatureSensor()
  const soilSensor = new SoilMoistureSensor()
  const airSensor = new AirHumiditySensor()

  const sensors = [tempSensor, soilSensor, airSensor];

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Mengambil 7 hari data points
        const fetchedData = await dataSource.fetchLatestData(DATA_POINTS_TO_FETCH);

        setPlantData(fetchedData)
        setLastUpdate(new Date())
      } catch (error) {
        console.error('Error fetching data:', error)
        setPlantData(dataSource.generateDemoData(DATA_POINTS_TO_FETCH));
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, TREND_UPDATE_INTERVAL)
    return () => clearInterval(interval)
  }, [])
  
  // Effect untuk mengolah data menjadi statistik harian (Polimorfisme)
  useEffect(() => {
    if (plantData.length === 0) return;

    // KETERANGAN: Map untuk mengumpulkan semua nilai per hari
    const aggregatedMap = new Map<string, any>();

    // Logika Agregasi
    plantData.forEach(item => {
      // Kunci grup: Tanggal (misalnya: 06 Des)
      const dateKey = new Date(item.timestamp).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'});

      if (!aggregatedMap.has(dateKey)) {
        aggregatedMap.set(dateKey, { date: dateKey });
      }

      const currentStats = aggregatedMap.get(dateKey)!;

      sensors.forEach(sensor => {
        const value = sensor.getRawValue(item);
        const prefix = sensor.type === 'air_temperature' ? 'Temp' : sensor.type === 'soil_moisture' ? 'Soil' : 'Air';
        
        const minKey = `min${prefix}` as keyof DailyStats;
        const maxKey = `max${prefix}` as keyof DailyStats;
        const allValuesKey = `all${prefix}Values`;
        
        // Inisialisasi array untuk perhitungan Avg
        if (!currentStats[allValuesKey]) {
             currentStats[allValuesKey] = [];
        }
        currentStats[allValuesKey].push(value);
        
        // Update Min dan Max
        if (currentStats[minKey] === undefined || value < currentStats[minKey]) {
            currentStats[minKey] = value;
        }
        if (currentStats[maxKey] === undefined || value > currentStats[maxKey]) {
            currentStats[maxKey] = value;
        }
      });
    });

    // Kalkulasi Average dan Finalisasi
    const finalData: DailyStats[] = Array.from(aggregatedMap.values()).map(stats => {
      const result: any = { date: stats.date };

      sensors.forEach(sensor => {
        const prefix = sensor.type === 'air_temperature' ? 'Temp' : sensor.type === 'soil_moisture' ? 'Soil' : 'Air';
        const allValuesKey = `all${prefix}Values`;
        const values = stats[allValuesKey] as number[] || [];
        
        const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        
        result[`min${prefix}`] = stats[`min${prefix}`];
        result[`max${prefix}`] = stats[`max${prefix}`];
        result[`avg${prefix}`] = avg;
      });

      return result as DailyStats;
    });

    setDailyStatsChartData(finalData);

  }, [plantData]); // Dipicu saat data mentah diperbarui

  const latestData = plantData[plantData.length - 1]
  const previousData = plantData[plantData.length - 2]

  // POLYMORPHISM: Menggunakan getRawValue dari AbstractSensor untuk menentukan tren
  const getTrend = (currentData: PlantData | undefined, previousData: PlantData | undefined, sensor: AbstractSensor) => {
    if (!currentData || !previousData) return 'stable'
    
    const current = sensor.getRawValue(currentData)
    const previous = sensor.getRawValue(previousData)
    
    const diff = current - previous
    if (diff > 0.5) return 'up'
    if (diff < -0.5) return 'down'
    return 'stable'
  }

  // Menghitung rata-rata total dari semua data yang diambil
  const calculateAverage = (sensor: AbstractSensor) => {
    const dataLength = plantData.length || 1
    const total = plantData.reduce((sum, d) => sum + sensor.getRawValue(d), 0)
    return (total / dataLength).toFixed(1)
  }

  if (loading || !latestData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Memuat data monitoring tanaman...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard Monitoring Tanaman</h1>
          <p className="text-slate-500">Statistik harian dan ringkasan kondisi lingkungan terbaru</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">
            Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
          </span>
        </div>
      </div>

      {/* Demo Mode Alert */}
      {isDemoMode && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-amber-600 font-medium">Mode Demo</p>
            <p className="text-slate-600 text-sm">
              Menampilkan data simulasi. Kredensial Supabase diabaikan.
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title={tempSensor.name}
          value={tempSensor.getRawValue(latestData)}
          unit={tempSensor.unit}
          icon={<Thermometer className="w-6 h-6 text-white" />}
          color={'orange'} 
          trend={getTrend(latestData, previousData, tempSensor)}
          trendValue={`${Math.abs(tempSensor.getRawValue(latestData) - (previousData ? tempSensor.getRawValue(previousData) : 0)).toFixed(1)}${tempSensor.unit}`}
        />
        <StatCard
          title={soilSensor.name}
          value={soilSensor.getRawValue(latestData)}
          unit={soilSensor.unit}
          icon={<Droplets className="w-6 h-6 text-white" />}
          color={'emerald'} 
          trend={getTrend(latestData, previousData, soilSensor)}
          trendValue={`${Math.abs(soilSensor.getRawValue(latestData) - (previousData ? soilSensor.getRawValue(previousData) : 0)).toFixed(1)}${soilSensor.unit}`}
        />
        <StatCard
          title={airSensor.name}
          value={airSensor.getRawValue(latestData)}
          unit={airSensor.unit}
          icon={<CloudRain className="w-6 h-6 text-white" />}
          color={'blue'} 
          trend={getTrend(latestData, previousData, airSensor)}
          trendValue={`${Math.abs(airSensor.getRawValue(latestData) - (previousData ? airSensor.getRawValue(previousData) : 0)).toFixed(1)}${airSensor.unit}`}
        />
      </div>

      {/* --- DIAGRAM GABUNGAN STATISTIK HARIAN --- */}
      <Card className="p-6 lg:col-span-3" gradient>
        <div className="flex items-center gap-2 mb-6">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-800">Statistik Harian (Min, Max, Avg)</h2>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyStatsChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
              />
              {/* Y-Axis 1: Suhu Udara (°C) - Kiri */}
              <YAxis 
                yAxisId="temp"
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
                label={{ 
                    value: 'Suhu (°C)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: '#f97316', 
                    fontSize: 12 
                }}
              />
              {/* Y-Axis 2: Kelembaban (%) - Kanan */}
              <YAxis 
                yAxisId="percent"
                orientation="right"
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
                label={{ 
                    value: 'Kelembaban (%)', 
                    angle: 90, 
                    position: 'insideRight', 
                    fill: '#10b981', 
                    fontSize: 12 
                }}
              />
              <Tooltip
                contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a'
                }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              
              {/* Suhu Udara (Orange) */}
              <Bar yAxisId="temp" dataKey="maxTemp" fill="#f97316" name="Suhu Max" />
              <Bar yAxisId="temp" dataKey="avgTemp" fill="#fbbf24" name="Suhu Avg" />
              <Bar yAxisId="temp" dataKey="minTemp" fill="#fcd34d" name="Suhu Min" />

              {/* Kelembaban Tanah (Emerald) */}
              <Bar yAxisId="percent" dataKey="maxSoil" fill="#059669" name="Tanah Max" />
              <Bar yAxisId="percent" dataKey="avgSoil" fill="#10b981" name="Tanah Avg" />
              <Bar yAxisId="percent" dataKey="minSoil" fill="#34d399" name="Tanah Min" />

              {/* Kelembaban Udara (Blue) */}
              <Bar yAxisId="percent" dataKey="maxAir" fill="#2563eb" name="Udara Max" />
              <Bar yAxisId="percent" dataKey="avgAir" fill="#3b82f6" name="Udara Avg" />
              <Bar yAxisId="percent" dataKey="minAir" fill="#60a5fa" name="Udara Min" />
            </BarChart>
        </ResponsiveContainer>
    </div>
</Card>
      {/* --- END DIAGRAM GABUNGAN STATISTIK HARIAN --- */}


      {/* Quick Stats (Ringkasan Total) */}
      <Card className="p-6" gradient>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Statistik Rata-rata Total</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-slate-500 text-sm mb-1">{tempSensor.name} Rata-rata</p>
            <p className="text-2xl font-bold text-orange-600">{calculateAverage(tempSensor)}{tempSensor.unit}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-sm mb-1">{soilSensor.name} Rata-rata</p>
            <p className="text-2xl font-bold text-emerald-600">{calculateAverage(soilSensor)}{soilSensor.unit}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-sm mb-1">{airSensor.name} Rata-rata</p>
            <p className="text-2xl font-bold text-blue-600">{calculateAverage(airSensor)}{airSensor.unit}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}