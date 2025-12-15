
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api'
import EnhancedFileUpload from '../components/EnhancedFileUpload.jsx'
import FileManager from '../components/FileManager.jsx'
import CommunicationsLog from '../components/CommunicationsLog.jsx'
import OutcomeForm from '../components/OutcomeForm.jsx'

export default function GrantDetails() {
  const { id } = useParams()
  const [grant, setGrant] = useState(null)
  const [showOutcome, setShowOutcome] = useState(false)

  async function load() {
    try {
      const data = await api.getGrant(id)
      setGrant(data)
    } catch (err) {
      // If getGrant is not available, fall back to list and find
      try {
        const all = await api.listGrants()
        setGrant(all.find(g => String(g.id) === String(id)))
      } catch (e) {
        alert(`Error loading grant: ${err.message}`)
      }
    }
  }

  useEffect(() => { load() }, [id])

  if (!grant) return <div className="card"><p>Loading grant...</p></div>

  return (
    <div>
      <div className="card">
        <Link to="/grants" className="btn-secondary">← Back to Grants</Link>
        <h2 style={{marginTop:12}}>{grant.name}</h2>
        <p><strong>Deadline:</strong> {grant.deadline || '—'}</p>
        <p><strong>Amount:</strong> {grant.amount || '—'}</p>
        <div style={{display:'flex', gap:8}}>
          <button className="btn-primary" onClick={() => setShowOutcome(true)}>Record Outcome</button>
        </div>
      </div>

      <EnhancedFileUpload grantId={grant.id} onUploadSuccess={() => { /* optional reload hooks */ }} />
      <FileManager grantId={grant.id} />
      <CommunicationsLog grantId={grant.id} />

      {showOutcome && (
        <OutcomeForm grant={grant} onClose={() => setShowOutcome(false)} onSaved={() => { /* refresh if needed */ }} />
      )}
    </div>
  )
}
