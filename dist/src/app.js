import { CATEGORIES, PRODUCTS, PRODUCT_BY_ID } from "./catalog.js";
import { formatDate, formatDuration, formatNumber, formatPrice, normalizeDigits } from "./format.js";
import { ORDER_PREFIX, addTabOrderId, getCart, getOrder, getOrders, getStoredTable, normalizeTable, saveCart, saveOrder, saveTable, getTabOrderIds } from "./storage.js";

const app = document.querySelector("#app");
const initialParams = new URLSearchParams(window.location.search);
const isKitchen = window.location.pathname.replace(/\/$/, "") === "/kitchen";
const isDemo = initialParams.get("demo") === "1";
const faDigits = (value) => formatNumber(value);

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function createId() {
  return `o-${Date.now().toString(36)}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

function currentTableFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has("table")) return { value: getStoredTable(), invalid: false };
  const value = normalizeTable(urlParams.get("table"));
  return { value, invalid: value === null };
}

function updateTableUrl(table) {
  const url = new URL(window.location.href);
  url.searchParams.set("table", String(table));
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function orderStatusLabel(status) {
  return { submitted: "ثبت شد", preparing: "در حال آماده‌سازی", ready: "آماده" }[status] ?? "ثبت شد";
}

function statusSteps(status) {
  const statuses = ["submitted", "preparing", "ready"];
  const active = statuses.indexOf(status);
  return statuses.map((item, index) => `<span class="step ${index < active ? "done" : ""} ${index === active ? "current" : ""}">${orderStatusLabel(item)}</span>`).join("");
}

function productCard(product) {
  return `<article class="product-card">
    <div class="product-head"><span class="emoji" aria-hidden="true">${product.emoji}</span><div><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.description)}</p></div></div>
    <div class="product-foot"><span class="price">${formatPrice(product.price)}</span><button class="primary add-product" data-product="${product.id}">افزودن</button></div>
  </article>`;
}

function renderCustomer() {
  const tableInfo = currentTableFromUrl();
  if (initialParams.has("table") && tableInfo.value) saveTable(tableInfo.value);
  const state = { table: tableInfo.value, tableInvalid: tableInfo.invalid, filter: "all", cart: getCart(), message: null, submitting: false };

  function cartItems() {
    return state.cart.map((item) => ({ ...item, product: PRODUCT_BY_ID.get(item.id) })).filter((item) => item.product);
  }

  function cartTotal() { return cartItems().reduce((sum, item) => sum + item.product.price * item.quantity, 0); }
  function cartCount() { return cartItems().reduce((sum, item) => sum + item.quantity, 0); }

  function render() {
    const previousFiltersScrollLeft = document.querySelector(".filters-viewport")?.scrollLeft ?? null;
    const visibleProducts = state.filter === "all" ? PRODUCTS : PRODUCTS.filter((product) => product.category === state.filter);
    const items = cartItems();
    const tabIds = new Set(getTabOrderIds());
    const orders = getOrders().filter((order) => tabIds.has(order.id) && state.table !== null && normalizeTable(order.table) === state.table).sort((a, b) => b.createdAt - a.createdAt);
    app.innerHTML = `<div class="shell">
      <header class="topbar"><div><div class="brand">کافه هفت</div><div class="subtle">سفارش تازه، حال خوب</div></div></header>
      <section class="panel"><h2>انتخاب میز</h2><div class="table-row"><div class="field"><label for="table-input">شماره میز</label><input id="table-input" inputmode="numeric" autocomplete="off" value="${state.table ? faDigits(state.table) : ""}" placeholder="مثلاً ۷" aria-describedby="table-help" /></div><button class="secondary" id="save-table">ذخیره میز</button></div><div id="table-help" class="subtle">${state.tableInvalid ? "شماره میز در نشانی معتبر نیست؛ یک شماره مثبت وارد کنید." : state.table ? `میز ${faDigits(state.table)} برای این تب انتخاب شده است.` : "مرور منو بدون انتخاب میز آزاد است؛ برای ثبت سفارش میز را انتخاب کنید."}</div></section>
      <section class="panel"><h2>منو</h2><div class="filters-viewport"><div class="filters" role="tablist" aria-label="دسته‌بندی منو">${CATEGORIES.map((category) => `<button class="filter ${state.filter === category.id ? "active" : ""}" data-filter="${category.id}" role="tab" aria-selected="${state.filter === category.id}">${category.label}</button>`).join("")}</div></div><div class="product-grid" style="margin-top:14px">${visibleProducts.map(productCard).join("")}</div></section>
      <section class="panel" id="cart"><h2>سبد خرید</h2>${items.length ? items.map((item) => `<div class="cart-row"><div class="cart-info"><strong>${item.product.emoji} ${escapeHtml(item.product.name)}</strong><small>${formatPrice(item.product.price)} · جمع ${formatPrice(item.product.price * item.quantity)}</small></div><div class="qty"><button class="decrease" data-product="${item.id}" aria-label="کاهش ${escapeHtml(item.product.name)}">−</button><span>${faDigits(item.quantity)}</span><button class="increase" data-product="${item.id}" aria-label="افزایش ${escapeHtml(item.product.name)}">+</button><button class="danger-button remove" data-product="${item.id}" aria-label="حذف ${escapeHtml(item.product.name)} از سبد" title="حذف از سبد"><svg class="trash-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-.8 11.2a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8L6 9Zm3 2v8h2v-8H9Zm4 0v8h2v-8h-2Z"/></svg></button></div></div>`).join("") + `<div class="total-line"><span>جمع کل</span><span>${formatPrice(cartTotal())}</span></div><div class="checkout-row"><span class="subtle">${state.table ? `میز ${faDigits(state.table)}` : "میز انتخاب نشده"}</span><button class="primary" id="submit-order" ${state.submitting ? "disabled" : ""}>${state.submitting ? "در حال ثبت…" : "ثبت سفارش"}</button></div>` : `<div class="empty">سبد خرید شما خالی است.</div>`}${state.message ? `<div class="message ${state.message.type === "error" ? "error" : ""}">${escapeHtml(state.message.text)}</div>` : ""}</section>
      <section class="panel"><h2>سفارش‌های من</h2>${orders.length ? `<div class="orders-grid">${orders.map((order) => `<article class="order-card"><div class="order-head"><div><h3>سفارش ${escapeHtml(order.id.slice(-6).toUpperCase())}</h3><div class="order-meta">میز ${faDigits(order.table)} · ${formatDate(order.createdAt)}</div></div>${order.isDemo ? '<span class="badge demo">نمونه</span>' : `<span class="badge">${orderStatusLabel(order.status)}</span>`}</div><div class="order-items">${order.items.map((item) => `<div class="order-item"><span>${item.emoji} ${escapeHtml(item.name)} × ${faDigits(item.quantity)}</span><strong>${formatPrice(item.price * item.quantity)}</strong></div>`).join("")}</div><div class="total-line"><span>مبلغ</span><span>${formatPrice(order.total)}</span></div><div class="steps">${statusSteps(order.status)}</div></article>`).join("")}</div>` : '<div class="empty">هنوز سفارشی در این تب ثبت نشده است.</div>'}</section>
    </div>${items.length ? `<div class="sticky-cart"><div class="sticky-inner"><div class="sticky-total"><strong>${faDigits(cartCount())} قلم</strong>${formatPrice(cartTotal())}</div><button class="primary" id="view-cart">مشاهده سبد</button></div></div>` : ""}`;
    if (previousFiltersScrollLeft !== null) document.querySelector(".filters-viewport").scrollLeft = previousFiltersScrollLeft;
    bindEvents();
  }

  function updateCart(productId, delta) {
    const found = state.cart.find((item) => item.id === productId);
    if (found) found.quantity += delta;
    else if (delta > 0) state.cart.push({ id: productId, quantity: delta });
    state.cart = state.cart.filter((item) => item.quantity > 0);
    saveCart(state.cart);
    render();
  }

  function bindEvents() {
    document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => { state.filter = button.dataset.filter; render(); }));
    document.querySelectorAll(".add-product").forEach((button) => button.addEventListener("click", () => updateCart(button.dataset.product, 1)));
    document.querySelectorAll(".increase").forEach((button) => button.addEventListener("click", () => updateCart(button.dataset.product, 1)));
    document.querySelectorAll(".decrease").forEach((button) => button.addEventListener("click", () => updateCart(button.dataset.product, -1)));
    document.querySelectorAll(".remove").forEach((button) => button.addEventListener("click", () => { state.cart = state.cart.filter((item) => item.id !== button.dataset.product); saveCart(state.cart); render(); }));
    document.querySelector("#view-cart")?.addEventListener("click", () => document.querySelector("#cart")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    document.querySelector("#save-table")?.addEventListener("click", () => {
      const input = document.querySelector("#table-input");
      const value = normalizeTable(normalizeDigits(input.value));
      if (!value) { state.message = { type: "error", text: "شماره میز باید یک عدد صحیح مثبت باشد." }; render(); return; }
      state.table = value; state.tableInvalid = false; state.message = { type: "success", text: `میز ${faDigits(value)} ذخیره شد.` }; saveTable(value); updateTableUrl(value); render();
    });
    document.querySelector("#submit-order")?.addEventListener("click", submitOrder);
  }

  function submitOrder() {
    if (state.submitting || !state.table || !state.cart.length) {
      state.message = { type: "error", text: !state.table ? "برای ثبت سفارش ابتدا میز را انتخاب کنید." : "سبد خرید خالی است." }; render(); return;
    }
    state.submitting = true; render();
    const now = Date.now();
    const items = cartItems().map(({ product, quantity }) => ({ id: product.id, name: product.name, emoji: product.emoji, price: product.price, quantity }));
    const order = { id: createId(), table: state.table, items, total: items.reduce((sum, item) => sum + item.price * item.quantity, 0), status: "submitted", createdAt: now, readyAt: null, isDemo: false };
    const saved = saveOrder(order) && addTabOrderId(order.id);
    if (!saved) { state.submitting = false; state.message = { type: "error", text: "ذخیره سفارش انجام نشد؛ سبد شما حفظ شد." }; render(); return; }
    state.cart = []; saveCart(state.cart); state.submitting = false; state.message = { type: "success", text: "سفارش شما با موفقیت ثبت شد." }; render();
  }

  window.addEventListener("storage", (event) => { if (!event.key || event.key.startsWith(ORDER_PREFIX)) render(); });
  window.addEventListener("popstate", () => {
    const nextTable = currentTableFromUrl();
    state.table = nextTable.value;
    state.tableInvalid = nextTable.invalid;
    render();
  });
  render();
}

function renderKitchen() {
  const state = { tick: Date.now(), message: null };

  function render() {
    const orders = getOrders();
    const active = orders.filter((order) => order.status !== "ready").sort((a, b) => a.createdAt - b.createdAt);
    const ready = orders.filter((order) => order.status === "ready").sort((a, b) => (b.readyAt ?? 0) - (a.readyAt ?? 0));
    app.innerHTML = `<div class="shell"><header class="topbar"><div><div class="brand">آشپزخانه کافه هفت</div><div class="subtle">مدیریت سفارش‌های جاری</div></div></header>${isDemo ? `<section class="panel demo-panel"><h2>حالت تست</h2><p>برای بررسی هشدار زمان، یک سفارش نمونه با زمان انتظار ۱۶ دقیقه اضافه کنید.</p><button class="secondary" id="add-demo">افزودن سفارش نمونهٔ ۱۶ دقیقه‌ای</button></section>` : ""}<div class="kitchen-grid"><section class="panel kitchen-section"><h2>سفارش‌های فعال <span class="count">${faDigits(active.length)}</span></h2>${active.length ? active.map(kitchenCard).join("") : '<div class="empty">سفارش فعالی وجود ندارد.</div>'}</section><section class="panel kitchen-section"><h2>سفارش‌های آماده <span class="count">${faDigits(ready.length)}</span></h2>${ready.length ? ready.map(kitchenCard).join("") : '<div class="empty">هنوز سفارشی آماده نشده است.</div>'}</section></div>${state.message ? `<div class="message ${state.message.type === "error" ? "error" : ""}">${escapeHtml(state.message.text)}</div>` : ""}</div>`;
    bindEvents();
  }

  function kitchenCard(order) {
    const waiting = order.status === "ready" ? (order.readyAt ?? order.createdAt) - order.createdAt : state.tick - order.createdAt;
    const overdue = order.status !== "ready" && waiting > 900000;
    return `<article class="kitchen-card ${overdue ? "overdue" : ""}"><div class="order-head"><div><strong>میز ${faDigits(order.table)}</strong><div class="order-meta">${formatDate(order.createdAt)} · <span class="wait-time">${formatDuration(waiting)}</span></div></div><span class="badge ${order.isDemo ? "demo" : ""}">${order.isDemo ? "نمونه" : orderStatusLabel(order.status)}</span></div><div class="order-items">${order.items.map((item) => `<div class="order-item"><span>${item.emoji} ${escapeHtml(item.name)}</span><strong>× ${faDigits(item.quantity)}</strong></div>`).join("")}</div>${overdue ? '<div class="overdue-label">بیش از ۱۵ دقیقه انتظار</div>' : ""}${order.status !== "ready" ? `<div class="kitchen-actions"><button class="primary advance-order" data-id="${order.id}">${order.status === "submitted" ? "شروع آماده‌سازی" : "آماده شد"}</button></div>` : ""}</article>`;
  }

  function bindEvents() {
    document.querySelectorAll(".advance-order").forEach((button) => button.addEventListener("click", () => advance(button.dataset.id)));
    document.querySelector("#add-demo")?.addEventListener("click", addDemo);
  }

  function advance(id) {
    const latest = getOrder(id);
    if (!latest) return;
    const now = Date.now();
    if (latest.status === "submitted") latest.status = "preparing";
    else if (latest.status === "preparing") { latest.status = "ready"; latest.readyAt = now; }
    else return;
    if (!saveOrder(latest)) { state.message = { type: "error", text: "تغییر وضعیت ذخیره نشد." }; render(); return; }
    state.tick = now; render();
  }

  function addDemo() {
    const now = Date.now();
    const order = { id: createId(), table: 99, items: [{ id: "latte", name: "لاته", emoji: "☕", price: 95000, quantity: 1 }], total: 95000, status: "submitted", createdAt: now - 16 * 60 * 1000, readyAt: null, isDemo: true };
    if (saveOrder(order)) { state.message = { type: "success", text: "سفارش نمونه اضافه شد." }; render(); }
    else { state.message = { type: "error", text: "ذخیره سفارش نمونه انجام نشد." }; render(); }
  }

  window.addEventListener("storage", (event) => { if (!event.key || event.key.startsWith(ORDER_PREFIX)) { state.tick = Date.now(); render(); } });
  const timer = window.setInterval(() => { state.tick = Date.now(); render(); }, 1000);
  window.addEventListener("beforeunload", () => window.clearInterval(timer), { once: true });
  render();
}

if (isKitchen) renderKitchen(); else renderCustomer();
