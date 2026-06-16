import { getFulfillmentRule } from './fulfillmentRules'

const LC_DELIVERY_SCHEDULE = [
  {
    delivery_day: 'Tuesday',
    cutoff_day: 'Monday',
    cutoff_time: '14:00',
  },
  {
    delivery_day: 'Friday',
    cutoff_day: 'Thursday',
    cutoff_time: '14:00',
  },
]

const dayMap: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

export function getDeliveryGroups(items: any[]) {
  const lcItems = items.filter((item) => isLocalConnectFulfilled(item.product))

  const producerItems = items.filter(
    (item) => !isLocalConnectFulfilled(item.product)
  )

  return [
    ...getLocalConnectDeliveryGroups(lcItems),
    ...getProducerDeliveryGroups(producerItems),
  ]
}

function isLocalConnectFulfilled(product: any) {
  return (
    !product.producer_customer_id ||
    product.fulfillment_type === 'lc_stocked' ||
    product.producer_delivery_fulfillment_type === 'local_connect' ||
    product.producer_fulfillment_type === 'local_connect'
  )
}

function getLocalConnectDeliveryGroups(items: any[]) {
  const groups: any[] = []

  items.forEach((item) => {
    const product = item.product
    const rule = getFulfillmentRule(product)
    const inStock = Boolean(product.in_stock)

    const deliveryLabel =
      inStock || isLocalConnectFulfilled(product)
        ? `Local Connect Delivery · ${getNextDeliveryDate(LC_DELIVERY_SCHEDULE)}`
        : rule.deliveryDays?.length
          ? `${product.category} Special Order · ${getNextRuleDeliveryDate(rule)}`
          : `Special Order Delivery · ${getNextDeliveryDate(LC_DELIVERY_SCHEDULE)}`

    addToGroup(groups, {
      category: product.category || 'Local Connect',
      deliveryLabel,
      item,
    })
  })

  return groups
}

function getProducerDeliveryGroups(items: any[]) {
  const groups: any[] = []

  items.forEach((item) => {
    const product = item.product

    const schedule = getSchedule(product.producer_delivery_schedule)

    const deliveryLabel = `Producer Delivered · ${getNextDeliveryDate(schedule)}`

    addToGroup(groups, {
      category: 'Producer Fulfilled',
      deliveryLabel,
      item,
    })
  })

  return groups
}

function addToGroup(
  groups: any[],
  {
    category,
    deliveryLabel,
    item,
  }: {
    category: string
    deliveryLabel: string
    item: any
  }
) {
  const existing = groups.find(
    (group) => group.delivery?.label === deliveryLabel
  )

  if (existing) {
    existing.items.push(item)
    return
  }

  groups.push({
    category,
    delivery: {
      label: deliveryLabel,
      date: getRawNextDeliveryDate(item.product),
    },
    items: [item],
  })
}

function getRawNextDeliveryDate(product: any) {
  const schedule = isLocalConnectFulfilled(product)
    ? LC_DELIVERY_SCHEDULE
    : getSchedule(product.producer_delivery_schedule)

  const next = getNextDeliveryObject(schedule)

  if (!next) return ''

  return next.deliveryDate.toISOString().split('T')[0]
}

