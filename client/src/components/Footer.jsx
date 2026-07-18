import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <span className="footer-brand">
          <Logo small />
          <span>Kvytok</span>
        </span>
        <nav className="footer-nav">
          <Link to="/afisha">Афіша</Link>
          <Link to="/cinemas">Кінотеатрам</Link>
          <Link to="/support">Підтримка</Link>
          <Link to="/support">Умови</Link>
        </nav>
        <span className="footer-copy">© 2026 Kvytok</span>
      </div>
    </footer>
  )
}
