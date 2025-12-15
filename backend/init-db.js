require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Initializing ENHANCED database...');

    // Create grants table with enhanced fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS grants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        amount VARCHAR(200),
        ease INTEGER CHECK (ease >= 1 AND ease <= 5),
        fit INTEGER CHECK (fit >= 1 AND fit <= 5),
        category VARCHAR(200),
        deadline VARCHAR(200),
        url VARCHAR(500),
        priority VARCHAR(20),
        status VARCHAR(50) DEFAULT 'Not Started',
        notes TEXT,
        application_date DATE,
        suggested_month VARCHAR(50),
        documents_needed TEXT[],
        
        -- ENHANCED: Outcome tracking
        outcome VARCHAR(50),
        decision_date DATE,
        amount_awarded INTEGER,
        rejection_reasons TEXT,
        funder_feedback TEXT,
        lessons_learned TEXT,
        
        -- ENHANCED: Resubmission tracking
        resubmission_date DATE,
        is_annual_grant BOOLEAN DEFAULT FALSE,
        improvements_needed TEXT,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Enhanced grants table created');

    // Create application_files table with categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS application_files (
        id SERIAL PRIMARY KEY,
        grant_id INTEGER REFERENCES grants(id) ON DELETE CASCADE,
        file_name VARCHAR(500) NOT NULL,
        file_path VARCHAR(1000) NOT NULL,
        file_type VARCHAR(100),
        file_size INTEGER,
        version_label VARCHAR(200),
        is_final BOOLEAN DEFAULT FALSE,
        notes TEXT,
        
        -- ENHANCED: File categorization
        file_category VARCHAR(50) DEFAULT 'application',
        file_subcategory VARCHAR(100),
        
        uploaded_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Enhanced application files table created');

    // ENHANCED: Communications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS communications (
        id SERIAL PRIMARY KEY,
        grant_id INTEGER REFERENCES grants(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        type VARCHAR(50), -- email, phone, meeting, document
        direction VARCHAR(50), -- received, sent
        subject VARCHAR(500),
        summary TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Communications table created');

    // ENHANCED: Reminders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        grant_id INTEGER REFERENCES grants(id) ON DELETE CASCADE,
        reminder_type VARCHAR(100), -- deadline, followup, resubmission
        reminder_date DATE NOT NULL,
        sent BOOLEAN DEFAULT FALSE,
        email_sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Reminders table created');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_grants_priority ON grants(priority);
      CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(status);
      CREATE INDEX IF NOT EXISTS idx_grants_outcome ON grants(outcome);
      CREATE INDEX IF NOT EXISTS idx_grants_category ON grants(category);
      CREATE INDEX IF NOT EXISTS idx_grants_month ON grants(suggested_month);
      CREATE INDEX IF NOT EXISTS idx_communications_grant ON communications(grant_id);
      CREATE INDEX IF NOT EXISTS idx_reminders_grant ON reminders(grant_id);
      CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
      CREATE INDEX IF NOT EXISTS idx_files_category ON application_files(file_category);
    `);

    console.log('✅ Indexes created');

    // Check if we need to populate data
    const countResult = await client.query('SELECT COUNT(*) FROM grants');
    const count = parseInt(countResult.rows[0].count);

    if (count === 0) {
      console.log('📥 Database is empty - ready for import...');
      console.log('⚠️  Run import-grants.js to load your 300 grants');
    } else {
      console.log(`ℹ️  Database already contains ${count} grants`);
    }

    console.log('🎉 ENHANCED database initialization complete!');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
