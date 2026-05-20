export const CATEGORY_RULES = {
  Produce: {
    minimum: 300,
    leadTimeDays: 0,
    deliveryDays: ['tuesday', 'friday'],
    cutoffDaysBefore: 2,
  },

  Bread: {
    minimum: 0,
    leadTimeDays: 0,
    deliveryDays: ['tuesday', 'friday'],
    cutoffDaysBefore: 2,
  },

  Poultry: {
    minimum: 0,
    leadTimeDays: 0,
    deliveryDays: ['tuesday', 'friday'],
    cutoffDaysBefore: 2,
  },

  Paper: {
    minimum: 500,
    leadTimeDays: 7,
    deliveryDays: ['tuesday', 'friday'],
    cutoffDaysBefore: null,
  },
}

export function getFulfillmentRule(product: any) {
  const categoryRule =
    CATEGORY_RULES[
      product.category as keyof typeof CATEGORY_RULES
    ]

  const inStock = Boolean(product.in_stock)

  return {
    ...categoryRule,

    inStock,

    type: inStock
      ? 'stocked'
      : 'special_order',

    label: inStock
      ? 'In Stock'
      : 'Special Order',

    message: inStock
      ? 'Available for standard Tuesday / Friday delivery.'
      : categoryRule?.minimum > 0
        ? `Counts toward ${product.category} minimum of $${categoryRule.minimum}.`
        : 'Special order item.',
  }
}

export function evaluateCartFulfillment(cartItems: any[]) {
  const categoryGroups: Record<string, any> = {}

  for (const item of cartItems) {
    const product = item.product || item

    const rule = getFulfillmentRule(product)

    const lineTotal =
      Number(product.price || 0) *
      Number(item.quantity || 1)

    if (!categoryGroups[product.category]) {
      categoryGroups[product.category] = {
        category: product.category,
        subtotal: 0,
        minimum: rule.minimum || 0,
        leadTimeDays: rule.leadTimeDays || 0,

        stockedSubtotal: 0,
        specialOrderSubtotal: 0,

        items: [],
      }
    }

    categoryGroups[product.category].subtotal += lineTotal

    if (product.in_stock) {
      categoryGroups[product.category].stockedSubtotal +=
        lineTotal
    } else {
      categoryGroups[
        product.category
      ].specialOrderSubtotal += lineTotal
    }

    categoryGroups[product.category].items.push(item)
  }

  const groups = Object.values(categoryGroups)

  const failures = groups.filter(
    (group: any) =>
      group.minimum > 0 &&
      group.subtotal < group.minimum
  )

  return {
    valid: failures.length === 0,
    groups,
    failures,
  }
}