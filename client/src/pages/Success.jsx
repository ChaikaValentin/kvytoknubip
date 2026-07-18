import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import QrImage from '../components/QrImage.jsx'
import { api } from '../api.js'
import { seatTypeLabel, sessionDateTime, ticketsWord } from '../utils.js'

export default function Success() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/api/orders/${id}`)
      .then(o => {
        if (o.status !== 'paid') setError('Замовлення ще не оплачено')
        else setOrder(o)
      })
      .catch(() => setError('Замовлення не знайдено'))
  }, [id])

  return (
    <>
      <Header />
      <main>
        <div className="shell success-page">
          {error && <div className="empty-note">{error}</div>}
          {order && (
            <>
              <div className="success-head">
                <span className="success-icon">✓</span>
                <h1 className="success-title">Оплату підтверджено</h1>
                <p className="success-sub">
                  {order.tickets.length} {ticketsWord(order.tickets.length)} на {order.movie_title} · {sessionDateTime(order.starts_at)}.
                  {order.email ? ` Копію надіслано на ${order.email}.` : ''}
                </p>
              </div>
              <div className="order-card">
                <div className="order-head">
                  <span className="order-film">{order.movie_title}</span>
                  <span className="order-meta">{order.cinema_name} · {order.hall_name} · {sessionDateTime(order.starts_at)} · {order.format}</span>
                </div>
                <div className="ticket-list">
                  {order.tickets.map(t => (
                    <div key={t.id} className="ticket-card">
                      <QrImage value={t.code} size={108} />
                      <div className="ticket-info">
                        <span className="ticket-seat">Ряд {t.row} · Місце {t.seat}</span>
                        <span className="ticket-type">{seatTypeLabel(t.seat_type)}</span>
                        <span className="ticket-price">{t.price} ₴</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="success-actions">
                <Link to="/tickets" className="btn-primary">Мої квитки</Link>
                <Link to="/afisha" className="btn-ghost">До афіші</Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
