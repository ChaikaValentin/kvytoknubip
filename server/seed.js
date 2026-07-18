import { randomUUID } from 'node:crypto'
import db from './db.js'
import { localIso, addDays } from './util.js'

const movies = [
  {
    title: '«Планета 9»',
    description: 'Експедиція «Аврора-9» ловить сигнал із загадкової дев\'ятої планети. Команда має вирішити, чи відповідати — і чим ця відповідь обернеться для Землі. Український дубляж.',
    genre: 'Фантастика', age_rating: '12+', duration_min: 134, rating: 8.7, votes: 1284,
    formats: '2D,IMAX', poster_style: 'cool', times: ['14:30', '17:50', '22:00']
  },
  {
    title: '«Північ над Дніпром»',
    description: 'Історія родини з Києва, яка після довгої розлуки збирається разом на березі Дніпра, щоб нарешті сказати одне одному головне.',
    genre: 'Драма', age_rating: '12+', duration_min: 126, rating: 8.4, votes: 862,
    formats: '2D', poster_style: 'warm', times: ['12:40', '15:10', '19:30']
  },
  {
    title: '«Швидше за вітер»',
    description: 'Юна велогонщиця з маленького міста готується до національного чемпіонату всупереч усім обставинам.',
    genre: 'Спорт', age_rating: '6+', duration_min: 122, rating: 8.2, votes: 776,
    formats: '2D', poster_style: 'cool', times: ['13:40', '18:30']
  },
  {
    title: '«Літо в Карпатах»',
    description: 'Міська сім\'я їде у відпустку в гори без інтернету — і знаходить там значно більше, ніж планувала.',
    genre: 'Комедія', age_rating: '0+', duration_min: 98, rating: 8.1, votes: 511,
    formats: '2D', poster_style: 'warm', times: ['11:00', '16:20', '20:10']
  },
  {
    title: '«Опівнічний експрес»',
    description: 'Нічний потяг Київ — Одеса, зникнення пасажира і сім підозрюваних у сусідньому вагоні. До ранку правду знатимуть усі.',
    genre: 'Трилер', age_rating: '16+', duration_min: 112, rating: 7.9, votes: 640,
    formats: '2D', poster_style: 'cool', times: ['13:20', '18:00', '21:45']
  },
  {
    title: '«Пісня для двох»',
    description: 'Вулична музикантка та звукорежисер випадково записують разом одну пісню, яка змінює життя обох.',
    genre: 'Мелодрама', age_rating: '12+', duration_min: 104, rating: 7.8, votes: 388,
    formats: '2D', poster_style: 'cool', times: ['11:30', '16:00', '19:10']
  },
  {
    title: '«Тіні старого міста»',
    description: 'Слідча повертається до рідного Львова, де стара нерозкрита справа знову нагадує про себе.',
    genre: 'Детектив', age_rating: '16+', duration_min: 118, rating: 7.6, votes: 402,
    formats: '2D', poster_style: 'warm', times: ['12:10', '17:20', '20:40']
  },
  {
    title: '«Нічна зміна»',
    description: 'Охоронець заступає на першу нічну зміну в старому універмазі й розуміє, що після опівночі він тут не сам.',
    genre: 'Жахи', age_rating: '18+', duration_min: 96, rating: 7.1, votes: 293,
    formats: '2D', poster_style: 'warm', times: ['21:00', '23:15']
  }
]

const cinemas = [
  { name: '«Орбіта»', address: 'вул. Хрещатик, 22', distance_km: 1.2, price: 190, halls: ['Зал 1', 'Зал 2', 'Зал 3'] },
  { name: '«Люмʼєр»', address: 'просп. Перемоги, 8', distance_km: 2.8, price: 170, halls: ['Зал 1', 'Зал 2'] },
  { name: '«Аврора»', address: 'вул. Соборна, 5', distance_km: 4.1, price: 180, halls: ['Зал 1'] }
]

const DAYS = 7
const ROWS = 9
const SEATS = 14
const COMFORT_ROWS = [8, 9]

