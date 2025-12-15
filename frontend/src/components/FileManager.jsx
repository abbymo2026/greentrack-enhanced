
import React, { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function FileManager({ grantId }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadFiles() {
    setLoading(true)
    try {
      const data = await api.listFiles(grantId)
      setFiles(data)
    } catch (err) {
      alert(`Error loading files: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFiles() }, [grantId])

  async function deleteFile(fileId) {
    if (!window.confirm('Delete this file?')) return
    try {
      await api.deleteFile(fileId)
      await loadFiles()
    } catch (err) {
      alert(`Error deleting file: ${err.message}`)
    }
  }

  const grouped = files.reduce((acc, f) => {
    const category = f.file_category || 'application'
    acc[category] = acc[category] || []
    acc[category].push(f)
    return acc
  }, {})

  const categoryIcons = {
    application: '📄',
    communication: '📧',
    outcome: '📋',
    reporting: '📊',
    other: '📎'
  }
  const categoryNames = {
    application: 'Application Files',
    communication: 'Funder Communications',
    outcome: 'Outcomes',
    reporting: 'Reporting',
    other: 'Other Documents'
  }

  if (loading) return <div>Loading files...</div>
  return (
    <div className="file-manager card">
      <h3>Documents</h3>
      {Object.keys(grouped).length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        Object.entries(grouped).map(([category, list]) => (
          <div key={category} className="file-category">
            <h4>
              {categoryIcons[category]} {categoryNames[category]} ({list.length})
            </h4>
            <div className="file-list">
              {list.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-info">
                    <strong>{file.file_name}</strong>
                    {file.file_subcategory && (
                      <span className="file-subcategory">{file.file_subcategory}</span>
                    )}
                    {file.version_label && (
                      <span className="file-version">{file.version_label}</span>
                    )}
                    {file.is_final && <span className="file-final">✓ Final</span>}
                    {file.notes && <p className="file-notes">{file.notes}</p>}
                    <small>{new Date(file.uploaded_at).toLocaleDateString()}</small>
                  </div>
                  <div className="file-actions">
                    <a href={api.downloadFileUrl(file.id)} target="_blank" rel="noreferrer" className="btn-sm btn-secondary">Download</a>
                    <button onClick={() => deleteFile(file.id)} className="btn-sm btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
