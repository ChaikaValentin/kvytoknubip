import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const cinemas = db.prepare(`
    SELECT c.*, COUNT(h.id) AS halls_count
    FROM cinemas c LEFT JOIN halls h ON h.cinema_id = c.id
    GROUP BY c.id ORDER BY c.distance_km
  `).all()
  res.json({ cinemas })
})

export default router
