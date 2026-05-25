import { validatePassword, PASSWORD_RULES } from '../utils/passwordValidator'

const LEVELS = [
  { label: 'Muy débil',  color: '#dc2626',  width: '16%' },
  { label: 'Débil',      color: '#f97316',  width: '33%' },
  { label: 'Media',      color: '#eab308',  width: '50%' },
  { label: 'Fuerte',     color: '#22c55e',  width: '66%' },
  { label: 'Muy fuerte', color: '#16a34a',  width: '83%' },
  { label: 'Excelente',  color: '#15803d',  width: '100%' },
]

function getStrength(pw, roleName) {
  const rule = PASSWORD_RULES[(roleName || 'cafetero').toLowerCase().trim()] || PASSWORD_RULES.cafetero
  let passed = 0
  if (pw.length >= rule.minLength) passed++
  if (rule.requireUppercase && /[A-Z]/.test(pw)) passed++
  if (rule.requireLowercase && /[a-z]/.test(pw)) passed++
  if (rule.requireDigit && /\d/.test(pw)) passed++
  if (rule.requireSpecial && /[^a-zA-Z0-9]/.test(pw)) passed++
  const required = 1 + [rule.requireUppercase, rule.requireLowercase, rule.requireDigit, rule.requireSpecial].filter(Boolean).length
  return Math.round((passed / required) * (LEVELS.length - 1))
}

export default function PasswordStrength({ password, role }) {
  const { errors, rule } = validatePassword(password || '', role)
  if (!password) return null

  const score = getStrength(password, role)
  const level = LEVELS[score]

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{
        height: 6, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: level.width, background: level.color,
          borderRadius: 4, transition: 'all 0.3s ease',
        }} />
      </div>
      <p style={{
        margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: level.color,
      }}>
        {level.label}
      </p>
      {errors.length > 0 && (
        <ul style={{ margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
          {errors.map((e, i) => (
            <li key={i} style={{ fontSize: 10, color: '#dc2626', lineHeight: 1.4 }}>✗ {e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
