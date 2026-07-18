import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import db from '../db.js'

const router = Router()

const HOLD_MINUTES = 10
const PROMOS = { KVYTOK10: 0.1 }

function getOrderFull(id) {
  const order = db.prepare(`
    SELECT o.*, CAST((julianday(o.expires_at) - julianday('now')) * 86400 AS INTEGER) AS seconds_left,
           s.starts_at, s.format,
           m.id AS movie_id, m.title AS movie_title, m.poster_style, m.age_rating,
           h.name AS hall_name, c.name AS cinema_name, c.address
    FROM orders o
    JOIN sessions s ON s.id = o.session_id
    JOIN movies m ON m.id = s.movie_id
    JOIN halls h ON h.id = s.hall_id
    JOIN cinemas c ON c.id = h.cinema_id
    WHERE o.id = ?
  `).get(id)
  if (!order) return null
  order.tickets = db.prepare('SELECT id, row, seat, seat_type, price, code FROM tickets WHERE order_id = ? ORDER BY row, seat').all(id)
  return order
}

router.post('/', (req, res) => {
  const { sessionId, seats } = req.body ?? {}
  if (!sessionId || !Array.isArray(seats) || seats.length === 0) return res.status(400).json({ error: 'bad_request' })
  const session = db.prepare('SELECT s.*, h.rows_count, h.seats_per_row, h.comfort_rows FROM sessions s JOIN halls h ON h.id = s.hall_id WHERE s.id = ?').get(sessionId)
  if (!session) return res.status(404).json({ error: 'session_not_found' })
  const comfortRows = JSON.parse(session.comfort_rows)
  const keys = new Set()
  for (const p of seats) {
    if (!Number.isInteger(p?.row) || !Number.isInteger(p?.seat)) return res.status(400).json({ error: 'bad_seat' })
    if (p.row < 1 || p.row > session.rows_count || p.seat < 1 || p.seat > session.seats_per_row) return res.status(400).json({ error: 'bad_seat' })
    const key = `${p.row}:${p.seat}`
    if (keys.has(key)) return res.status(400).json({ error: 'duplicate_seat' })
    keys.add(key)
  }
  try {
    const orderId = db.transaction(() => {
      const occupied = new Set(db.prepare(`
        SELECT t.row || ':' || t.seat AS k FROM tickets t
        JOIN orders o ON o.id = t.order_id
        WHERE o.session_id = ? AND (o.status = 'paid' OR (o.status = 'pending' AND o.expires_at > datetime('now')))
      `).all(sessionId).map(r => r.k))
      const taken = seats.filter(p => occupied.has(`${p.row}:${p.seat}`))
      if (taken.length) {
        const err = new Error('seats_taken')
        err.taken = taken
        throw err
      }
      const priced = seats.map(p => {
        const comfort = comfortRows.includes(p.row)
        return { ...p, type: comfort ? 'comfort' : 'standard', price: comfort ? session.price_comfort : session.price_standard }
      })
      const total = priced.reduce((sum, p) => sum + p.price, 0)
      const info = db.prepare(`INSERT INTO orders (session_id, status, total, expires_at) VALUES (?, 'pending', ?, datetime('now', '+${HOLD_MINUTES} minutes'))`).run(sessionId, total)
      const insertTicket = db.prepare('INSERT INTO tickets (order_id, row, seat, seat_type, price, code) VALUES (?,?,?,?,?,?)')
      for (const p of priced) insertTicket.run(info.lastInsertRowid, p.row, p.seat, p.type, p.price, randomUUID())
      return info.lastInsertRowid
    })()
    res.status(201).json(getOrderFull(orderId))
  } catch (err) {
    if (err.message === 'seats_taken') return res.status(409).json({ error: 'seats_taken', seats: err.taken })
    throw err
  }
})

router.get('/:id', (req, res) => {
  const order = getOrderFull(req.params.id)
  if (!order) return res.status(404).json({ error: 'not_found' })
  res.json(order)
})

router.post('/:id/pay', async (req, res) => {
  const order = getOrderFull(req.params.id)
  if (!order) return res.status(404).json({ error: 'not_found' })
  if (order.status === 'paid') return res.status(409).json({ error: 'already_paid' })
  if (order.seconds_left <= 0) return res.status(410).json({ error: 'expired' })
  const { email, phone, applePay, card } = req.body ?? {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) return res.status(400).json({ error: 'bad_email' })
  const phoneDigits = String(phone || '').replace(/\D/g, '')
  if (phoneDigits.length < 10 || phoneDigits.length > 12) return res.status(400).json({ error: 'bad_phone' })
  if (!applePay) {
    const number = String(card?.number || '').replace(/\s/g, '')
    if (!/^\d{16}$/.test(number)) return res.status(400).json({ error: 'bad_card' })
    if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(card?.expiry || '')) return res.status(400).json({ error: 'bad_expiry' })
    if (!/^\d{3}$/.test(card?.cvv || '')) return res.status(400).json({ error: 'bad_cvv' })
  }
  await new Promise(resolve => setTimeout(resolve, 1500))
  db.prepare("UPDATE orders SET status = 'paid', email = ?, phone = ? WHERE id = ?").run(email, phone, order.id)
  res.json(getOrderFull(order.id))
})

router.post('/:id/promo', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: 'not_found' })
  if (order.status !== 'pending') return res.status(409).json({ error: 'already_paid' })
  if (order.promo_code) return res.status(409).json({ error: 'promo_already_applied' })
  const code = String(req.body?.code || '').trim().toUpperCase()
  const discount = PROMOS[code]
  if (!discount) return res.status(404).json({ error: 'promo_not_found' })
  const base = db.prepare('SELECT SUM(price) AS s FROM tickets WHERE order_id = ?').get(order.id).s
  const total = Math.round(base * (1 - discount))
  db.prepare('UPDATE orders SET total = ?, promo_code = ? WHERE id = ?').run(total, code, order.id)
  res.json(getOrderFull(order.id))
})

export default router
