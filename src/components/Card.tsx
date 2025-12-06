// src/components/Card.tsx

import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  gradient?: boolean
}

// Perbaikan: Menetapkan layout card yang bersih dan modern di atas background putih
export function Card({ children, className = '', gradient = false }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl shadow-xl border border-slate-100 transition-shadow duration-300
        ${gradient 
          ? 'bg-linear-to-br from-white to-slate-50' // Light, soft gradient
          : 'bg-white/95 backdrop-blur-sm' // Nearly solid white
        }
        ${className}
      `}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  unit: string
  icon: ReactNode
  // HANYA menggunakan 3 warna utama yang diperlukan
  color: 'emerald' | 'blue' | 'orange' 
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
}

// KETERANGAN: Skema Warna LIGHT MODE yang sangat subtle dan modern
const colorClasses = {
  emerald: { // Soil Moisture / Kelembaban Tanah (Aksen Hijau Utama)
    bg: 'from-emerald-50/50 to-white', 
    border: 'border-emerald-200', 
    icon: 'from-emerald-600 to-green-500',
    text: 'text-emerald-600'
  },
  orange: { // Air Temperature / Suhu Udara (Warna Hangat)
    bg: 'from-orange-50/50 to-white',
    border: 'border-orange-200',
    icon: 'from-orange-600 to-amber-500',
    text: 'text-orange-600'
  },
  blue: { // Air Humidity / Kelembaban Udara (Warna Dingin)
    bg: 'from-blue-50/50 to-white',
    border: 'border-blue-200',
    icon: 'from-blue-600 to-cyan-500',
    text: 'text-blue-600'
  }
}

export function StatCard({ title, value, unit, icon, color, trend, trendValue }: StatCardProps) {
  const colors = colorClasses[color]
  
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-6
        // Background sangat halus
        bg-linear-to-br ${colors.bg}
        border ${colors.border}
        shadow-lg hover:shadow-xl transition-all duration-300
      `}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-black/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          {/* Icon dengan gradien kuat dan shadow */}
          <div className={`p-3 rounded-xl bg-linear-to-br ${colors.icon} shadow-lg shadow-black/10`}>
            {icon}
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-sm ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-slate-500'
            }`}>
              <span>{trend === 'up' ? '▲' : trend === 'down' ? '▼' : '→'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            <span className={`text-lg font-medium ${colors.text}`}>{unit}</span>
          </div>
        </div>
      </div>
    </div>
  )
}