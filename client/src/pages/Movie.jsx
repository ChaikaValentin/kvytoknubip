import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../api.js'
import { dateLabelShort, formatDuration, posterBg } from '../utils.js'

export default function Movie() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [date, setDate] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = date ? `?date=${date}` : ''
    api.get(`/api/movies/${id}${params}`)
      .then(d => { setData(d); setError('') })
      .catch(() => setError('Фільм не знайдено'))
  }, [id, date])

  if (error) {
    return (
      <>
        <Header />
        <main><div className="shell"><div className="empty-note">{error}</div></div></main>
        <Footer />
      </>
    )
  }
  if (!data) return <><Header /><main /><Footer /></>

  const { movie, cinemas, dates } = data
  const votesLabel = movie.votes.toLocaleString('uk-UA')

  return (
    <>
      <Header />
      <main>
        <div className="shell breadcrumb">
          <Link to="/afisha">Афіша</Link> / {movie.title}
        </div>

        <div className="shell movie-hero">
          <div className="movie-poster" style={{ background: posterBg(movie.poster_style) }}>
            <span className="poster-hint">постер фільму</span>
          </div>
          <div className="movie-info">
            <h1 className="movie-title">{movie.title}</h1>
            <div className="movie-badges">
              <span className="badge">{movie.genre}</span>
              <span className="badge">{movie.age_rating}</span>
              <span className="badge">{formatDuration(movie.duration_min)}</span>
              <span className="badge blue">{movie.formats.split(',').join(' · ')}</span>
            </div>
            <div className="movie-rating">
              <span className="rating-value">★ {movie.rating.toFixed(1)}</span>
              <span className="rating-votes">{votesLabel} оцінки</span>
            </div>
            <p className="movie-desc">{movie.description}</p>
            <div>
              <button className="btn-ghost" onClick={() => alert('Трейлер недоступний у демоверсії')}>▶ Дивитися трейлер</button>
            </div>
          </div>
        </div>

        <div className="shell sessions-block">
          <div className="sessions-head">
            <h2 className="section-title">Сеанси</h2>
            <div className="date-chips">
              {dates.map(d => (
                <button key={d} className={`chip sm${d === data.date ? ' active' : ''}`} onClick={() => setDate(d)}>
                  {dateLabelShort(d)}
                </button>
              ))}
            </div>
          </div>

          <div className="cinema-list">
            {cinemas.length === 0 && <div className="empty-note">На цю дату сеансів немає.</div>}
            {cinemas.map(c => (
              <div key={c.cinemaId} className="cinema-row">
                <div className="cinema-name-block">
                  <span className="cinema-name">{c.name}</span>
                  <span className="cinema-address">{c.address} · {String(c.distanceKm).replace('.', ',')} км</span>
                </div>
                <div className="session-chips">
                  {c.sessions.map(s => (
                    <button key={s.id} className="session-chip" onClick={() => navigate(`/sessions/${s.id}`)}>
                      <span className="t">{s.time}</span>
                      <span className="p">{s.format} · {s.price} ₴</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
