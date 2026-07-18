import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo.jsx'

const STEPS = ['Сеанс', 'Місця', 'Оплата']

export default function CheckoutHeader({ step }) {
  const navigate = useNavigate()
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand">
          <Logo />
          <span className="brand-name">Kvytok</span>
        </Link>
        <div className="stepper">
          {STEPS.map((label, i) => {
            const n = i + 1
            const state = n < step ? 'done' : n === step ? 'current' : 'next'
            return (
              <span key={label} className="stepper-item" data-state={state}>
                {i > 0 && <span className="stepper-line" />}
                <span className={`step ${state}`}>
                  <span className="step-circle">{state === 'done' ? '✓' : n}</span>
                  {label}
                </span>
              </span>
            )
          })}
        </div>
        <button className="back-btn" onClick={() => navigate(-1)}>← Назад</button>
      </div>
    </header>
  )
}
