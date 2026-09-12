import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import db, { init } from '../../src/db.js'

beforeAll(async () => {
  await init()
})

beforeEach(async () => {
  await db.query('TRUNCATE notes RESTART IDENTITY')
})

afterAll(async () => {
  await db.end()
})

describe('GET /ready', () => {
  it('responds 200 once the database answers', async () => {
    const res = await request(app).get('/ready')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ready' })
  })
})

describe('notes lifecycle', () => {
  it('creates, reads, updates and deletes a note', async () => {
    const created = await request(app)
      .post('/api/notes')
      .send({ title: 'Première note', content: 'du contenu' })

    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ id: 1, title: 'Première note' })
    expect(created.body.created_at).toBeTruthy()

    const read = await request(app).get(`/api/notes/${created.body.id}`)

    expect(read.status).toBe(200)
    expect(read.body.content).toBe('du contenu')

    const updated = await request(app)
      .put(`/api/notes/${created.body.id}`)
      .send({ title: 'Titre modifié' })

    expect(updated.status).toBe(200)
    expect(updated.body.title).toBe('Titre modifié')
    expect(updated.body.content).toBe('')

    const deleted = await request(app).delete(`/api/notes/${created.body.id}`)

    expect(deleted.status).toBe(204)
    expect((await request(app).get('/api/notes')).body).toEqual([])
  })

  it('lists the most recent note first', async () => {
    await request(app).post('/api/notes').send({ title: 'ancienne' })
    await request(app).post('/api/notes').send({ title: 'récente' })

    const res = await request(app).get('/api/notes')

    expect(res.body.map((note) => note.title)).toEqual(['récente', 'ancienne'])
  })

  it('rejects a note without a title', async () => {
    const res = await request(app).post('/api/notes').send({ content: 'orphelin' })

    expect(res.status).toBe(400)
    expect((await request(app).get('/api/notes')).body).toEqual([])
  })

  it('responds 404 on a note that does not exist', async () => {
    expect((await request(app).get('/api/notes/999')).status).toBe(404)
    expect((await request(app).put('/api/notes/999').send({ title: 'x' })).status).toBe(404)
    expect((await request(app).delete('/api/notes/999')).status).toBe(404)
  })

  it('stores a title that would break a concatenated query', async () => {
    const title = "x'); DROP TABLE notes;--"

    const created = await request(app).post('/api/notes').send({ title })

    expect(created.status).toBe(201)
    expect((await request(app).get('/api/notes')).body[0].title).toBe(title)
  })
})
