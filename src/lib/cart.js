const CART_KEY = "cart";
const _mem = { cart: [] };

function hasLS() {
  if (typeof window === "undefined") return false;
  return !!window.localStorage;
}

function read() {
  if (!hasLS()) return _mem.cart;
  const ls = window.localStorage;
  const raw = ls.getItem(CART_KEY) || "[]";
  const arr = JSON.parse(raw);
  return Array.isArray(arr) ? arr : [];
}

function write(arr) {
  const safeArr = Array.isArray(arr) ? arr : [];
  if (hasLS()) {
    const ls = window.localStorage;
    ls.setItem(CART_KEY, JSON.stringify(safeArr));
  } else {
    _mem.cart = safeArr;
  }
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new Event("cart-changed"));
  }
}

export function getCart() { return read(); }
export function setCart(next) { write(Array.isArray(next) ? next : []); }
export function clearCart() { write([]); }

export function addToCart(product, qty = 1, comboGroup = "") {
  const cart = read();
  const id = product?.productId || product?._id || product?.id || null;
  if (!id) return;

  const keyGroup = comboGroup || product?.comboGroup || "";
  const idx = cart.findIndex((i) => i.id === id && (i.comboGroup || "") === keyGroup);

  if (idx >= 0) {
    cart[idx].qty = Math.max(1, (cart[idx].qty || 1) + qty);
  } else {
    cart.push({
      id,
      name: product.name || "Producto",
      price: Number(product.price) || 0,
      qty: Math.max(1, qty),
      image: product.image || "",
      comboGroup: keyGroup,
      color: product.color || "",
      size: product.size || ""
    });
  }
  write(cart);
}

export function addBundleToCart(items, bundleName = "Combo") {
  const cart = read();
  const groupId = `bundle-${Date.now()}`; 
  
  items.forEach(item => {
    // 🎯 FIX: Se asegura de capturar el ID de Atlas para que el Checkout no de error
    const realId = item.productId || item._id || item.id;

    cart.push({
      id: realId,
      sku: item.sku || item.id || "SKU-GENERIC",
      name: item.name,
      price: Number(item.price) || 0,
      qty: 1,
      image: item.image || item.front || "",
      comboGroup: groupId,
      color: item.color || "Único",
      size: item.chosenSize || item.size || "M"
    });
  });
  write(cart);
}

export function removeFromCart(id, comboGroup = "") {
  const cart = read().filter((i) => !(i.id === id && (i.comboGroup || "") === (comboGroup || "")));
  write(cart);
}

export function updateQtyDelta(id, comboGroup = "", delta = 0) {
  const cart = read();
  const idx = cart.findIndex((i) => i.id === id && (i.comboGroup || "") === (comboGroup || ""));
  if (idx < 0) return;
  cart[idx].qty = Math.max(1, (cart[idx].qty || 1) + delta);
  write(cart);
}

export function removeComboGroup(group = "") {
  const cart = read().filter((i) => (i.comboGroup || "") !== group);
  write(cart);
}