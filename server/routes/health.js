import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  try {
    const movies = db.prepare('SELECT COUNT(*) AS n FROM movies').get().n
    res.json({ status: 'ok', uptime: Math.round(process.uptime()), movies })
  } catch {
    res.status(503).json({ status: 'error' })
  }
})

export default router
