import { Router } from 'express'
import db from '../db.js'

const router = Router()

const ADMIN_KEY = process.env.ADMIN_KEY || 'admin'

router.post('/login', (req, res) => {
  if ((req.body?.key || '') === ADMIN_KEY) return res.json({ ok: true })
  res.status(401).json({ error: 'unauthorized' })
})

router.use((req, res, next) => {
  if (req.get('X-Admin-Key') === ADMIN_KEY) return next()
  res.status(401).json({ error: 'unauthorized' })
})

function movieFields(body) {
  const title = String(body?.title || '').trim()
  const genre = String(body?.genre || '').trim()
  const duration = Number(body?.duration_min)
  if (!title || !genre || !Number.isInteger(duration) || duration <= 0) return null
  return {
    title,
    genre,
    duration_min: duration,
    description: String(body?.description || ''),
    age_rating: String(body?.age_rating || '0+'),
    rating: Number(body?.rating) || 0,
    votes: Number(body?.votes) || 0,
    formats: String(body?.formats || '2D'),
    poster_style: body?.poster_style === 'cool' ? 'cool' : 'warm'
  }
}

router.get('/movies', (req, res) => {
  const movies = db.prepare(`
    SELECT m.*, COUNT(s.id) AS sessions_count
    FROM movies m LEFT JOIN sessions s ON s.movie_id = m.id
    GROUP BY m.id ORDER BY m.id DESC
  `).all()
  res.json({ movies })
})

router.post('/movies', (req, res) => {
  const fields = movieFields(req.body)
  if (!fields) return res.status(400).json({ error: 'bad_request' })
  const info = db.prepare('INSERT INTO movies (title, description, genre, age_rating, duration_min, rating, votes, formats, poster_style) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(fields.title, fields.description, fields.genre, fields.age_rating, fields.duration_min, fields.rating, fields.votes, fields.formats, fields.poster_style)
  res.status(201).json(db.prepare('SELECT * FROM movies WHERE id = ?').get(info.lastInsertRowid))
})

router.put('/movies/:id', (req, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id)
  if (!movie) return res.status(404).json({ error: 'not_found' })
  const fields = movieFields(req.body)
  if (!fields) return res.status(400).json({ error: 'bad_request' })
  db.prepare('UPDATE movies SET title=?, description=?, genre=?, age_rating=?, duration_min=?, rating=?, votes=?, formats=?, poster_style=? WHERE id=?')
    .run(fields.title, fields.description, fields.genre, fields.age_rating, fields.duration_min, fields.rating, fields.votes, fields.formats, fields.poster_style, movie.id)
  res.json(db.prepare('SELECT * FROM movies WHERE id = ?').get(movie.id))
})

router.delete('/movies/:id', (req, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id)
  if (!movie) return res.status(404).json({ error: 'not_found' })
  const sold = db.prepare(`
    SELECT COUNT(*) AS n FROM tickets t
    JOIN orders o ON o.id = t.order_id
    JOIN sessions s ON s.id = o.session_id
    WHERE s.movie_id = ? AND (o.status = 'paid' OR (o.status = 'pending' AND o.expires_at > datetime('now')))
  `).get(movie.id).n
  if (sold > 0) return res.status(409).json({ error: 'has_tickets' })
  db.transaction(() => {
    db.prepare('DELETE FROM tickets WHERE order_id IN (SELECT id FROM orders WHERE session_id IN (SELECT id FROM sessions WHERE movie_id = ?))').run(movie.id)
    db.prepare('DELETE FROM orders WHERE session_id IN (SELECT id FROM sessions WHERE movie_id = ?)').run(movie.id)
    db.prepare('DELETE FROM sessions WHERE movie_id = ?').run(movie.id)
    db.prepare('DELETE FROM movies WHERE id = ?').run(movie.id)
  })()
  res.json({ ok: true })
})

