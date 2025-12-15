require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// ==================== GRANT ENDPOINTS ====================

// Get all grants
app.get('/api/grants', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM grants 
      ORDER BY 
        CASE priority
          WHEN 'HIGHEST' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
        END,
        name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching grants:', err);
    res.status(500).json({ error: 'Failed to fetch grants' });
  }
});

// Get single grant with details
app.get('/api/grants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM grants WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grant not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching grant:', err);
    res.status(500).json({ error: 'Failed to fetch grant' });
  }
});

// Update grant
app.patch('/api/grants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];
    
    const result = await pool.query(
      `UPDATE grants SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating grant:', err);
    res.status(500).json({ error: 'Failed to update grant' });
  }
});

// ==================== OUTCOME ENDPOINTS ====================

// Record outcome (success/failure)
app.post('/api/grants/:id/outcome', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      outcome, 
      decision_date, 
      amount_awarded, 
      rejection_reasons,
      funder_feedback,
      lessons_learned, 
      resubmission_date,
      improvements_needed,
      is_annual_grant
    } = req.body;
    
    // Update grant with outcome
    const result = await pool.query(`
      UPDATE grants 
      SET outcome = $1, 
          decision_date = $2, 
          amount_awarded = $3,
          rejection_reasons = $4,
          funder_feedback = $5,
          lessons_learned = $6, 
          resubmission_date = $7,
          improvements_needed = $8,
          is_annual_grant = $9,
          status = $10, 
          updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      outcome, 
      decision_date, 
      amount_awarded, 
      rejection_reasons,
      funder_feedback,
      lessons_learned, 
      resubmission_date,
      improvements_needed,
      is_annual_grant,
      outcome === 'Successful' ? 'Successful' : outcome === 'Unsuccessful' ? 'Unsuccessful' : 'Submitted',
      id
    ]);
    
    // Create resubmission reminder if applicable
    if (outcome === 'Unsuccessful' && resubmission_date && is_annual_grant) {
      const reminderDate = new Date(resubmission_date);
      reminderDate.setMonth(reminderDate.getMonth() - 3); // 3 months before
      
      await pool.query(`
        INSERT INTO reminders (grant_id, reminder_type, reminder_date)
        VALUES ($1, 'resubmission', $2)
      `, [id, reminderDate.toISOString().split('T')[0]]);
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error recording outcome:', err);
    res.status(500).json({ error: 'Failed to record outcome' });
  }
});

// ==================== COMMUNICATIONS ENDPOINTS ====================

// Add communication
app.post('/api/grants/:id/communications', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, direction, subject, summary, status } = req.body;
    
    const result = await pool.query(`
      INSERT INTO communications (grant_id, date, type, direction, subject, summary, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, date, type, direction, subject, summary, status]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding communication:', err);
    res.status(500).json({ error: 'Failed to add communication' });
  }
});

// Get all communications for a grant
app.get('/api/grants/:id/communications', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM communications 
      WHERE grant_id = $1 
      ORDER BY date DESC, created_at DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching communications:', err);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// Delete communication
app.delete('/api/communications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM communications WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting communication:', err);
    res.status(500).json({ error: 'Failed to delete communication' });
  }
});

// ==================== FILE MANAGEMENT ENDPOINTS ====================

// Upload file with category
app.post('/api/grants/:id/files', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { version_label, is_final, notes, file_category, file_subcategory } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const result = await pool.query(`
      INSERT INTO application_files 
      (grant_id, file_name, file_path, file_type, file_size, version_label, is_final, notes, file_category, file_subcategory)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      id, 
      file.originalname, 
      file.path, 
      file.mimetype, 
      file.size, 
      version_label, 
      is_final === 'true', 
      notes,
      file_category || 'application',
      file_subcategory
    ]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get all files for a grant