db.exec('DELETE FROM tickets; DELETE FROM orders; DELETE FROM sessions; DELETE FROM halls; DELETE FROM cinemas; DELETE FROM movies;')
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('tickets','orders','sessions','halls','cinemas','movies')")

const insertMovie = db.prepare('INSERT INTO movies (title, description, genre, age_rating, duration_min, rating, votes, formats, poster_style) VALUES (?,?,?,?,?,?,?,?,?)')
const insertCinema = db.prepare('INSERT INTO cinemas (name, address, distance_km) VALUES (?,?,?)')
const insertHall = db.prepare('INSERT INTO halls (cinema_id, name, rows_count, seats_per_row, comfort_rows) VALUES (?,?,?,?,?)')
const insertSession = db.prepare('INSERT INTO sessions (movie_id, hall_id, starts_at, format, price_standard, price_comfort) VALUES (?,?,?,?,?,?)')
const insertOrder = db.prepare("INSERT INTO orders (session_id, email, phone, status, total, created_at, expires_at) VALUES (?,?,?,'paid',?,datetime('now'),datetime('now'))")
const insertTicket = db.prepare('INSERT INTO tickets (order_id, row, seat, seat_type, price, code) VALUES (?,?,?,?,?,?)')

const seedAll = db.transaction(() => {
  const movieIds = movies.map(m => insertMovie.run(m.title, m.description, m.genre, m.age_rating, m.duration_min, m.rating, m.votes, m.formats, m.poster_style).lastInsertRowid)

  const cinemaData = cinemas.map(c => {
    const cinemaId = insertCinema.run(c.name, c.address, c.distance_km).lastInsertRowid
    const hallIds = c.halls.map(h => insertHall.run(cinemaId, h, ROWS, SEATS, JSON.stringify(COMFORT_ROWS)).lastInsertRowid)
    return { ...c, id: cinemaId, hallIds }
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let sessionCount = 0
  for (let day = 0; day < DAYS; day++) {
    const date = localIso(addDays(today, day)).slice(0, 10)
    movies.forEach((m, mi) => {
      m.times.forEach((time, ti) => {
        const cinema = cinemaData[(mi + ti) % cinemaData.length]
        const hallId = cinema.hallIds[(mi + day) % cinema.hallIds.length]
        const sessionId = insertSession.run(movieIds[mi], hallId, `${date}T${time}`, '2D', cinema.price, cinema.price + 50).lastInsertRowid
        presell(sessionId)
        sessionCount++
      })
      if (m.formats.includes('IMAX')) {
        const orbit = cinemaData[0]
        const sessionId = insertSession.run(movieIds[mi], orbit.hallIds[2], `${date}T19:30`, 'IMAX', 280, 330).lastInsertRowid
        presell(sessionId)
        sessionCount++
      }
    })
  }
  return sessionCount
})

function presell(sessionId) {
  const session = db.prepare('SELECT s.price_standard, s.price_comfort, h.comfort_rows FROM sessions s JOIN halls h ON h.id = s.hall_id WHERE s.id = ?').get(sessionId)
  const comfortRows = JSON.parse(session.comfort_rows)
  const seats = []
  for (let r = 1; r <= ROWS; r++) {
    for (let c = 1; c <= SEATS; c++) {
      if ((r * 11 + c * 5 + sessionId * 3) % 6 === 0) seats.push({ r, c })
    }
  }
  if (!seats.length) return
  const priced = seats.map(({ r, c }) => ({
    r, c,
    type: comfortRows.includes(r) ? 'comfort' : 'standard',
    price: comfortRows.includes(r) ? session.price_comfort : session.price_standard
  }))
  const total = priced.reduce((a, s) => a + s.price, 0)
  const orderId = insertOrder.run(sessionId, 'demo@kvytok.ua', '+380440000000', total).lastInsertRowid
  for (const s of priced) insertTicket.run(orderId, s.r, s.c, s.type, s.price, randomUUID())
}

const count = seedAll()
console.log(`Seed завершено: ${movies.length} фільмів, ${cinemas.length} кінотеатри, ${count} сеансів на ${DAYS} днів`)
