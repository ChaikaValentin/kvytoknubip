import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CheckoutHeader from '../components/CheckoutHeader.jsx'
import { api, saveOrderId } from '../api.js'
import { posterBg, sessionDateTime, ticketsWord } from '../utils.js'

const ERRORS = {
  bad_email: 'Перевірте email',
  bad_phone: 'Перевірте номер телефону',
  bad_card: 'Номер картки має містити 16 цифр',
  bad_expiry: 'Термін дії у форматі ММ/РР',
  bad_cvv: 'CVV має містити 3 цифри',
  expired: 'Бронь закінчилась. Оберіть місця ще раз.'
}

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`
}

export default function Checkout() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('+380 ')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [agreed, setAgreed] = useState(true)
  const [promo, setPromo] = useState('')
  const [promoMsg, setPromoMsg] = useState(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    api.get(`/api/orders/${orderId}`)
      .then(o => {
        if (o.status === 'paid') {
          navigate(`/orders/${o.id}/success`, { replace: true })
          return
        }
        setOrder(o)
        setSecondsLeft(Math.max(0, o.seconds_left))
      })
      .catch(() => setNotFound(true))
  }, [orderId])

  useEffect(() => {
    if (secondsLeft === null) return
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [secondsLeft !== null])

  if (notFound) {
    return (
      <>
        <CheckoutHeader step={3} />
        <main><div className="shell"><div className="empty-note">Замовлення не знайдено. <Link to="/afisha">До афіші</Link></div></div></main>
      </>
    )
  }
  if (!order) return <><CheckoutHeader step={3} /><main /></>

  const expired = secondsLeft === 0
  const mm = String(Math.floor((secondsLeft || 0) / 60)).padStart(2, '0')
  const ss = String((secondsLeft || 0) % 60).padStart(2, '0')
  const seatsLabel = order.tickets.map(t => `Ряд ${t.row} · ${t.seat}`).join(', ')
  const base = order.tickets.reduce((sum, t) => sum + t.price, 0)
  const n = order.tickets.length

  const pay = async (applePay) => {
    setError('')
    if (!agreed) {
      setError('Потрібно погодитись з умовами сервісу')
      return
    }
    setPaying(true)
    try {
      const paid = await api.post(`/api/orders/${order.id}/pay`, {
        email: email.trim(),
        phone: phone.trim(),
        applePay,
        card: applePay ? undefined : { number: cardNumber, expiry, cvv }
      })
      saveOrderId(paid.id)
      navigate(`/orders/${paid.id}/success`)
    } catch (err) {
      setError(ERRORS[err.data?.error] || 'Оплата не пройшла. Спробуйте ще раз.')
      setPaying(false)
    }
  }

  const applyPromo = async () => {
    if (!promo.trim()) return
    try {
      const updated = await api.post(`/api/orders/${order.id}/promo`, { code: promo })
      setOrder(prev => ({ ...prev, total: updated.total, promo_code: updated.promo_code }))
      setPromoMsg({ ok: true, text: `Промокод ${updated.promo_code} застосовано` })
    } catch (err) {
      setPromoMsg({ ok: false, text: err.data?.error === 'promo_already_applied' ? 'Промокод уже застосовано' : 'Промокод не знайдено' })
    }
  }

  return (
    <>
      <CheckoutHeader step={3} />
      <main>
        <div className="shell checkout-layout">
          <div className="checkout-main">
            <h1 className="checkout-title">Оплата</h1>

            <div className="checkout-card">
              <span className="checkout-card-title">Контакти для квитка</span>
              <div className="two-cols">
                <div className="field">
                  <span className="field-label">Email</span>
                  <input className="input" type="email" placeholder="name@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <span className="field-label">Телефон</span>
                  <input className="input" type="tel" placeholder="+380 __ ___ __ __" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="checkout-card">
              <span className="checkout-card-title">Спосіб оплати</span>
              <button className="applepay-btn" disabled={paying || expired} onClick={() => pay(true)}> Apple Pay</button>
              <div className="divider-row">
                <span className="divider-line" />
                <span className="divider-text">або карткою</span>
                <span className="divider-line" />
              </div>
              <div className="field">
                <span className="field-label">Номер картки</span>
                <input className="input mono" inputMode="numeric" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} />
              </div>
              <div className="two-cols">
                <div className="field">
                  <span className="field-label">Термін дії</span>
                  <input className="input mono" inputMode="numeric" placeholder="ММ / РР" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} />
                </div>
                <div className="field">
                  <span className="field-label">CVV</span>
                  <input className="input mono" type="password" inputMode="numeric" maxLength={3} placeholder="•••" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
              <div className="agree-row">
                <span className={`agree-check${agreed ? '' : ' off'}`} onClick={() => setAgreed(a => !a)}>✓</span>
                <span className="agree-text">Погоджуюсь з <span className="link">умовами сервісу</span> та <span className="link">політикою повернення</span></span>
              </div>
              {error && <span className="error-text">{error}</span>}
            </div>
          </div>

          <div className="summary">
            <div className="summary-film">
              <div className="summary-poster" style={{ background: posterBg(order.poster_style) }} />
              <div className="summary-film-info">
                <span className="summary-film-title">{order.movie_title}</span>
                <span className="summary-film-meta">{order.format} · Український дубляж</span>
              </div>
            </div>
            <div className="summary-rows">
              <div className="summary-row"><span className="k">Кінотеатр</span><span className="v">{order.cinema_name} · {order.hall_name}</span></div>
              <div className="summary-row"><span className="k">Дата й час</span><span className="v">{sessionDateTime(order.starts_at)}</span></div>
              <div className="summary-row"><span className="k">Місця</span><span className="v">{seatsLabel}</span></div>
            </div>
            <div className="summary-rows">
              <div className="summary-row"><span className="k">{n} {ticketsWord(n)}</span><span className="v">{base} ₴</span></div>
              <div className="summary-row"><span className="k">Сервісний збір</span><span className="v">0 ₴</span></div>
              {order.promo_code && (
                <div className="summary-row"><span className="k">Промокод {order.promo_code}</span><span className="v">−{base - order.total} ₴</span></div>
              )}
            </div>
            {!order.promo_code && (
              <div className="promo-row">
                <input className="promo-input" placeholder="Промокод" value={promo} onChange={e => setPromo(e.target.value)} />
                <button className="promo-apply" onClick={applyPromo}>Застосувати</button>
              </div>
            )}
            {promoMsg && <span className={promoMsg.ok ? 'cart-note' : 'error-text'}>{promoMsg.text}</span>}
            <div className="cart-total">
              <span className="cart-total-label">Разом</span>
              <span className="cart-total-sum">{order.total} ₴</span>
            </div>
            {expired
              ? <span className="hold-note expired">Бронь закінчилась. <Link to={`/sessions/${order.session_id}`} className="link">Обрати місця ще раз</Link></span>
              : <span className="hold-note">Місця заброньовано ще на {mm}:{ss}</span>}
            <button className="btn-primary lg" disabled={paying || expired} onClick={() => pay(false)}>
              {paying ? <><span className="spinner" />Обробка платежу…</> : `Оплатити ${order.total} ₴`}
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
