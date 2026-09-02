import express from 'express'

const app = express()

app.get('/', (req, res) => {
      res.json({
            message: 'CI-CD Kube - pipeline Github Actions + Kubernetes',
            version: process.env.APP_VERSION ?? 'dev',
      })
})

app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' })
})

export default app