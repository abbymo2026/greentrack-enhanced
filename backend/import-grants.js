require('dotenv').config();
const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function importGrants() {
  const client = await pool.connect();
  
  try {
    console.log('📥 Importing grants from Excel...');

    // Read the Excel file
    const excelPath = path.join(__dirname, 'GreenTrack_300_Opportunities_NORWICH.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = 'Grants'; // The sheet with grant data
    const worksheet = workbook.Sheets[sheetName];
    const grants = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${grants.length} grants to import`);

    let imported = 0;
    let skipped = 0;

    for (const grant of grants) {
      try {
        // Check if grant already exists
        const existing = await client.query(
          'SELECT id FROM grants WHERE name = $1',
          [grant.name]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        // Insert grant
        await client.query(`
          INSERT INTO grants (
            name, amount, ease, fit, category, deadline, url, priority, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          grant.name,
          grant.amount,
          grant.ease || 3,
          grant.fit || 3,
          grant.category,
          grant.deadline,
          grant.url || '',
          grant.priority || 'MEDIUM',
          grant.status || 'Not Started'
        ]);

        imported++;

        if (imported % 50 === 0) {
          console.log(`  Imported ${imported} grants...`);
        }
      } catch (err) {
        console.error(`  Error importing grant "${grant.name}":`, err.message);
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`  Imported: ${imported} grants`);
    console.log(`  Skipped: ${skipped} grants (already exist)`);
    console.log(`  Total in database: ${imported + skipped} grants`);

  } catch (err) {
    console.error('❌ Import error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

importGrants().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
