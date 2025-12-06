// src/components/Layout.tsx

import { NavLink, Outlet } from 'react-router-dom'
import { Home, Leaf, Settings, Database, Info } from 'lucide-react'
import { useRef } from 'react'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/realtime', icon: Leaf, label: 'Realtime Tanaman' },
  { to: '/calibration', icon: Settings, label: 'Kalibrasi' },
  { to: '/datalog', icon: Database, label: 'Log Data' },
  { to: '/about', icon: Info, label: 'Tentang' },
]

export function Layout() {
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
  }

  return (
    // KETERANGAN: Main background putih, text default slate-800
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      {/* Header - Hidden on Mobile, Visible on Desktop */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Logo icon */}
              <div className="p-2 bg-linear-to-br from-emerald-600 to-green-500 rounded-xl shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              {/* PERBAIKAN KRITIS: Teks Header menggunakan warna solid gelap */}
              <h1 className="text-xl font-bold text-slate-800"> 
                Dashboard Monitoring Tanaman
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        // KETERANGAN: Nav aktif menjadi BG hijau emerald
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                        // KETERANGAN: Nav inactive menjadi text slate-600, hover BG slate-100
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Header - Mobile with Logo only */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-md">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-emerald-600 to-green-500 rounded-xl shadow">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            {/* PERBAIKAN KRITIS: Teks Header menggunakan warna solid gelap */}
            <h1 className="text-lg font-bold text-slate-800">
              Monitoring Tanaman
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {/* Konten utama yang berisi halaman-halaman */}
      <main className="md:pt-16 pt-16 pb-24 md:pb-8 flex-1 min-h-screen" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg">
        <div className="flex justify-around items-center">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-4 flex-1 transition-all duration-200 ${
                  isActive
                    // KETERANGAN: Nav aktif BG transparan, icon/text hijau emerald
                    ? 'text-emerald-600 border-t-2 border-emerald-500'
                    // KETERANGAN: Nav inactive text slate-500, hover text slate-800
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
              title={label}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-slate-50 border-t border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            © 2025 Dashboard Monitoring Tanaman. Modern design with Realtime Tanaman.
          </p>
        </div>
      </footer>
    </div>
  )
}