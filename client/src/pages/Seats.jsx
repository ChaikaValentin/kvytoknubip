import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CheckoutHeader from '../components/CheckoutHeader.jsx'
import SeatMap from '../components/SeatMap.jsx'
import { api } from '../api.js'
import { sessionDateTime, seatTypeLabel } from '../utils.js'

export default function Seats() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => api.get(`/api/sessions/${id}`).then(setSession).catch(() => setError('Сеанс не знайдено'))

  useEffect(() => { load() }, [id])

  const occupied = useMemo(
    () => new Set((session?.occupied || []).map(o => `${o.row}:${o.seat}`)),
    [session]
  )

  const toggle = (r, s) => {
    const key = `${r}:${s}`
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setError('')
  }

  if (!session) {
    return (
      <>
        <CheckoutHeader step={2} />
        <main><div className="shell">{error && <div className="empty-note">{error}</div>}</div></main>
      </>
    )
  }

  const items = [...selected]
    .map(k => k.split(':').map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([row, seat]) => {
      const comfort = session.comfort_rows.includes(row)
      return { row, seat, type: comfort ? 'comfort' : 'standard', price: comfort ? session.price_comfort : session.price_standard }
    })
  const total = items.reduce((sum, i) => sum + i.price, 0)

  const checkout = async () => {
    setSubmitting(true)
    setError('')
    try {
      const order = await api.post('/api/orders', {
        sessionId: session.id,
        seats: items.map(i => ({ row: i.row, seat: i.seat }))
      })
      navigate(`/checkout/${order.id}`)
    } catch (err) {
      if (err.data?.error === 'seats_taken') {
        setError('Дехто щойно викупив частину обраних місць. Оновили схему — оберіть інші.')
        setSelected(new Set())
        load()
      } else {
        setError('Не вдалося створити замовлення. Спробуйте ще раз.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <CheckoutHeader step={2} />
      <main>
        <div className="shell seats-layout">
          <div className="seats-main">
            <div className="seats-title-row">
              <h1 className="seats-title">{session.movie_title}</h1>
              <span className="seats-sub">
                Кінотеатр {session.cinema_name} · {session.hall_name} · {sessionDateTime(session.starts_at)} · {session.format}
              </span>
            </div>
            <div className="hall-card">
              <SeatMap
                rowsCount={session.rows_count}
                seatsPerRow={session.seats_per_row}
                comfortRows={session.comfort_rows}
                occupied={occupied}
                selected={selected}
                onToggle={toggle}
                showRowNums
              />
              <div className="seat-legend">
                <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--seat-standard)' }} />Стандарт · {session.price_standard} ₴</span>
                <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--seat-comfort)' }} />Комфорт · {session.price_comfort} ₴</span>
                <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--seat-taken)' }} />Зайнято</span>
                <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--primary)' }} />Обрано</span>
              </div>
            </div>
          </div>

          <div className="cart">
            <span className="cart-title">Ваш вибір</span>
            {items.length === 0 && <span className="empty-note">Оберіть місця на схемі залу</span>}
            {items.length > 0 && (
              <div className="cart-items">
                {items.map(i => (
                  <div key={`${i.row}:${i.seat}`} className="cart-item">
                    <div className="cart-item-info">
                      <span className="cart-item-seat">Ряд {i.row} · Місце {i.seat}</span>
                      <span className="cart-item-type">{seatTypeLabel(i.type)}</span>
                    </div>
                    <div className="cart-item-right">
                      <span className="cart-item-price">{i.price} ₴</span>
                      <button className="cart-remove" onClick={() => toggle(i.row, i.seat)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {error && <span className="error-text">{error}</span>}
            <div className="cart-total">
              <span className="cart-total-label">Разом</span>
              <span className="cart-total-sum">{total} ₴</span>
            </div>
            <button className="btn-primary lg" disabled={items.length === 0 || submitting} onClick={checkout}>
              {submitting ? 'Бронюємо…' : 'Перейти до оплати'}
            </button>
            <span className="cart-note">Бронь діє 10 хвилин</span>
          </div>
        </div>
      </main>
    </>
  )
}
