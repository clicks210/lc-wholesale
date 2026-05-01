type DeliveryRule = {
  label: string
  days: number[]
  leadDays: number
  cutoffDays?: number
  cutoffHour?: number
}

export const deliveryRules: Record<string, DeliveryRule> = {
  Bread: {
    label: 'Tuesday or Friday',
    days: [2, 5],
    leadDays: 0,
    cutoffDays: 2,
    cutoffHour: 17,
  },
  Poultry: {
    label: 'Tuesday or Friday',
    days: [2, 5],
    leadDays: 0,
    cutoffDays: 2,
    cutoffHour: 17,
  },
  Produce: {
    label: 'Friday',
    days: [5],
    leadDays: 0,
    cutoffDays: 2,
    cutoffHour: 17,
  },
  Paper: {
    label: 'Next available Tuesday or Friday',
    days: [2, 5],
    leadDays: 7,
  },
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  next.setHours(12, 0, 0, 0)
  return next
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function hasPassedCutoff(deliveryDate: Date, rule: DeliveryRule) {
  if (!rule.cutoffDays || rule.cutoffHour === undefined) return false

  const now = new Date()

  const cutoff = new Date(deliveryDate)
  cutoff.setDate(cutoff.getDate() - rule.cutoffDays)
  cutoff.setHours(rule.cutoffHour, 0, 0, 0)

  return now > cutoff
}

export function getNextValidDeliveryDate(category: string) {
  const rule = deliveryRules[category]

  if (!rule) return null

  const today = new Date()
  today.setHours(12, 0, 0, 0)

  const earliest = addDays(today, rule.leadDays)

  for (let i = 0; i < 45; i++) {
    const candidate = addDays(earliest, i)

    const validDay = rule.days.includes(candidate.getDay())
    const cutoffPassed = hasPassedCutoff(candidate, rule)

    if (validDay && !cutoffPassed) {
      return {
        date: candidate,
        label: formatDate(candidate),
        ruleLabel: rule.label,
      }
    }
  }

  return null
}

export function getDeliveryGroups(items: any[]) {
  const groups: Record<string, any[]> = {}

  items.forEach((item) => {
    const category = item.product.category || 'Other'

    if (!groups[category]) {
      groups[category] = []
    }

    groups[category].push(item)
  })

  return Object.entries(groups).map(([category, groupItems]) => {
    const delivery = getNextValidDeliveryDate(category)

    return {
      category,
      items: groupItems,
      delivery,
    }
  })
}