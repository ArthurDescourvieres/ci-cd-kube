import { Router } from 'express'
import db from './db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM notes ORDER BY id DESC')

  res.json(rows)
})

router.post('/', async (req, res) => {
  const { title, content } = req.body

  if (!title) {
    return res.status(400).json({ error: 'title is required' })
  }

  const { rows } = await db.query(
    'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
    [title, content ?? ''],
  )

  res.status(201).json(rows[0])
})

router.get('/:id', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM notes WHERE id = $1', [req.params.id])

  if (rows.length === 0) {
    return res.status(404).json({ error: 'note not found' })
  }

  res.json(rows[0])
})

router.put('/:id', async (req, res) => {
  const { title, content } = req.body

  if (!title) {
    return res.status(400).json({ error: 'title is required' })
  }

  const { rows } = await db.query(
    'UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING *',
    [title, content ?? '', req.params.id],
  )

  if (rows.length === 0) {
    return res.status(404).json({ error: 'note not found' })
  }

  res.json(rows[0])
})

router.delete('/:id', async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM notes WHERE id = $1', [req.params.id])

  if (rowCount === 0) {
    return res.status(404).json({ error: 'note not found' })
  }

  res.status(204).end()
})

export default router
