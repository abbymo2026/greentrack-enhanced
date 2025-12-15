
import React, { useState } from 'react'
import { api } from '../services/api'

export default function OutcomeForm({ grant, onClose, onSaved }) {
  const [outcome, setOutcome] = useState('')
  const [decisionDate, setDecisionDate] = useState('')
  const [amountAwarded, setAmountAwarded] = useState('')
  const [rejectionReasons, setRejectionReasons] = useState('')
  const [funderFeedback, setFunderFeedback] = useState('')
  const [lessonsLearned, setLessonsLearned] = useState('')
  const [resubmissionDate, setResubmissionDate] = useState('')
  const [isAnnualGrant, setIsAnnualGrant] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.postOutcome(grant.id, {
        outcome,
        decision_date: decisionDate,
        amount_awarded: outcome === 'Successful' ? parseInt(amountAwarded || '0', 10) : null,
        rejection_reasons: rejectionReasons,
        funder_feedback: funderFeedback,
        lessons_learned: lessonsLearned,
        resubmission_date: resubmissionDate,
        is_annual_grant: isAnnualGrant,
      })
      onSaved && onSaved()
      onClose && onClose()
    } catch (err) {
      alert(`Could not save outcome: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Record Outcome: {grant.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Outcome *</label>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)} required>
              <option value="">Select...</option>
              <option value="Successful">✅ Successful</option>
              <option value="Unsuccessful">❌ Unsuccessful</option>
            </select>
          </div>
          <div className="form-group">
            <label>Decision Date *</label>
            <input type="date" value={decisionDate} onChange={(e) => setDecisionDate(e.target.value)} required />
          </div>

          {outcome === 'Successful' && (
            <div className="form-group success-fields">
              <label>Amount Awarded (£) *</label>
              <input type="number" value={amountAwarded} onChange={(e) => setAmountAwarded(e.target.value)} required placeholder="e.g., 30000" />
            </div>
          )}

          {outcome === 'Unsuccessful' && (
            <>
              <div className="form-group">
                <label>Rejection Reasons</label>
                <textarea value={rejectionReasons} onChange={(e) => setRejectionReasons(e.target.value)} rows="3" placeholder="Why was it rejected?" />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={isAnnualGrant} onChange={(e) => setIsAnnualGrant(e.target.checked)} />
                  {' '}This is an annual grant (I can reapply)
                </label>
              </div>
              {isAnnualGrant && (
                <div className="form-group">
                  <label>Next Application Deadline</label>
                  <input type="date" value={resubmissionDate} onChange={(e) => setResubmissionDate(e.target.value)} />
                  <small>We'll remind you 3 months before</small>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>Funder Feedback</label>
            <textarea value={funderFeedback} onChange={(e) => setFunderFeedback(e.target.value)} rows="3" placeholder="What did they say?" />
          </div>
          <div className="form-group">
            <label>Lessons Learned</label>
            <textarea value={lessonsLearned} onChange={(e) => setLessonsLearned(e.target.value)} rows="3" placeholder="What will you do differently next time?" />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : outcome === 'Successful' ? '🎉 Record Success' : 'Save Outcome'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