router.get('/halls', (req, res) => {
  const halls = db.prepare(`
    SELECT h.id, h.name, h.rows_count, h.seats_per_row, c.id AS cinema_id, c.name AS cinema_name
    FROM halls h JOIN cinemas c ON c.id = h.cinema_id
    ORDER BY c.id, h.name
  `).all()
  res.json({ halls })
})

router.get('/sessions', (req, res) => {
  const movieId = req.query.movieId
  const params = []
  let where = ''
  if (movieId) {
    where = 'WHERE s.movie_id = ?'
    params.push(movieId)
  }
  const sessions = db.prepare(`
    SELECT s.*, m.title AS movie_title, h.name AS hall_name, c.name AS cinema_name,
           (SELECT COUNT(*) FROM tickets t JOIN orders o ON o.id = t.order_id
            WHERE o.session_id = s.id AND (o.status = 'paid' OR (o.status = 'pending' AND o.expires_at > datetime('now')))) AS sold
    FROM sessions s
    JOIN movies m ON m.id = s.movie_id
    JOIN halls h ON h.id = s.hall_id
    JOIN cinemas c ON c.id = h.cinema_id
    ${where}
    ORDER BY s.starts_at DESC
    LIMIT 300
  `).all(...params)
  res.json({ sessions })
})

router.post('/sessions', (req, res) => {
  const { movieId, hallId, startsAt, format, priceStandard, priceComfort } = req.body ?? {}
  if (!db.prepare('SELECT id FROM movies WHERE id = ?').get(movieId)) return res.status(400).json({ error: 'bad_movie' })
  if (!db.prepare('SELECT id FROM halls WHERE id = ?').get(hallId)) return res.status(400).json({ error: 'bad_hall' })
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt || '')) return res.status(400).json({ error: 'bad_time' })
  const standard = Number(priceStandard)
  const comfort = Number(priceComfort)
  if (!Number.isInteger(standard) || standard <= 0 || !Number.isInteger(comfort) || comfort <= 0) return res.status(400).json({ error: 'bad_price' })
  const info = db.prepare('INSERT INTO sessions (movie_id, hall_id, starts_at, format, price_standard, price_comfort) VALUES (?,?,?,?,?,?)')
    .run(movieId, hallId, startsAt, format === 'IMAX' ? 'IMAX' : '2D', standard, comfort)
  res.status(201).json(db.prepare('SELECT * FROM sessions WHERE id = ?').get(info.lastInsertRowid))
})

router.delete('/sessions/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id)
  if (!session) return res.status(404).json({ error: 'not_found' })
  const sold = db.prepare(`
    SELECT COUNT(*) AS n FROM tickets t JOIN orders o ON o.id = t.order_id
    WHERE o.session_id = ? AND (o.status = 'paid' OR (o.status = 'pending' AND o.expires_at > datetime('now')))
  `).get(session.id).n
  if (sold > 0) return res.status(409).json({ error: 'has_tickets' })
  db.transaction(() => {
    db.prepare('DELETE FROM tickets WHERE order_id IN (SELECT id FROM orders WHERE session_id = ?)').run(session.id)
    db.prepare('DELETE FROM orders WHERE session_id = ?').run(session.id)
    db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id)
  })()
  res.json({ ok: true })
})

router.get('/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT o.id, o.status, o.email, o.phone, o.total, o.promo_code, o.created_at,
           s.starts_at, m.title AS movie_title, c.name AS cinema_name, h.name AS hall_name,
           (SELECT GROUP_CONCAT(t.row || '-' || t.seat, ', ') FROM tickets t WHERE t.order_id = o.id) AS seats
    FROM orders o
    JOIN sessions s ON s.id = o.session_id
    JOIN movies m ON m.id = s.movie_id
    JOIN halls h ON h.id = s.hall_id
    JOIN cinemas c ON c.id = h.cinema_id
    ORDER BY o.id DESC
    LIMIT 200
  `).all()
  res.json({ orders })
})

export default router
