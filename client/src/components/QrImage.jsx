import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QrImage({ value, size = 132 }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let alive = true
    QRCode.toDataURL(value, { width: size * 2, margin: 1, color: { dark: '#1A1C1E', light: '#FFFFFF' } })
      .then(u => alive && setUrl(u))
    return () => { alive = false }
  }, [value, size])
  if (!url) return <div className="qr-placeholder" style={{ width: size, height: size }} />
  return <img src={url} width={size} height={size} alt="QR-код квитка" className="qr-img" />
}
