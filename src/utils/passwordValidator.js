export const PASSWORD_RULES = {
  administrador: {
    minLength: 10,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecial: true,
    label: 'Administrador',
  },
  experto: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecial: false,
    label: 'Experto',
  },
  cafetero: {
    minLength: 6,
    requireUppercase: false,
    requireLowercase: false,
    requireDigit: false,
    requireSpecial: false,
    label: 'Cafetero',
  },
}

export function validatePassword(password, roleName) {
  const normalizedRole = (roleName || 'cafetero').toLowerCase().trim()
  const rule = PASSWORD_RULES[normalizedRole] || PASSWORD_RULES.cafetero
  const errors = []

  if (password.length < rule.minLength) {
    errors.push(`Mínimo ${rule.minLength} caracteres`)
  }
  if (rule.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Al menos una mayúscula')
  }
  if (rule.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Al menos una minúscula')
  }
  if (rule.requireDigit && !/\d/.test(password)) {
    errors.push('Al menos un número')
  }
  if (rule.requireSpecial && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Al menos un carácter especial')
  }

  return { isValid: errors.length === 0, errors, rule }
}
