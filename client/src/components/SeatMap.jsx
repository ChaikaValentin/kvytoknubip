export default function SeatMap({ rowsCount, seatsPerRow, comfortRows = [], occupied, selected, onToggle, small = false, showRowNums = false }) {
  const rows = []
  for (let r = 1; r <= rowsCount; r++) {
    const seats = []
    for (let s = 1; s <= seatsPerRow; s++) {
      const key = `${r}:${s}`
      const isTaken = occupied.has(key)
      const isSelected = selected.has(key)
      const type = comfortRows.includes(r) ? 'comfort' : 'standard'
      const cls = isSelected ? 'selected' : isTaken ? 'taken' : type
      seats.push(
        <button
          key={key}
          type="button"
          className={`seat ${cls}${small ? ' sm' : ''}`}
          disabled={isTaken}
          onClick={() => onToggle && onToggle(r, s)}
          aria-label={`Ряд ${r}, місце ${s}`}
        />
      )
    }
    rows.push(
      <div key={r} className="seat-row">
        {showRowNums && <span className="row-num left">{r}</span>}
        <div className="seat-cells">{seats}</div>
        {showRowNums && <span className="row-num right">{r}</span>}
      </div>
    )
  }
  return (
    <>
      <div className="screen-bar" />
      <div className="screen-label">ЕКРАН</div>
      <div className="seat-grid">{rows}</div>
    </>
  )
}
