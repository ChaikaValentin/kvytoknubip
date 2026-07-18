import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dbFile = path.join(os.tmpdir(), `kvytok-test-${process.pid}.db`)
let server
let base

before(async () => {
  process.env.KVYTOK_DB = dbFile
  process.env.ADMIN_KEY = 'admin'
  execFileSync(process.execPath, ['server/seed.js'], { cwd: root, env: process.env, stdio: 'ignore' })
  const { default: app } = await import('../server/app.js')
  await new Promise(resolve => { server = app.listen(0, resolve) })
  base = `http://localhost:${server.address().port}`
})

after(() => {
  server?.close()
  for (const f of [dbFile, `${dbFile}-wal`, `${dbFile}-shm`, `${dbFile}-journal`]) {
    fs.rmSync(f, { force: true })
  }
})

function get(p, opts) {
  return fetch(base + p, opts).then(async r => ({ status: r.status, body: await r.json().catch(() => ({})) }))
}

function post(p, body, headers) {
  return fetch(base + p, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  }).then(async r => ({ status: r.status, body: await r.json().catch(() => ({})) }))
}

async function pickSessionWithFreeSeats(minFree = 2) {
  const movies = (await get('/api/movies')).body.movies
  for (const m of movies) {
    const detail = (await get(`/api/movies/${m.id}`)).body
    for (const cinema of detail.cinemas || []) {
      for (const slot of cinema.sessions) {
        const session = (await get(`/api/sessions/${slot.id}`)).body
        const occupied = new Set(session.occupied.map(o => `${o.row}:${o.seat}`))
        const free = []
        for (let row = 1; row <= session.rows_count; row++) {
          for (let seat = 1; seat <= session.seats_per_row; seat++) {
            if (!occupied.has(`${row}:${seat}`)) free.push({ row, seat })
          }
        }
        if (free.length >= minFree) return { session, free }
      }
    }
  }
  throw new Error('no session with free seats found')
}

test('GET /api/movies returns seeded catalogue', async () => {
  const { status, body } = await get('/api/movies')
  assert.equal(status, 200)
  assert.ok(Array.isArray(body.movies))
  assert.ok(body.movies.length > 0)
  assert.ok(body.stats.movies > 0)
  assert.ok(body.stats.cinemas > 0)
})

test('GET /api/sessions/:id returns a seating layout', async () => {
  const { session } = await pickSessionWithFreeSeats()
  const { status, body } = await get(`/api/sessions/${session.id}`)
  assert.equal(status, 200)
  assert.ok(body.rows_count > 0)
  assert.ok(body.seats_per_row > 0)
  assert.ok(Array.isArray(body.occupied))
})

test('booking holds seats and rejects a double booking', async () => {
  const { session, free } = await pickSessionWithFreeSeats()
  const seats = free.slice(0, 2)

  const first = await post('/api/orders', { sessionId: session.id, seats })
  assert.equal(first.status, 201)
  assert.equal(first.body.status, 'pending')
  assert.equal(first.body.tickets.length, 2)

  const second = await post('/api/orders', { sessionId: session.id, seats })
  assert.equal(second.status, 409)
  assert.equal(second.body.error, 'seats_taken')
})

test('demo payment marks the order as paid', async () => {
  const { session, free } = await pickSessionWithFreeSeats()
  const seats = free.slice(0, 1)
  const order = (await post('/api/orders', { sessionId: session.id, seats })).body

  const paid = await post(`/api/orders/${order.id}/pay`, {
    email: 'test@kvytok.ua',
    phone: '+380671234567',
    card: { number: '4111111111111111', expiry: '12 / 30', cvv: '123' }
  })
  assert.equal(paid.status, 200)
  assert.equal(paid.body.status, 'paid')

  const tickets = await get('/api/tickets?email=test@kvytok.ua')
  assert.ok(tickets.body.orders.some(o => o.id === order.id))
})

test('invalid card is rejected', async () => {
  const { session, free } = await pickSessionWithFreeSeats()
  const order = (await post('/api/orders', { sessionId: session.id, seats: free.slice(0, 1) })).body
  const res = await post(`/api/orders/${order.id}/pay`, {
    email: 'test@kvytok.ua',
    phone: '+380671234567',
    card: { number: '1234', expiry: '12 / 30', cvv: '123' }
  })
  assert.equal(res.status, 400)
})

test('promo code reduces the order total', async () => {
  const { session, free } = await pickSessionWithFreeSeats()
  const order = (await post('/api/orders', { sessionId: session.id, seats: free.slice(0, 2) })).body
  const before = order.total
  const res = await post(`/api/orders/${order.id}/promo`, { code: 'KVYTOK10' })
  assert.equal(res.status, 200)
  assert.ok(res.body.total < before)
})

test('admin API requires the admin key', async () => {
  const denied = await get('/api/admin/movies')
  assert.equal(denied.status, 401)

  const allowed = await get('/api/admin/movies', { headers: { 'X-Admin-Key': 'admin' } })
  assert.equal(allowed.status, 200)
  assert.ok(Array.isArray(allowed.body.movies))
})
