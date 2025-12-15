
import { NavLink, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import GrantsList from './pages/GrantsList.jsx'
import GrantDetails from './pages/GrantDetails.jsx'

export default function App() {
  return (
    <>
      <header>
        <nav>
          <strong>GreenTrack</strong>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/grants">Grants</NavLink>
        </nav>
      </header>
      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/grants" element={<GrantsList />} />
          <Route path="/grants/:id" element={<GrantDetails />} />
        </Routes>
      </div>
    </>
  )
}
