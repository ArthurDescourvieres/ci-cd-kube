import express from 'express'
import notesRouter from './notes.js'

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

app.use('/api/notes', notesRouter)
export default app