app.get('/api/grants/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM application_files WHERE grant_id = $1 ORDER BY uploaded_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Update file metadata (category, notes, etc.)
app.patch('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { version_label, is_final, notes, file_category, file_subcategory } = req.body;
    
    const result = await pool.query(`
      UPDATE application_files 
      SET version_label = COALESCE($1, version_label),
          is_final = COALESCE($2, is_final),
          notes = COALESCE($3, notes),
          file_category = COALESCE($4, file_category),
          file_subcategory = COALESCE($5, file_subcategory)
      WHERE id = $6
      RETURNING *
    `, [version_label, is_final, notes, file_category, file_subcategory, id]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating file:', err);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Download file
app.get('/api/files/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM application_files WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = result.rows[0];
    res.download(file.file_path, file.file_name);
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete file
app.delete('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get file path before deleting
    const result = await pool.query('SELECT file_path FROM application_files WHERE id = $1', [id]);
    
    if (result.rows.length > 0) {
      const filePath = result.rows[0].file_path;
      
      // Delete from database
      await pool.query('DELETE FROM application_files WHERE id = $1', [id]);
      
      // Delete physical file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ==================== DASHBOARD STATS ENDPOINTS ====================

// Get dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_grants,
        COUNT(*) FILTER (WHERE status IN ('Submitted', 'Under Review')) as awaiting_decision,
        COUNT(*) FILTER (WHERE outcome = 'Successful') as successful,
        COUNT(*) FILTER (WHERE outcome = 'Unsuccessful') as unsuccessful,
        COUNT(*) FILTER (WHERE status = 'Not Started') as not_started,
        COUNT(*) FILTER (WHERE status = 'Preparing') as preparing,
        COALESCE(SUM(amount_awarded) FILTER (WHERE outcome = 'Successful'), 0) as total_won
      FROM grants
    `);
    
    // Get upcoming deadlines
    const deadlines = await pool.query(`
      SELECT name, deadline, amount, priority
      FROM grants
      WHERE status NOT IN ('Successful', 'Unsuccessful', 'Withdrawn')
      AND deadline IS NOT NULL
      ORDER BY 
        CASE 
          WHEN deadline ~ '^[0-9]' THEN TO_DATE(deadline, 'Mon DD, YYYY')
          ELSE TO_DATE('9999-12-31', 'YYYY-MM-DD')
        END
      LIMIT 5
    `);
    
    // Get recent outcomes
    const recentOutcomes = await pool.query(`
      SELECT name, outcome, decision_date, amount_awarded
      FROM grants
      WHERE outcome IS NOT NULL
      ORDER BY decision_date DESC
      LIMIT 5
    `);
    
    res.json({
      ...stats.rows[0],
      upcoming_deadlines: deadlines.rows,
      recent_outcomes: recentOutcomes.rows
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get monthly strategy
app.get('/api/strategy/monthly', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT suggested_month, COUNT(*) as count, 
             json_agg(json_build_object(
               'id', id, 
               'name', name, 
               'amount', amount, 
               'priority', priority,
               'status', status,
               'deadline', deadline
             ) ORDER BY 
               CASE priority
                 WHEN 'HIGHEST' THEN 1
                 WHEN 'HIGH' THEN 2
                 WHEN 'MEDIUM' THEN 3
                 WHEN 'LOW' THEN 4
               END
             ) as grants
      FROM grants
      WHERE suggested_month IS NOT NULL
      GROUP BY suggested_month
      ORDER BY 
        TO_DATE(suggested_month || ' 01', 'Month YYYY DD')
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching monthly strategy:', err);
    res.status(500).json({ error: 'Failed to fetch monthly strategy' });
  }
});

// ==================== REMINDERS ENDPOINTS ====================

// Get upcoming reminders
app.get('/api/reminders/upcoming', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, g.name, g.deadline, g.amount
      FROM reminders r
      JOIN grants g ON r.grant_id = g.id
      WHERE r.reminder_date <= CURRENT_DATE + INTERVAL '30 days'
      AND r.sent = FALSE
      ORDER BY r.reminder_date
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reminders:', err);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Mark reminder as sent
app.patch('/api/reminders/:id/sent', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE reminders SET sent = TRUE, email_sent_at = NOW() WHERE id = $1',
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking reminder as sent:', err);
    res.status(500).json({ error: 'Failed to mark reminder as sent' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 ENHANCED Grant Manager API running on port ${port}`);
});

module.exports = app;
