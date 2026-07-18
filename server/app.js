import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import moviesRouter from './routes/movies.js'
import cinemasRouter from './routes/cinemas.js'
import sessionsRouter from './routes/sessions.js'
import ordersRouter from './routes/orders.js'
import ticketsRouter from './routes/tickets.js'
import adminRouter from './routes/admin.js'
import healthRouter from './routes/health.js'

const app = express()
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/movies', moviesRouter)
app.use('/api/cinemas', cinemasRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/tickets', ticketsRouter)
app.use('/api/admin', adminRouter)
app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }))

const dir = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(dir, '..', 'client', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'server_error' })
})

export default app
