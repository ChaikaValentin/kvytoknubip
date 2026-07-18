import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import SeatMap from '../components/SeatMap.jsx'
import { ticketsWord } from '../utils.js'

const DEMO_ROWS = 6
const DEMO_SEATS = 12
const DEMO_PRICE = 190

const FEATURES = [
  { title: 'Оплата за 10 секунд', text: 'Apple Pay, Google Pay або картка. Квиток одразу в телефоні.' },
  { title: 'Повернення в один дотик', text: 'Плани змінились? Гроші автоматично повернуться на картку.' },
  { title: 'Нагадування про сеанс', text: 'Підкажемо, коли виходити, щоб встигнути на трейлери.' },
  { title: 'Разом дешевше', text: 'Знижки на сімейні квитки та ранкові сеанси.' }
]

const TRUSTED = ['ЛЮМʼЄР', 'ОРБІТА', 'КІНОКРАЙ', 'АВРОРА', 'СУЗІРʼЯ']

export default function Landing() {
  const navigate = useNavigate()
  const occupied = useMemo(() => {
    const set = new Set()
    for (let r = 1; r <= DEMO_ROWS; r++) {
      for (let s = 1; s <= DEMO_SEATS; s++) {
        if (((r - 1) * 13 + (s - 1) * 7) % 5 === 0) set.add(`${r}:${s}`)
      }
    }
    return set
  }, [])
  const [selected, setSelected] = useState(() => new Set(['4:6', '4:7']))

  const toggle = (r, s) => {
    const key = `${r}:${s}`
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const count = selected.size
  const label = count
    ? [...selected].map(k => k.split(':')).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([r, s]) => `${r}-${s}`).join(', ')
    : 'Оберіть місця на схемі'

  return (
    <>
      <Header />
      <main>
        <section className="shell hero">
          <div className="hero-copy">
            <h1 className="hero-title">Обери місце.<br />Решту зробимо ми.</h1>
            <p className="hero-sub">Kvytok показує живу схему залу для кожного сеансу: обирай крісла, плати карткою — квиток одразу в телефоні.</p>
            <div className="hero-actions">
              <button className="hero-cta" onClick={() => navigate('/afisha')}>Обрати сеанс</button>
              <button className="hero-link" onClick={() => navigate('/afisha')}>Дивитись афішу →</button>
            </div>
            <div className="hero-perks">
              <span>Apple Pay та Google Pay</span>
              <span className="perk-dot">•</span>
              <span>Повернення в один дотик</span>
              <span className="perk-dot">•</span>
              <span>Без комісії</span>
            </div>
          </div>

          <div className="hero-widget">
            <div className="hero-widget-head">
              <div className="hero-widget-title">
                <span className="hero-widget-film">«Планета 9» · 19:30</span>
                <span className="hero-widget-place">Зал 3 · Кінотеатр «Орбіта»</span>
              </div>
              <span className="format-badge">2D</span>
            </div>
            <SeatMap
              rowsCount={DEMO_ROWS}
              seatsPerRow={DEMO_SEATS}
              occupied={occupied}
              selected={selected}
              onToggle={toggle}
              small
            />
            <div className="seat-legend">
              <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--seat-standard)' }} />Вільно</span>
              <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--seat-taken)' }} />Зайнято</span>
              <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--primary)' }} />Обрано</span>
            </div>
            <div className="hero-widget-foot">
              <div className="hero-widget-total">
                <span className="hero-widget-sum">{count} {ticketsWord(count)} · {count * DEMO_PRICE} ₴</span>
                <span className="hero-widget-sel">{label}</span>
              </div>
              <button className="hero-widget-btn" onClick={() => navigate('/afisha')}>Продовжити</button>
            </div>
          </div>
        </section>

        <section className="shell features">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <span className="feature-title">{f.title}</span>
              <span className="feature-text">{f.text}</span>
            </div>
          ))}
        </section>

        <section className="shell trusted">
          <span className="trusted-label">НАМ ДОВІРЯЮТЬ КІНОТЕАТРИ ПО ВСІЙ УКРАЇНІ</span>
          <div className="trusted-logos">
            {TRUSTED.map(name => <span key={name} className="trusted-logo">{name}</span>)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
