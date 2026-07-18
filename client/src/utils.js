const WEEKDAYS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export function todayIso() {
  return toIsoDate(new Date())
}

export function toIsoDate(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function nextDates(count) {
  const dates = []
  const base = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    dates.push(toIsoDate(d))
  }
  return dates
}

export function dateLabel(iso) {
  const short = `${iso.slice(8, 10)}.${iso.slice(5, 7)}`
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  if (iso === toIsoDate(today)) return `Сьогодні, ${short}`
  if (iso === toIsoDate(tomorrow)) return `Завтра, ${short}`
  const d = new Date(iso + 'T12:00')
  return `${WEEKDAYS[d.getDay()]}, ${short}`
}

export function dateLabelShort(iso) {
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  if (iso === toIsoDate(today)) return 'Сьогодні'
  if (iso === toIsoDate(tomorrow)) return 'Завтра'
  return dateLabel(iso)
}

export function formatDuration(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h} год ${String(m).padStart(2, '0')} хв`
}

export function movieMeta(m) {
  return `${m.genre} · ${m.age_rating} · ${formatDuration(m.duration_min)}`
}

export function ticketsWord(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'квиток'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'квитки'
  return 'квитків'
}

export function sessionDateTime(startsAt) {
  return `${dateLabel(startsAt.slice(0, 10))} · ${startsAt.slice(11, 16)}`
}

export function seatTypeLabel(type) {
  return type === 'comfort' ? 'Комфорт' : 'Стандарт'
}

export const POSTER_STYLES = {
  warm: 'repeating-linear-gradient(135deg,#EDE8DD 0 12px,#F6F2E9 12px 24px)',
  cool: 'repeating-linear-gradient(135deg,#E3E9F2 0 12px,#EFF3F9 12px 24px)'
}

export function posterBg(style) {
  return POSTER_STYLES[style] || POSTER_STYLES.warm
}
