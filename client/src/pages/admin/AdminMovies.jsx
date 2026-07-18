import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api, adminHeaders } from '../../api.js'
import { formatDuration } from '../../utils.js'

const EMPTY = {
  title: '', description: '', genre: '', age_rating: '0+',
  duration_min: '', rating: '', votes: '', formats: '2D', poster_style: 'warm'
}

export default function AdminMovies() {
  const { onUnauthorized } = useOutletContext()
  const [movies, setMovies] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')

  const load = () => api.get('/api/admin/movies', adminHeaders())
    .then(d => setMovies(d.movies))
    .catch(err => err.status === 401 && onUnauthorized())

  useEffect(() => { load() }, [])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const startEdit = (m) => {
    setEditId(m.id)
    setForm({
      title: m.title, description: m.description, genre: m.genre, age_rating: m.age_rating,
      duration_min: String(m.duration_min), rating: String(m.rating), votes: String(m.votes),
      formats: m.formats, poster_style: m.poster_style
    })
  }

  const reset = () => {
    setEditId(null)
    setForm(EMPTY)
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const body = {
      ...form,
      duration_min: Number(form.duration_min),
      rating: Number(form.rating) || 0,
      votes: Number(form.votes) || 0
    }
    try {
      if (editId) await api.put(`/api/admin/movies/${editId}`, body, adminHeaders())
      else await api.post('/api/admin/movies', body, adminHeaders())
      reset()
      load()
    } catch (err) {
      if (err.status === 401) return onUnauthorized()
      setError('Перевірте поля: назва, жанр і тривалість обов\'язкові')
    }
  }

  const remove = async (m) => {
    if (!confirm(`Видалити ${m.title} разом з сеансами?`)) return
    setError('')
    try {
      await api.del(`/api/admin/movies/${m.id}`, adminHeaders())
      load()
    } catch (err) {
      if (err.status === 401) return onUnauthorized()
      setError(err.data?.error === 'has_tickets' ? 'Неможливо видалити: на фільм продано квитки' : 'Не вдалося видалити')
    }
  }

  return (
    <>
      <form className="admin-form" onSubmit={submit}>
        <h2 className="admin-form-title">{editId ? 'Редагувати фільм' : 'Додати фільм'}</h2>
        <div className="admin-form-grid">
          <div className="field">
            <span className="field-label">Назва</span>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Жанр</span>
            <input className="input" value={form.genre} onChange={e => set('genre', e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Вікове обмеження</span>
            <input className="input" value={form.age_rating} onChange={e => set('age_rating', e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Тривалість, хв</span>
            <input className="input" inputMode="numeric" value={form.duration_min} onChange={e => set('duration_min', e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Рейтинг (0–10)</span>
            <input className="input" inputMode="decimal" value={form.rating} onChange={e => set('rating', e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Кількість оцінок</span>
            <input className="input" inputMode="numeric" value={form.votes} onChange={e => set('votes', e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Формати</span>
            <select className="input" value={form.formats} onChange={e => set('formats', e.target.value)}>
              <option value="2D">2D</option>
              <option value="2D,IMAX">2D,IMAX</option>
            </select>
          </div>
          <div className="field">
            <span className="field-label">Стиль постера</span>
            <select className="input" value={form.poster_style} onChange={e => set('poster_style', e.target.value)}>
              <option value="warm">Теплий</option>
              <option value="cool">Холодний</option>
            </select>
          </div>
        </div>
        <div className="field">
          <span className="field-label">Опис</span>
          <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        {error && <span className="error-text">{error}</span>}
        <div className="admin-form-actions">
          <button className="btn-primary" type="submit">{editId ? 'Зберегти' : 'Додати'}</button>
          {editId && <button className="btn-ghost" type="button" onClick={reset}>Скасувати</button>}
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Назва</th><th>Жанр</th><th>Вік</th><th>Тривалість</th><th>Рейтинг</th><th>Сеансів</th><th></th>
            </tr>
          </thead>
          <tbody>
            {movies.map(m => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>{m.genre}</td>
                <td>{m.age_rating}</td>
                <td>{formatDuration(m.duration_min)}</td>
                <td>★ {m.rating.toFixed(1)}</td>
                <td>{m.sessions_count}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="table-btn" onClick={() => startEdit(m)}>Редагувати</button>
                  <button className="table-btn danger" onClick={() => remove(m)}>Видалити</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
