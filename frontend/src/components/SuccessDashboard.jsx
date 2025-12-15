
import React, { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function SuccessDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await api.stats()
      setStats(data)
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div>Loading statistics...</div>
  if (!stats) return <div>Unable to load statistics</div>

  const totalApplications = (
    parseInt(stats.successful || 0, 10) +
    parseInt(stats.unsuccessful || 0, 10) +
    parseInt(stats.awaiting_decision || 0, 10)
  )
  const successRate = totalApplications > 0 ? ((parseInt(stats.successful, 10) / totalApplications) * 100).toFixed(1) : 0

  return (
    <div className="success-dashboard">
      <h2>📊 Your Success Metrics</h2>
      <div className="stats-grid">
        <div className="stat-card"><h3>{totalApplications}</h3><p>Total Applications</p></div>
        <div className="stat-card success"><h3>{stats.successful}</h3><p>✅ Successful</p></div>
        <div className="stat-card unsuccessful"><h3>{stats.unsuccessful}</h3><p>❌ Unsuccessful</p></div>
        <div className="stat-card awaiting"><h3>{stats.awaiting_decision}</h3><p>⏳ Awaiting Decision</p></div>
        <div className="stat-card success-rate"><h3>{successRate}%</h3><p>Success Rate</p></div>
        <div className="stat-card total-won"><h3>£{(parseInt(stats.total_won || 0, 10)).toLocaleString()}</h3><p>Total Funding Won</p></div>
      </div>

      {stats.upcoming_deadlines && stats.upcoming_deadlines.length > 0 && (
        <div className="upcoming-deadlines card">
          <h3>⏰ Upcoming Deadlines</h3>
          <ul>
            {stats.upcoming_deadlines.map((grant, index) => (
              <li key={index}><strong>{grant.name}</strong> - {grant.deadline} ({grant.amount})</li>
            ))}
          </ul>
        </div>
      )}

      {stats.recent_outcomes && stats.recent_outcomes.length > 0 && (
        <div className="recent-outcomes card">
          <h3>📮 Recent Outcomes</h3>
          <ul>
            {stats.recent_outcomes.map((grant, index) => (
              <li key={index} className={grant.outcome.toLowerCase()}>
                <strong>{grant.name}</strong>{' '}
                {grant.outcome === 'Successful' ? (
                  <span className="outcome-success">✅ £{(grant.amount_awarded || 0).toLocaleString()} awarded</span>
                ) : (
                  <span className="outcome-unsuccessful">❌ Unsuccessful</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
