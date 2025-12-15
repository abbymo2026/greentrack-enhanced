
import React, { useState } from 'react'
import { api } from '../services/api'

export default function EnhancedFileUpload({ grantId, onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [fileCategory, setFileCategory] = useState('application')
  const [fileSubcategory, setFileSubcategory] = useState('')
  const [versionLabel, setVersionLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [isFinal, setIsFinal] = useState(false)
  const [uploading, setUploading] = useState(false)

  const subcategories = {
    application: ['Draft', 'Final Submission', 'Budget', 'Business Plan', 'Supporting Document'],
    communication: ['Initial Inquiry', 'Questions from Funder', 'Our Response', 'General Correspondence'],
    outcome: ['Acceptance Letter', 'Rejection Letter', 'Grant Agreement', 'Funder Feedback'],
    reporting: ['Progress Report', 'Financial Report', 'Final Report', 'Evidence'],
    other: ['Reference Letter', 'Screenshot', 'Testimonial', 'Other']
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_category', fileCategory)
    formData.append('file_subcategory', fileSubcategory)
    formData.append('version_label', versionLabel)
    formData.append('notes', notes)
    formData.append('is_final', isFinal)

    try {
      await api.uploadFile(grantId, formData)
      onUploadSuccess && onUploadSuccess()
      setFile(null)
      setFileCategory('application')
      setFileSubcategory('')
      setVersionLabel('')
      setNotes('')
      setIsFinal(false)
    } catch (err) {
      alert(`Upload error: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="enhanced-file-upload card">
      <h3>Upload Document</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>File *</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
        </div>
        <div className="form-group">
          <label>Category *</label>
          <select value={fileCategory} onChange={(e) => { setFileCategory(e.target.value); setFileSubcategory('') }} required>
            <option value="application">📄 Application Files</option>
            <option value="communication">📧 Funder Communications</option>
            <option value="outcome">📋 Outcomes (Acceptance/Rejection)</option>
            <option value="reporting">📊 Reporting</option>
            <option value="other">📎 Other Documents</option>
          </select>
        </div>
        <div className="form-group">
          <label>Subcategory</label>
          <select value={fileSubcategory} onChange={(e) => setFileSubcategory(e.target.value)}>
            <option value="">Select...</option>
            {subcategories[fileCategory].map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
        {fileCategory === 'application' && (
          <>
            <div className="form-group">
              <label>Version Label</label>
              <input type="text" value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="e.g., Draft 1, Draft 2, Final" />
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} />{' '}
                This is the final submission
              </label>
            </div>
          </>
        )}
        <div className="form-group">
          <label>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" placeholder="Any notes about this file?" />
        </div>
        <button type="submit" className="btn-primary" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>
    </div>
  )
}
