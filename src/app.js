import express from 'express'

const app = express()

app.get('/', (req, res) => {
      res.json({
            message: 'CI-CD Kube - Github Actions + Kubernetes pipeline',
            version: process.env.APP_VERSION ?? 'dev',
      })
})

app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' })
})

export default app