type CartItem = {
  product: any
  quantity: number
}

let cart: CartItem[] = []

function saveCart() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('local-connect-cart', JSON.stringify(cart))
  }
}

export function loadCart() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('local-connect-cart')
    cart = saved ? JSON.parse(saved) : []
  }
}

export function addToCart(item: CartItem) {
  loadCart()

  const existing = cart.find((i) => i.product.id === item.product.id)

  if (existing) {
    existing.quantity += item.quantity
  } else {
    cart.push({ ...item })
  }

  saveCart()
}

export function getCart(): CartItem[] {
  loadCart()
  return cart
}

export function updateCartItem(productId: string, quantity: number) {
  loadCart()

  if (quantity <= 0) {
    cart = cart.filter((i) => i.product.id !== productId)
  } else {
    const item = cart.find((i) => i.product.id === productId)
    if (item) item.quantity = quantity
  }

  saveCart()
}

export function removeFromCart(productId: string) {
  loadCart()
  cart = cart.filter((i) => i.product.id !== productId)
  saveCart()
}

export function clearCart() {
  cart = []
  saveCart()
}

export function getCartProductIds() {
  loadCart()

  return cart.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
  }))
}