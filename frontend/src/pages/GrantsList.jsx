
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function GrantsList() {
  const [grants, setGrants] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await api.listGrants()
      setGrants(data)
    } catch (err) {
      alert(`Error loading grants: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const filtered = !q ? grants : grants.filter(g => (g.name || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="card">
      <h2>Grant Opportunities</h2>
      <div className="form-group">
        <input placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {loading ? (
        <p>Loading grants...</p>
      ) : (
        <div className="grid">
          {filtered.map((g) => (
            <div key={g.id} className="card">
              <h3 style={{marginTop:0}}>{g.name}</h3>
              {g.amount && <p><strong>Amount:</strong> {g.amount}</p>}
              {g.deadline && <p><strong>Deadline:</strong> {g.deadline}</p>}
              <Link to={`/grants/${g.id}`} className="btn-primary">Open</Link>
            </div>
          ))}
          {filtered.length === 0 && <p>No grants found.</p>}
        </div>
      )}
    </div>
  )}
