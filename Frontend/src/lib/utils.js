export function makeId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function nowISO() {
  return new Date().toISOString()
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function truncateAddress(address, chars = 5) {
  if (!address) return ''
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`
}

// Returns true if the ISO date falls within the given range window, ending now.
export function withinRange(iso, range) {
  if (range === 'all') return true
  const now = new Date()
  const date = new Date(iso)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (range) {
    case 'today':
      return date >= startOfToday
    case 'week': {
      const day = now.getDay() === 0 ? 7 : now.getDay()
      const startOfWeek = new Date(startOfToday)
      startOfWeek.setDate(startOfToday.getDate() - (day - 1))
      return date >= startOfWeek
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return date >= startOfMonth
    }
    case 'last30': {
      const cutoff = new Date(now)
      cutoff.setDate(now.getDate() - 30)
      return date >= cutoff
    }
    case 'last90': {
      const cutoff = new Date(now)
      cutoff.setDate(now.getDate() - 90)
      return date >= cutoff
    }
    default:
      return true
  }
}


export function successRate(successful, added) {
  if (!added) return 0
  return Math.round((successful / added) * 1000) / 10
}
