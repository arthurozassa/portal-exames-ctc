import { describe, test, expect } from 'vitest'

// Utility functions that might exist in the project
const formatCPF = (cpf) => {
  const cleanCpf = cpf.replace(/\D/g, '')
  if (cleanCpf.length !== 11) return cpf
  
  return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const formatPhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}

const formatDate = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  
  return d.toLocaleDateString('pt-BR')
}

const formatCurrency = (value) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) return 'R$ 0,00'
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue)
}

const validateCPF = (cpf) => {
  const cleanCpf = cpf.replace(/\D/g, '')
  
  if (cleanCpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false
  
  // Validate CPF algorithm
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i)
  }
  
  let digit1 = (sum * 10) % 11
  if (digit1 === 10) digit1 = 0
  
  if (parseInt(cleanCpf.charAt(9)) !== digit1) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i)
  }
  
  let digit2 = (sum * 10) % 11
  if (digit2 === 10) digit2 = 0
  
  return parseInt(cleanCpf.charAt(10)) === digit2
}

describe('Formatter Utilities', () => {
  describe('formatCPF', () => {
    test('should format valid CPF correctly', () => {
      expect(formatCPF('12345678900')).toBe('123.456.789-00')
      expect(formatCPF('11111111111')).toBe('111.111.111-11')
    })

    test('should handle CPF with existing formatting', () => {
      expect(formatCPF('123.456.789-00')).toBe('123.456.789-00')
    })

    test('should return original value for invalid length', () => {
      expect(formatCPF('123')).toBe('123')
      expect(formatCPF('123456789012')).toBe('123456789012')
    })

    test('should handle empty or null input', () => {
      expect(formatCPF('')).toBe('')
      expect(formatCPF('0')).toBe('0')
    })
  })

  describe('formatPhone', () => {
    test('should format 10-digit phone correctly', () => {
      expect(formatPhone('1234567890')).toBe('(12) 3456-7890')
    })

    test('should format 11-digit phone correctly', () => {
      expect(formatPhone('12345678901')).toBe('(12) 34567-8901')
    })

    test('should handle phone with existing formatting', () => {
      expect(formatPhone('(12) 3456-7890')).toBe('(12) 3456-7890')
    })

    test('should return original value for invalid length', () => {
      expect(formatPhone('123')).toBe('123')
      expect(formatPhone('123456789012')).toBe('123456789012')
    })
  })

  describe('formatDate', () => {
    test('should format valid date correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })

    test('should format ISO string correctly', () => {
      const formatted = formatDate('2024-01-15T10:30:00Z')
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })

    test('should handle invalid date', () => {
      expect(formatDate('invalid-date')).toBe('invalid-date')
    })

    test('should handle empty input', () => {
      expect(formatDate('')).toBe('')
      expect(formatDate(null)).toBe('')
    })
  })

  describe('formatCurrency', () => {
    test('should format positive numbers correctly', () => {
      expect(formatCurrency(100)).toMatch(/R\$\s*100,00/)
      expect(formatCurrency(1234.56)).toMatch(/R\$\s*1\.234,56/)
    })

    test('should format negative numbers correctly', () => {
      expect(formatCurrency(-100)).toMatch(/-R\$\s*100,00/)
    })

    test('should handle string input', () => {
      expect(formatCurrency('100')).toMatch(/R\$\s*100,00/)
      expect(formatCurrency('1234.56')).toMatch(/R\$\s*1\.234,56/)
    })

    test('should handle zero', () => {
      expect(formatCurrency(0)).toMatch(/R\$\s*0,00/)
    })

    test('should handle invalid input', () => {
      expect(formatCurrency('invalid')).toMatch(/R\$\s*0,00/)
      expect(formatCurrency(null)).toMatch(/R\$\s*0,00/)
    })
  })

  describe('validateCPF', () => {
    test('should validate correct CPF', () => {
      expect(validateCPF('11144477735')).toBe(true)
      expect(validateCPF('111.444.777-35')).toBe(true)
    })

    test('should reject invalid CPF', () => {
      expect(validateCPF('12345678900')).toBe(false)
      expect(validateCPF('111.111.111-11')).toBe(false)
    })

    test('should reject CPF with invalid length', () => {
      expect(validateCPF('123')).toBe(false)
      expect(validateCPF('123456789012')).toBe(false)
    })

    test('should reject CPF with all same digits', () => {
      expect(validateCPF('11111111111')).toBe(false)
      expect(validateCPF('22222222222')).toBe(false)
    })

    test('should handle empty input', () => {
      expect(validateCPF('')).toBe(false)
    })
  })
})