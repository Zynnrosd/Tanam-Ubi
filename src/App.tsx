import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/Home'
import { RealtimePage } from './pages/Realtime'
import { CalibrationPage } from './pages/Calibration'
import { DataLogPage } from './pages/DataLog'
import { AboutPage } from './pages/About'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="realtime" element={<RealtimePage />} />
          <Route path="calibration" element={<CalibrationPage />} />
          <Route path="datalog" element={<DataLogPage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
