import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api, adminHeaders } from '../../api.js'
import { sessionDateTime } from '../../utils.js'

export default function AdminSessions() {
  const { onUnauthorized } = useOutletContext()
  const [sessions, setSessions] = useState([])
  const [movies, setMovies] = useState([])
  const [halls, setHalls] = useState([])
  const [filterMovie, setFilterMovie] = useState('')
  const [form, setForm] = useState({ movieId: '', hallId: '', startsAt: '', format: '2D', priceStandard: '190', priceComfort: '240' })
  const [error, setError] = useState('')

  const guard = err => {
    if (err.status === 401) onUnauthorized()
    return null
  }

  const loadSessions = (movieId = filterMovie) => {
    const q = movieId ? `?movieId=${movieId}` : ''
    return api.get(`/api/admin/sessions${q}`, adminHeaders())
      .then(d => setSessions(d.sessions))
      .catch(guard)
  }

  useEffect(() => {
    api.get('/api/admin/movies', adminHeaders()).then(d => setMovies(d.movies)).catch(guard)
    api.get('/api/admin/halls', adminHeaders()).then(d => setHalls(d.halls)).catch(guard)
    loadSessions()
  }, [])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/admin/sessions', {
        movieId: Number(form.movieId),
        hallId: Number(form.hallId),
        startsAt: form.startsAt,
        format: form.format,
        priceStandard: Number(form.priceStandard),
        priceComfort: Number(form.priceComfort)
      }, adminHeaders())
      setForm(f => ({ ...f, startsAt: '' }))
      loadSessions()
    } catch (err) {
      if (err.status === 401) return onUnauthorized()
      setError('Перевірте поля: фільм, зал, час і ціни обов\'язкові')
    }
  }

  const remove = async (s) => {
    if (!confirm(`Видалити сеанс ${s.movie_title} ${s.starts_at.replace('T', ' ')}?`)) return
    setError('')
    try {
      await api.del(`/api/admin/sessions/${s.id}`, adminHeaders())
      loadSessions()
    } catch (err) {
      if (err.status === 401) return onUnauthorized()
      setError(err.data?.error === 'has_tickets' ? 'Неможливо видалити: на сеанс продано квитки' : 'Не вдалося видалити')
    }
  }

  return (
    <>
      <form className="admin-form" onSubmit={submit}>
        <h2 className="admin-form-title">Додати сеанс</h2>
        <div className="admin-form-grid">
          <div className="field">
            <span className="field-label">Фільм</span>
            <select className="input" value={form.movieId} onChange={e => set('movieId', e.target.value)}>
              <option value="">Оберіть фільм</option>
              {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Зал</span>
            <select className="input" value={form.hallId} onChange={e => set('hallId', e.target.value)}>
              <option value="">Оберіть зал</option>
              {halls.map(h => <option key={h.id} value={h.id}>{h.cinema_name} · {h.name}</option>)}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Дата й час</span>
            <input className="input" type="datetime-local" value={form.startsAt} onChange={e => set('startsAt', e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Формат</span>
            <select className="input" value={form.format} onChange={e => set('format', e.target.value)}>
              <option value="2D">2D</option>
              <option value="IMAX">IMAX</option>
            </select>
          </div>
          <div className="field">
            <span className="field-label">Ціна «Стандарт», ₴</span>
            <input className="input" inputMode="numeric" value={form.priceStandard} onChange={e => set('priceStandard', e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Ціна «Комфорт», ₴</span>
            <input className="input" inputMode="numeric" value={form.priceComfort} onChange={e => set('priceComfort', e.target.value)} />
          </div>
        </div>
        {error && <span className="error-text">{error}</span>}
        <div className="admin-form-actions">
          <button className="btn-primary" type="submit">Додати сеанс</button>
        </div>
      </form>

      <div className="field" style={{ maxWidth: 320 }}>
        <span className="field-label">Фільтр за фільмом</span>
        <select className="input" value={filterMovie} onChange={e => { setFilterMovie(e.target.value); loadSessions(e.target.value) }}>
          <option value="">Усі фільми</option>
          {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Фільм</th><th>Кінотеатр · Зал</th><th>Час</th><th>Формат</th><th>Ціни</th><th>Продано</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td>{s.movie_title}</td>
                <td>{s.cinema_name} · {s.hall_name}</td>
                <td>{sessionDateTime(s.starts_at)}</td>
                <td>{s.format}</td>
                <td>{s.price_standard} / {s.price_comfort} ₴</td>
                <td>{s.sold}</td>
                <td><button className="table-btn danger" onClick={() => remove(s)}>Видалити</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
