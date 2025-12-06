// src/pages/DataLog.tsx

import { useEffect, useState } from 'react'
import { Database, Download, Search, Calendar, ChevronLeft, ChevronRight, Filter, RefreshCw } from 'lucide-react'
import { Card } from '../components/Card'
import { dataSource, isDemoMode } from '../lib/supabase'
import type { PlantData } from '../types/database' 
import { AirTemperatureSensor, SoilMoistureSensor, AirHumiditySensor } from '../classes/Sensor'

const ITEMS_PER_PAGE = 10

export function DataLogPage() {
  const [data, setData] = useState<PlantData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  // Menggunakan keyof PlantData untuk sorting
  const [sortField, setSortField] = useState<keyof PlantData>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Sensor Instances (POLYMORPHISM)
  const tempSensor = new AirTemperatureSensor()
  const soilSensor = new SoilMoistureSensor()
  const airSensor = new AirHumiditySensor()

  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        // Generate lebih banyak data demo untuk tampilan log
        const demoData: PlantData[] = dataSource.generateDemoData(200) 
        setData(demoData)
      } else {
        // POLYMORPHISM: Use the IDataSource to fetch data
        const fetchedData = await dataSource.fetchLatestData(500)
        setData(fetchedData.reverse()) 
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setData(dataSource.generateDemoData(200))
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort data
  const filteredData = data
    .filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.air_temperature.toString().includes(searchQuery) || 
        item.soil_moisture.toString().includes(searchQuery) ||
        item.air_humidity.toString().includes(searchQuery) 
      
      const matchesDate = dateFilter === '' ||
        item.timestamp.startsWith(dateFilter)
      
      return matchesSearch && matchesDate
    })
    .sort((a, b) => {
      // POLYMORPHISM: Logika sorting yang generik
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSort = (field: keyof PlantData) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', `${tempSensor.name} (${tempSensor.unit})`, `${soilSensor.name} (${soilSensor.unit})`, `${airSensor.name} (${airSensor.unit})`].join(','),
      ...filteredData.map(row => [
        row.timestamp,
        row.air_temperature.toFixed(2), 
        row.soil_moisture.toFixed(2),
        row.air_humidity.toFixed(2), 
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `plant_data_log_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const SortIcon = ({ field }: { field: keyof PlantData }) => {
    if (sortField !== field) return null
    return (
      <span className="ml-1 text-emerald-600">
        {sortOrder === 'asc' ? '▲' : '▼'}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Log Data Tanaman</h1>
          <p className="text-slate-500">Riwayat pembacaan sensor dengan fitur pencarian dan ekspor</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh Button Style */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {/* Export Button Style */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4" gradient>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Cari nilai sensor..."
              // FIX: Input style untuk tema terang
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setCurrentPage(1)
              }}
              // FIX: Input style untuk tema terang
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
          {/* Filter Status Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">{filteredData.length} data</span>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="overflow-hidden" gradient>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Memuat data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th 
                      className="px-6 py-4 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className="flex items-center">
                        Waktu
                        <SortIcon field="timestamp" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort('air_temperature')} 
                    >
                      <div className="flex items-center">
                        {tempSensor.name} ({tempSensor.unit})
                        <SortIcon field="air_temperature" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort('soil_moisture')}
                    >
                      <div className="flex items-center">
                        {soilSensor.name} ({soilSensor.unit})
                        <SortIcon field="soil_moisture" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort('air_humidity')} 
                    >
                      <div className="flex items-center">
                        {airSensor.name} ({airSensor.unit})
                        <SortIcon field="air_humidity" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedData.map((row) => (
                    <tr 
                      key={row.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(row.timestamp).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'medium'
                        })}
                      </td>
                      {/* Badge Temperature */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 text-sm font-medium">
                          {row.air_temperature.toFixed(2)}
                        </span>
                      </td>
                      {/* Badge Soil Moisture */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm font-medium">
                          {row.soil_moisture.toFixed(2)}
                        </span>
                      </td>
                      {/* Badge Air Humidity */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-sm font-medium">
                          {row.air_humidity.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 p-4">
              {paginatedData.map((row) => (
                <div 
                  key={row.id}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500 font-medium">Waktu</span>
                    <span className="text-xs text-slate-600">
                      {new Date(row.timestamp).toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{tempSensor.name}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-orange-500/10 text-orange-600 text-xs font-medium">
                        {row.air_temperature.toFixed(2)}{tempSensor.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{soilSensor.name}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                        {row.soil_moisture.toFixed(1)}{soilSensor.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{airSensor.name}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-blue-500/10 text-blue-600 text-xs font-medium">
                        {row.air_humidity.toFixed(1)}{airSensor.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 md:px-6 py-3 md:py-4 bg-slate-50 border-t border-slate-200">
              <p className="text-xs md:text-sm text-slate-500">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
              </p>
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 md:p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <div className="flex items-center gap-0.5 md:gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page
                    if (totalPages <= 5) {
                      page = i + 1
                    } else if (currentPage <= 3) {
                      page = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i
                    } else {
                      page = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-lg text-xs md:text-sm font-medium transition-all ${
                          currentPage === page
                            // FIX: Active button style
                            ? 'bg-emerald-600 text-white'
                            // FIX: Inactive button style
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 md:p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Summary Stats */}
      <Card className="p-6" gradient>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-800">Ringkasan Data</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-slate-500 text-sm mb-1">Total Data</p>
            <p className="text-2xl font-bold text-slate-800">{data.length}</p>
          </div>
          <div>
            <p className="text-slate-500 text-sm mb-1">Data Hari Ini</p>
            <p className="text-2xl font-bold text-blue-600">
              {data.filter(d => 
                new Date(d.timestamp).toDateString() === new Date().toDateString()
              ).length}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-sm mb-1">Data Terfilter</p>
            <p className="text-2xl font-bold text-emerald-600">{filteredData.length}</p>
          </div>
          <div>
            <p className="text-slate-500 text-sm mb-1">Rentang Waktu</p>
            <p className="text-sm font-medium text-orange-600">
              {data.length > 0 && filteredData.length > 0 ? (
                <>
                  {new Date(filteredData[filteredData.length - 1].timestamp).toLocaleDateString('id-ID')} - {new Date(filteredData[0].timestamp).toLocaleDateString('id-ID')}
                </>
              ) : '-'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}