import { Routes, Route } from 'react-router'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'
import Opportunities from './pages/Opportunities'
import Bridges from './pages/Bridges'
import Wallet from './pages/Wallet'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/opportunities" element={<Opportunities />} />
      <Route path="/bridges" element={<Bridges />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}