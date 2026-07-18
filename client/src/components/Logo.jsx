export default function Logo({ small = false }) {
  return (
    <span className={small ? 'logo logo-sm' : 'logo'}>
      <span className="logo-play" />
      <span className="logo-dash" />
      <span className="logo-notch logo-notch-top" />
      <span className="logo-notch logo-notch-bottom" />
    </span>
  )
}
