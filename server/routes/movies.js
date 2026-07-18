import { Router } from 'express'
import db from '../db.js'
import { localIso } from '../util.js'

const router = Router()

router.get('/', (req, res) => {
  const now = localIso()
  const date = req.query.date || now.slice(0, 10)
  const genre = req.query.genre
  const minStart = date === now.slice(0, 10) ? now : date + 'T00:00'
  const params = [date, minStart]
  let where = 'substr(s.starts_at, 1, 10) = ? AND s.starts_at >= ?'
  if (genre) {
    where += ' AND m.genre = ?'
    params.push(genre)
  }
  const movies = db.prepare(`SELECT DISTINCT m.* FROM movies m JOIN sessions s ON s.movie_id = m.id WHERE ${where} ORDER BY m.rating DESC`).all(...params)
  const timesStmt = db.prepare('SELECT s.id, substr(s.starts_at, 12, 5) AS time FROM sessions s WHERE s.movie_id = ? AND substr(s.starts_at, 1, 10) = ? AND s.starts_at >= ? ORDER BY s.starts_at LIMIT 3')
  const result = movies.map(m => ({ ...m, times: timesStmt.all(m.id, date, minStart) }))
  const genres = db.prepare('SELECT DISTINCT genre FROM movies ORDER BY genre').all().map(r => r.genre)
  const stats = {
    cinemas: db.prepare('SELECT COUNT(*) AS n FROM cinemas').get().n,
    movies: db.prepare('SELECT COUNT(*) AS n FROM movies').get().n
  }
  res.json({ date, movies: result, genres, stats })
})

router.get('/:id', (req, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id)
  if (!movie) return res.status(404).json({ error: 'not_found' })
  const now = localIso()
  const dates = db.prepare('SELECT DISTINCT substr(starts_at, 1, 10) AS d FROM sessions WHERE movie_id = ? AND starts_at >= ? ORDER BY d LIMIT 5').all(movie.id, now).map(r => r.d)
  const date = req.query.date || dates[0] || now.slice(0, 10)
  const minStart = date === now.slice(0, 10) ? now : date + 'T00:00'
  const rows = db.prepare(`
    SELECT s.id, s.starts_at, s.format, s.price_standard, h.name AS hall_name,
           c.id AS cinema_id, c.name AS cinema_name, c.address, c.distance_km
    FROM sessions s
    JOIN halls h ON h.id = s.hall_id
    JOIN cinemas c ON c.id = h.cinema_id
    WHERE s.movie_id = ? AND substr(s.starts_at, 1, 10) = ? AND s.starts_at >= ?
    ORDER BY c.id, s.starts_at
  `).all(movie.id, date, minStart)
  const cinemas = []
  for (const r of rows) {
    let group = cinemas.find(c => c.cinemaId === r.cinema_id)
    if (!group) {
      group = { cinemaId: r.cinema_id, name: r.cinema_name, address: r.address, distanceKm: r.distance_km, sessions: [] }
      cinemas.push(group)
    }
    group.sessions.push({ id: r.id, time: r.starts_at.slice(11, 16), format: r.format, price: r.price_standard })
  }
  res.json({ movie, dates, date, cinemas })
})

export default router
