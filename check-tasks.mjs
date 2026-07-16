import { Client } from 'pg';
import fs from 'fs';

async function run() {
  const url = process.env.POSTGRES_URL_NON_POOLING || "postgres://postgres.kzjxkjkmfmhhudenvnee:smi9y5u1uliNgYoS@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require";
  const client = new Client({ 
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    
    // Check who is the current user. Since we don't know the exact UUID, we will query all tasks with planned_start_date containing '2026-07-16'
    const res = await client.query(`
      SELECT t.id, t.name, t.planned_start_date, t.planned_end_date, t.owner_id, p.email 
      FROM tasks t
      LEFT JOIN auth.users p ON t.owner_id = p.id
      WHERE t.planned_start_date <= '2026-07-31' AND t.planned_end_date >= '2026-07-01'
    `);
    
    console.log("Tasks in July 2026:");
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
