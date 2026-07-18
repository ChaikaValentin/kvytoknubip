import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/:id', (req, res) => {
  const session = db.prepare(`
    SELECT s.id, s.starts_at, s.format, s.price_standard, s.price_comfort,
           m.id AS movie_id, m.title AS movie_title, m.age_rating, m.poster_style,
           h.name AS hall_name, h.rows_count, h.seats_per_row, h.comfort_rows,
           c.name AS cinema_name, c.address
    FROM sessions s
    JOIN movies m ON m.id = s.movie_id
    JOIN halls h ON h.id = s.hall_id
    JOIN cinemas c ON c.id = h.cinema_id
    WHERE s.id = ?
  `).get(req.params.id)
  if (!session) return res.status(404).json({ error: 'not_found' })
  const occupied = db.prepare(`
    SELECT t.row, t.seat FROM tickets t
    JOIN orders o ON o.id = t.order_id
    WHERE o.session_id = ? AND (o.status = 'paid' OR (o.status = 'pending' AND o.expires_at > datetime('now')))
  `).all(session.id)
  res.json({ ...session, comfort_rows: JSON.parse(session.comfort_rows), occupied })
})

export default router
