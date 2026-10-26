const ORDER_PREFIX = "cafe7:v1:order:";
const CART_KEY = "cafe7:v1:cart";
const TABLE_KEY = "cafe7:v1:table";
const ORDER_IDS_KEY = "cafe7:v1:tab-order-ids";

function getStore(kind) {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readJson(store, key, fallback) {
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(store, key, value) {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function normalizeTable(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).trim();
  if (!/^\d+$/.test(normalized)) return null;
  const table = Number(normalized);
  return Number.isSafeInteger(table) && table > 0 ? table : null;
}

function isOrder(value) {
  const validItems = Array.isArray(value?.items) && value.items.length > 0 && value.items.every((item) => item && typeof item.id === "string" && typeof item.name === "string" && typeof item.emoji === "string" && Number.isFinite(item.price) && Number.isSafeInteger(item.quantity) && item.quantity > 0);
  return Boolean(
    value && typeof value === "object" && typeof value.id === "string" &&
    Number.isFinite(value.createdAt) && Number.isFinite(value.total) &&
    Number.isSafeInteger(value.table) && value.table > 0 &&
    ["submitted", "preparing", "ready"].includes(value.status) &&
    (value.readyAt === null || Number.isFinite(value.readyAt)) && validItems,
  );
}

export function getOrders() {
  const store = getStore("local");
  if (!store) return [];
  const orders = [];
  try {
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (!key?.startsWith(ORDER_PREFIX)) continue;
      const value = readJson(store, key, null);
      if (isOrder(value)) orders.push(value);
    }
  } catch {
    return orders;
  }
  return orders;
}

export function getOrder(id) {
  const store = getStore("local");
  const order = readJson(store, `${ORDER_PREFIX}${id}`, null);
  return isOrder(order) ? order : null;
}

export function saveOrder(order) {
  return writeJson(getStore("local"), `${ORDER_PREFIX}${order.id}`, order);
}

export function getCart() {
  const cart = readJson(getStore("session"), CART_KEY, []);
  return Array.isArray(cart) ? cart.filter((item) => item && typeof item.id === "string" && Number.isSafeInteger(item.quantity) && item.quantity > 0) : [];
}

export function saveCart(cart) {
  return writeJson(getStore("session"), CART_KEY, cart);
}

export function getStoredTable() {
  return normalizeTable(readJson(getStore("session"), TABLE_KEY, null));
}

export function saveTable(table) {
  return writeJson(getStore("session"), TABLE_KEY, table);
}

export function getTabOrderIds() {
  const ids = readJson(getStore("session"), ORDER_IDS_KEY, []);
  return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
}

export function addTabOrderId(id) {
  const ids = getTabOrderIds();
  if (!ids.includes(id)) ids.unshift(id);
  return writeJson(getStore("session"), ORDER_IDS_KEY, ids);
}

export { ORDER_PREFIX };
