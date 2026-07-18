import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import QrImage from '../components/QrImage.jsx'
import { api, getSavedOrderIds } from '../api.js'
import { seatTypeLabel, sessionDateTime } from '../utils.js'

export default function Tickets() {
  const [orders, setOrders] = useState([])
  const [email, setEmail] = useState('')
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids = getSavedOrderIds()
    if (!ids.length) {
      setLoading(false)
      return
    }
    api.get(`/api/tickets?ids=${ids.join(',')}`)
      .then(d => setOrders(d.orders))
      .finally(() => setLoading(false))
  }, [])

  const search = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const d = await api.get(`/api/tickets?email=${encodeURIComponent(email.trim())}`)
      setOrders(d.orders)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main>
        <div className="shell tickets-page">
          <h1 className="page-title">Мої квитки</h1>
          <form className="tickets-search" onSubmit={search}>
            <input className="input" type="email" placeholder="Email, вказаний при оплаті" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="btn-primary" type="submit">Знайти</button>
          </form>

          {!loading && orders.length === 0 && (
            <div className="empty-note">
              {searched
                ? 'За цим email квитків не знайдено.'
                : <>Тут з'являться ваші квитки після покупки. <Link to="/afisha" style={{ color: 'var(--primary)' }}>Обрати сеанс →</Link></>}
            </div>
          )}

          {orders.map(o => (
            <div key={o.id} className="order-card">
              <div className="order-head">
                <span className="order-film">{o.movie_title}</span>
                <span className="order-meta">{o.cinema_name} · {o.hall_name} · {sessionDateTime(o.starts_at)} · {o.format}</span>
              </div>
              <div className="ticket-list">
                {o.tickets.map(t => (
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
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
