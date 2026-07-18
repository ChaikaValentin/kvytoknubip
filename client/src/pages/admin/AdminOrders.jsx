import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api, adminHeaders } from '../../api.js'
import { sessionDateTime } from '../../utils.js'

export default function AdminOrders() {
  const { onUnauthorized } = useOutletContext()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/api/admin/orders', adminHeaders())
      .then(d => setOrders(d.orders))
      .catch(err => err.status === 401 && onUnauthorized())
  }, [])

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th><th>Статус</th><th>Фільм</th><th>Сеанс</th><th>Місця (ряд-місце)</th><th>Сума</th><th>Email</th><th>Створено</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td><span className={`status-tag ${o.status}`}>{o.status === 'paid' ? 'Оплачено' : 'Очікує'}</span></td>
              <td>{o.movie_title}</td>
              <td>{o.cinema_name} · {o.hall_name} · {sessionDateTime(o.starts_at)}</td>
              <td>{o.seats}</td>
              <td>{o.total} ₴{o.promo_code ? ` (${o.promo_code})` : ''}</td>
              <td>{o.email || '—'}</td>
              <td>{o.created_at.slice(0, 16).replace('T', ' ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <div className="empty-note" style={{ padding: 20 }}>Замовлень поки немає</div>}
    </div>
  )
}
