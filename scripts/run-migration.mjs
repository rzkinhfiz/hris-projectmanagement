process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL_NON_POOLING");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    await client.connect();
    console.log("Connected to database.");

    const sqlPath = path.join(process.cwd(), 'build-guides', 'sql', '06-administrator-role.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Executing migration script...");
    const queries = sql.split('-- COMMIT;');
    for (const query of queries) {
      if (query.trim()) {
        await client.query(query);
      }
    }

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

runMigration();
