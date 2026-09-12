import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'

const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8')

const db = new DatabaseSync(process.env.DATABASE_FILE ?? ':memory:')

db.exec(schema)

export default db