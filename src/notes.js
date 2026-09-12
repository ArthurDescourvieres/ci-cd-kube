import { Router } from 'express'
import db from './db.js'

const router = Router()

router.get('/', (req, res) => {
  const notes = db.prepare('SELECT * FROM notes ORDER BY id DESC').all()

  res.json(notes)
})

router.post('/', (req, res) => {
  const { title, content } = req.body

  if (!title) {
    return res.status(400).json({ error: 'title is required' })
  }

  const { lastInsertRowid } = db
    .prepare('INSERT INTO notes (title, content) VALUES (?, ?)')
    .run(title, content ?? '')

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(lastInsertRowid)

  res.status(201).json(note)
})

router.get('/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id)

  if (!note) {
    return res.status(404).json({ error: 'note not found' })
  }

  res.json(note)
})

router.put('/:id', (req, res) => {
  const { title, content } = req.body

  if (!title) {
    return res.status(400).json({ error: 'title is required' })
  }

  const { changes } = db
    .prepare('UPDATE notes SET title = ?, content = ? WHERE id = ?')
    .run(title, content ?? '', req.params.id)

  if (changes === 0) {
    return res.status(404).json({ error: 'note not found' })
  }

  res.json(db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id)

  if (changes === 0) {
    return res.status(404).json({ error: 'note not found' })
  }

  res.status(204).end()
})

export default router