import { Link, useNavigate } from 'react-router-dom'
import { movieMeta, posterBg } from '../utils.js'

export default function FilmCard({ movie }) {
  const navigate = useNavigate()
  return (
    <div className="film-card">
      <Link to={`/movies/${movie.id}`} className="film-poster" style={{ background: posterBg(movie.poster_style) }}>
        <span className="poster-hint">постер фільму</span>
        <span className="rating-badge">★ {movie.rating.toFixed(1)}</span>
      </Link>
      <div className="film-card-text">
        <Link to={`/movies/${movie.id}`} className="film-title">{movie.title}</Link>
        <div className="film-meta">{movieMeta(movie)}</div>
      </div>
      <div className="film-times">
        {movie.times.map(t => (
          <button key={t.id} className="time-chip" onClick={() => navigate(`/sessions/${t.id}`)}>{t.time}</button>
        ))}
      </div>
    </div>
  )
}
