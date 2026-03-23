import { useState, useEffect } from 'react'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
  placeholder?: string
}

export function CurrencyInput({ value, onChange, className = '', placeholder }: CurrencyInputProps) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    if (value > 0) {
      setDisplay(formatBRL(value))
    }
  }, []) // only on mount

  function formatBRL(val: number): string {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function handleChange(raw: string) {
    // Keep only digits
    const digits = raw.replace(/\D/g, '')
    if (!digits) {
      setDisplay('')
      onChange(0)
      return
    }

    const cents = parseInt(digits, 10)
    const reais = cents / 100
    setDisplay(formatBRL(reais))
    onChange(reais)
  }

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? '0,00'}
        className={`w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-right text-lg font-medium text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white ${className}`}
      />
    </div>
  )
}
