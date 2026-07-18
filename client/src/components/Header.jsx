import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="brand">
          <Logo />
          <span className="brand-name">Kvytok</span>
        </Link>
        <nav className="main-nav">
          <NavLink to="/afisha">Афіша</NavLink>
          <NavLink to="/cinemas">Кінотеатри</NavLink>
          <NavLink to="/support">Підтримка</NavLink>
        </nav>
        <Link to="/tickets" className="btn-primary">Мої квитки</Link>
      </div>
    </header>
  )
}
