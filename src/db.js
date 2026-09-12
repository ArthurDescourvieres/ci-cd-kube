import pg from 'pg'
import { readFileSync } from 'node:fs'

const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8')

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

pool.on('error', (error) => {
  console.error('database pool error:', error.message)
})

export async function init() {
  await pool.query(schema)
}

export default pool
