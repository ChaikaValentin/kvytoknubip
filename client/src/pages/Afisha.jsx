import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import FilmCard from '../components/FilmCard.jsx'
import { api } from '../api.js'
import { nextDates, dateLabel, todayIso } from '../utils.js'

export default function Afisha() {
  const [date, setDate] = useState(todayIso())
  const [genre, setGenre] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const dateInputRef = useRef(null)

  const quickDates = nextDates(5)

  useEffect(() => {
    const params = new URLSearchParams({ date })
    if (genre) params.set('genre', genre)
    api.get(`/api/movies?${params}`)
      .then(d => { setData(d); setError('') })
      .catch(() => setError('Не вдалося завантажити афішу'))
  }, [date, genre])

  return (
    <>
      <Header />
      <main>
        <div className="shell afisha-head">
          <div className="afisha-title-row">
            <h1 className="page-title">Афіша</h1>
            {data && <span className="afisha-stats">Київ · {data.stats.cinemas} кінотеатрів · {data.stats.movies} фільмів</span>}
          </div>
          <div className="date-chips">
            {quickDates.map(d => (
              <button key={d} className={`chip${d === date ? ' active' : ''}`} onClick={() => setDate(d)}>
                {dateLabel(d)}
              </button>
            ))}
            <button
              className={`chip date-input${!quickDates.includes(date) ? ' active' : ''}`}
              onClick={() => dateInputRef.current?.showPicker?.()}
            >
              {quickDates.includes(date) ? 'Обрати дату…' : dateLabel(date)}
              <input
                ref={dateInputRef}
                type="date"
                min={todayIso()}
                value={date}
                onChange={e => e.target.value && setDate(e.target.value)}
              />
            </button>
          </div>
          <div className="genre-row">
            <div className="genre-chips">
              <button className={`pill${genre === '' ? ' active' : ''}`} onClick={() => setGenre('')}>Усі жанри</button>
              {(data?.genres || []).map(g => (
                <button key={g} className={`pill${genre === g ? ' active' : ''}`} onClick={() => setGenre(g)}>{g}</button>
              ))}
            </div>
            <span className="sort-label">Сортувати: за рейтингом ↓</span>
          </div>
        </div>

        <div className="shell">
          {error && <div className="empty-note">{error}</div>}
          {data && data.movies.length === 0 && <div className="empty-note">На цю дату сеансів немає. Оберіть інший день.</div>}
          <div className="film-grid">
            {(data?.movies || []).map(m => <FilmCard key={m.id} movie={m} />)}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