function getSchedule(value: any) {
  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

function buildRuleSchedule(rule: any) {
  if (!rule?.deliveryDays?.length) {
    return LC_DELIVERY_SCHEDULE
  }

  return rule.deliveryDays.map((rawDay: string) => {
    const day = normalizeDayName(rawDay)

    return {
      delivery_day: day,
      cutoff_day: day === 'Tuesday' ? 'Monday' : 'Thursday',
      cutoff_time: '14:00',
    }
  })
}

function getNextDeliveryObject(schedule: any[]) {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return null
  }

  const now = new Date()

  const validSchedules = schedule
    .map((item) => ({
      delivery_day: normalizeDayName(item.delivery_day),
      cutoff_day: normalizeDayName(item.cutoff_day),
      cutoff_time: item.cutoff_time || '14:00',
    }))
    .filter(
      (item) =>
        dayMap[item.delivery_day] !== undefined &&
        dayMap[item.cutoff_day] !== undefined
    )

  if (validSchedules.length === 0) {
    return null
  }

  const upcomingDates = validSchedules.map((item) => {
    const deliveryDate = getUpcomingDateForDay(item.delivery_day, now)

    const cutoffDate = getRelevantCutoffDate(
      item.cutoff_day,
      item.cutoff_time,
      deliveryDate
    )

    if (now > cutoffDate) {
      deliveryDate.setDate(deliveryDate.getDate() + 7)
    }

    return {
      ...item,
      deliveryDate,
      cutoffDate,
    }
  })

  upcomingDates.sort(
    (a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime()
  )

  return upcomingDates[0]
}

function getNextRuleDeliveryDate(rule: any) {
  if (!rule?.deliveryDays?.length) {
    return getNextDeliveryDate(LC_DELIVERY_SCHEDULE)
  }

  const schedule = rule.deliveryDays.map((rawDay: string) => {
    const day = normalizeDayName(rawDay)
    const deliveryDate = getUpcomingDateForDay(day, new Date())
    const cutoffDate = new Date(deliveryDate)

    const cutoffDaysBefore = Number(
      rule.cutoffDaysBefore ?? rule.leadTimeDays ?? 1
    )

    cutoffDate.setDate(deliveryDate.getDate() - cutoffDaysBefore)
    cutoffDate.setHours(14, 0, 0, 0)

    return {
      delivery_day: day,
      cutoff_day: getDayName(cutoffDate),
      cutoff_time: '14:00',
    }
  })

  return getNextDeliveryDate(schedule)
}

function getNextDeliveryDate(schedule: any[]) {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return 'Delivery to be confirmed'
  }

  const now = new Date()

  const validSchedules = schedule
    .map((item) => ({
      delivery_day: normalizeDayName(item.delivery_day),
      cutoff_day: normalizeDayName(item.cutoff_day),
      cutoff_time: item.cutoff_time || '14:00',
    }))
    .filter(
      (item) =>
        dayMap[item.delivery_day] !== undefined &&
        dayMap[item.cutoff_day] !== undefined
    )

  if (validSchedules.length === 0) {
    return 'Delivery to be confirmed'
  }

  const upcomingDates = validSchedules.map((item) => {
    const deliveryDate = getUpcomingDateForDay(item.delivery_day, now)

    const cutoffDate = getRelevantCutoffDate(
      item.cutoff_day,
      item.cutoff_time,
      deliveryDate
    )

    if (now > cutoffDate) {
      deliveryDate.setDate(deliveryDate.getDate() + 7)
    }

    return {
      ...item,
      deliveryDate,
      cutoffDate,
    }
  })

  upcomingDates.sort(
    (a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime()
  )

  return upcomingDates[0].deliveryDate.toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function getRelevantCutoffDate(
  cutoffDay: string,
  cutoffTime: string,
  deliveryDate: Date
) {
  const cutoffDate = new Date(deliveryDate)
  const deliveryDayIndex = deliveryDate.getDay()
  const cutoffDayIndex = dayMap[cutoffDay]

  let daysBack = (deliveryDayIndex - cutoffDayIndex + 7) % 7

  if (daysBack === 0) {
    daysBack = 7
  }

  cutoffDate.setDate(deliveryDate.getDate() - daysBack)

  const [hour, minute] = cutoffTime.split(':').map(Number)
  cutoffDate.setHours(hour || 0, minute || 0, 0, 0)

  return cutoffDate
}

function getUpcomingDateForDay(day: string, fromDate: Date) {
  const date = new Date(fromDate)
  const targetDay = dayMap[day]

  const diff = (targetDay - fromDate.getDay() + 7) % 7
  date.setDate(fromDate.getDate() + diff)
  date.setHours(0, 0, 0, 0)

  return date
}

function normalizeDayName(day: string) {
  if (!day) return ''

  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
}

function getDayName(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
  })
}