import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { api } from '../api.js'

export default function Cinemas() {
  const [cinemas, setCinemas] = useState([])

  useEffect(() => {
    api.get('/api/cinemas').then(d => setCinemas(d.cinemas))
  }, [])

  return (
    <>
      <Header />
      <main>
        <div className="shell cinemas-page">
          <h1 className="page-title">Кінотеатри</h1>
          <div className="cinemas-grid">
            {cinemas.map(c => (
              <div key={c.id} className="page-card">
                <div className="cinema-name-block">
                  <span className="cinema-name">{c.name}</span>
                  <span className="cinema-address">{c.address} · {String(c.distance_km).replace('.', ',')} км від центру</span>
                  <span className="cinema-address">Залів: {c.halls_count}</span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <Link to="/afisha" className="btn-ghost">Дивитися афішу</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
