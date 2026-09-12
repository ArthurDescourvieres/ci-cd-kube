import express from 'express'
import notesRouter from './notes.js'
import db from './db.js'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
      res.json({
            message: 'CI-CD Kube - Arthur',
            version: process.env.APP_VERSION ?? 'dev',
      })
})

app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' })
})

app.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ready' })
  } catch {
    res.status(503).json({ status: 'unavailable' })
  }
})

app.use('/api/notes', notesRouter)

export default app