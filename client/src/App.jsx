import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Landing from './pages/Landing.jsx'
import Afisha from './pages/Afisha.jsx'
import Movie from './pages/Movie.jsx'
import Seats from './pages/Seats.jsx'
import Checkout from './pages/Checkout.jsx'
import Success from './pages/Success.jsx'
import Tickets from './pages/Tickets.jsx'
import Cinemas from './pages/Cinemas.jsx'
import Support from './pages/Support.jsx'
import Admin from './pages/admin/Admin.jsx'
import AdminMovies from './pages/admin/AdminMovies.jsx'
import AdminSessions from './pages/admin/AdminSessions.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/afisha" element={<Afisha />} />
        <Route path="/movies/:id" element={<Movie />} />
        <Route path="/sessions/:id" element={<Seats />} />
        <Route path="/checkout/:orderId" element={<Checkout />} />
        <Route path="/orders/:id/success" element={<Success />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/cinemas" element={<Cinemas />} />
        <Route path="/support" element={<Support />} />
        <Route path="/admin" element={<Admin />}>
          <Route index element={<Navigate to="movies" replace />} />
          <Route path="movies" element={<AdminMovies />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
