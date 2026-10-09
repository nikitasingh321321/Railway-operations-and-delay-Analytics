import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FilterProvider } from './context/FilterContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Trains from './pages/Trains'
import Delays from './pages/Delays'
import Stations from './pages/Stations'
import Schedule from './pages/Schedule'

const App: React.FC = () => (
  <FilterProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="trains" element={<Trains />} />
          <Route path="delays" element={<Delays />} />
          <Route path="stations" element={<Stations />} />
          <Route path="schedule" element={<Schedule />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </FilterProvider>
)

export default App
