import { Router } from 'express'
import db from '../db.js'

const router = Router()

const ORDER_SELECT = `
  SELECT o.id, o.email, o.total, o.promo_code, o.created_at,
         s.starts_at, s.format,
         m.title AS movie_title, m.poster_style, m.age_rating,
         h.name AS hall_name, c.name AS cinema_name, c.address
  FROM orders o
  JOIN sessions s ON s.id = o.session_id
  JOIN movies m ON m.id = s.movie_id
  JOIN halls h ON h.id = s.hall_id
  JOIN cinemas c ON c.id = h.cinema_id
`

router.get('/', (req, res) => {
  const email = req.query.email
  const ids = String(req.query.ids || '').split(',').map(Number).filter(Number.isInteger)
  let orders = []
  if (email) {
    orders = db.prepare(`${ORDER_SELECT} WHERE o.status = 'paid' AND lower(o.email) = lower(?) ORDER BY s.starts_at DESC`).all(email)
  } else if (ids.length) {
    orders = db.prepare(`${ORDER_SELECT} WHERE o.status = 'paid' AND o.id IN (${ids.map(() => '?').join(',')}) ORDER BY s.starts_at DESC`).all(...ids)
  }
  const ticketsStmt = db.prepare('SELECT id, row, seat, seat_type, price, code FROM tickets WHERE order_id = ? ORDER BY row, seat')
  res.json({ orders: orders.map(o => ({ ...o, tickets: ticketsStmt.all(o.id) })) })
})

export default router
