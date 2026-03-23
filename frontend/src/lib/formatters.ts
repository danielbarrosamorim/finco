const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
})

export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(year, month - 1)
  const formatted = monthFormatter.format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function addMonths(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(year, month - 1 + delta)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
