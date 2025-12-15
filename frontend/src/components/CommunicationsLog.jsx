
import React, { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function CommunicationsLog({ grantId }) {
  const [communications, setCommunications] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'email',
    direction: 'received',
    subject: '',
    summary: '',
    status: ''
  })

  async function load() {
    try {
      const data = await api.listComms(grantId)
      setCommunications(data)
    } catch (err) {
      alert(`Error loading communications: ${err.message}`)
    }
  }

  useEffect(() => { load() }, [grantId])

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await api.addComm(grantId, formData)
      await load()
      setShowAddForm(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'email',
        direction: 'received',
        subject: '',
        summary: '',
        status: ''
      })
    } catch (err) {
      alert(`Error adding communication: ${err.message}`)
    }
  }

  async function deleteCommunication(id) {
    if (!window.confirm('Delete this communication?')) return
    try {
      await api.deleteComm(id)
      await load()
    } catch (err) {
      alert(`Error deleting communication: ${err.message}`)
    }
  }

  return (
    <div className="communications-log card">
      <div className="communications-header">
        <h3>Communications Log</h3>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
          {showAddForm ? 'Cancel' : '+ Add Communication'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="add-communication-form">
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
                <option value="email">📧 Email</option>
                <option value="phone">📞 Phone Call</option>
                <option value="meeting">🤝 Meeting</option>
                <option value="document">📄 Document</option>
              </select>
            </div>
            <div className="form-group">
              <label>Direction *</label>
              <select value={formData.direction} onChange={(e) => setFormData({ ...formData, direction: e.target.value })} required>
                <option value="received">⬅️ Received from Funder</option>
                <option value="sent">➡️ Sent to Funder</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Subject/Title *</label>
            <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Additional Information Required" required />
          </div>
          <div className="form-group">
            <label>Summary/Notes</label>
            <textarea value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} rows="3" placeholder="What was discussed?" />
          </div>
          <div className="form-group">
            <label>Status</label>
            <input type="text" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} placeholder="e.g., Awaiting response, Resolved" />
          </div>
          <button type="submit" className="btn-primary">Save Communication</button>
        </form>
      )}

      <div className="communications-list">
        {communications.length === 0 ? (
          <p>No communications logged yet.</p>
        ) : (
          communications.map((comm) => (
            <div key={comm.id} className="communication-item">
              <div className="communication-header">
                <div>
                  <span className="communication-date">{new Date(comm.date).toLocaleDateString()}</span>
                  <span className="communication-type">{comm.type}</span>
                  <span className={`communication-direction ${comm.direction}`}>
                    {comm.direction === 'received' ? '⬅️ From Funder' : '➡️ To Funder'}
                  </span>
                </div>
                <button onClick={() => deleteCommunication(comm.id)} className="btn-sm btn-danger">Delete</button>
              </div>
              <h4>{comm.subject}</h4>
              {comm.summary && <p>{comm.summary}</p>}
              {comm.status && <span className="communication-status">{comm.status}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
