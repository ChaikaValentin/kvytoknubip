import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Header from '../../components/Header.jsx'
import Footer from '../../components/Footer.jsx'
import { api, getAdminKey, setAdminKey } from '../../api.js'

export default function Admin() {
  const [authed, setAuthed] = useState(() => Boolean(getAdminKey()))
  const [key, setKey] = useState('')
  const [error, setError] = useState('')

  const login = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/admin/login', { key })
      setAdminKey(key)
      setAuthed(true)
    } catch {
      setError('Невірний ключ адміністратора')
    }
  }

  const logout = () => {
    setAdminKey('')
    setAuthed(false)
    setKey('')
  }

  if (!authed) {
    return (
      <>
        <Header />
        <main>
          <div className="shell">
            <form className="admin-login" onSubmit={login}>
              <h1 className="page-title">Адмінка</h1>
              <div className="field">
                <span className="field-label">Ключ адміністратора</span>
                <input className="input" type="password" value={key} onChange={e => setKey(e.target.value)} autoFocus />
              </div>
              {error && <span className="error-text">{error}</span>}
              <button className="btn-primary lg" type="submit">Увійти</button>
            </form>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main>
        <div className="shell admin-page">
          <div className="admin-head">
            <h1 className="page-title">Адмінка</h1>
            <div className="admin-tabs">
              <NavLink to="/admin/movies">Фільми</NavLink>
              <NavLink to="/admin/sessions">Сеанси</NavLink>
              <NavLink to="/admin/orders">Замовлення</NavLink>
              <button className="table-btn" onClick={logout}>Вийти</button>
            </div>
          </div>
          <Outlet context={{ onUnauthorized: logout }} />
        </div>
      </main>
      <Footer />
    </>
  )
}
