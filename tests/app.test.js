import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'

describe('GET /', () => {
  it('répond 200 avec un message et une version', async () => {
    const res = await request(app).get('/')

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('CI-CD Kube')
    expect(res.body).toHaveProperty('version')
  })
})

describe('GET /health', () => {
      it('répond 200 et le statut ok', async () => {
        const res = await request(app).get('/health')
    
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ status: 'ok' })
      })
    })
    
    describe('route inconnue', () => {
      it('répond 404', async () => {
        const res = await request(app).get('/nexiste-pas')
    
        expect(res.status).toBe(404)
      })
    })