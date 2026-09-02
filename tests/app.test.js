import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'

describe('GET /', () => {
  it('responds 200 with a message and a version', async () => {
    const res = await request(app).get('/')

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('CI-CD Kube')
    expect(res.body).toHaveProperty('version')
  })
})

describe('GET /health', () => {
  it('responds 200 with ok status', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})

describe('unknown route', () => {
  it('responds 404', async () => {
    const res = await request(app).get('/does-not-exist')

    expect(res.status).toBe(404)
  })
})