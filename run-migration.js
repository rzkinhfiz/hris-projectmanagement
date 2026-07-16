const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: "postgres://postgres.kzjxkjkmfmhhudenvnee:smi9y5u1uliNgYoS@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const sql = fs.readFileSync('build-guides/sql/15-user-status.sql', 'utf8');
    await client.query(sql);
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
