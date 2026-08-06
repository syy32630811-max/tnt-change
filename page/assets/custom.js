const pageCode =
  new URLSearchParams(window.location.search).get("code")?.trim() || "";

const EXPECTED_PAGE_TYPE = "custom";
const ENTRY_URL = "/page/";

const productListEl = document.getElementById("product-list");
const cartListEl = document.getElementById("cart-list");
const orderListEl = document.getElementById("order-list");
const cartBadge = document.getElementById("cart-badge");
const cartFooter = document.getElementById("cart-footer");
const cartTotalEl = document.getElementById("cart-total");
const modalMask = document.getElementById("modal-mask");
const modal = document.getElementById("modal");
const toastEl = document.getElementById("toast");

const CART_KEY = `custom_cart_${pageCode || "guest"}`;

let products = [];
let cart = loadCart();
let orders = [];
let activeTab = "products";

function toast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.classList.toggle("error", isError);
  toastEl.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!response.ok) {
    const raw = data?.message;
    throw new Error(Array.isArray(raw) ? raw[0] : raw || "请求失败");
  }
  return data;
}

function redirectToEntry(message) {
  const params = new URLSearchParams();
  if (message) params.set("error", message);
  window.location.replace(`${ENTRY_URL}?${params.toString()}`);
}

async function ensurePageCode() {
  if (!pageCode) {
    redirectToEntry("缺少页面码，请输入标识码进入");
    return false;
  }

  try {
    const data = await api(`/page-entry-codes/${encodeURIComponent(pageCode)}`);
    if (data.pageType !== EXPECTED_PAGE_TYPE) {
      redirectToEntry(
        `该页面码属于${data.pageTypeLabel || "其他类型"}，无法进入物料定制页`,
      );
      return false;
    }
    return true;
  } catch (error) {
    redirectToEntry(error.message || "页面码无效或不存在");
    return false;
  }
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      selected: Boolean(item.selected),
    }));
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  syncCartBadge();
}

function syncCartBadge() {
  const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  cartBadge.hidden = count <= 0;
  cartBadge.textContent = String(count);
}

function closeModal() {
  modalMask.classList.remove("open");
  modal.innerHTML = "";
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".custom-nav [data-nav]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === tab);
  });
  document.querySelectorAll(".view").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.view === tab);
  });

  if (tab === "products") renderProducts();
  if (tab === "cart") renderCart();
  if (tab === "orders") loadOrders();
}

function addToCart(product, spec, quantity = 1) {
  const key = `${product.id}_${spec.id}`;
  const existing = cart.find((item) => item.key === key);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      key,
      productId: product.id,
      productName: product.name,
      specId: spec.id,
      specName: spec.name,
      image: spec.image || product.coverImage || "",
      price: Number(spec.price),
      quantity,
      selected: false,
    });
  }
  saveCart();
  if (activeTab === "products") renderProducts();
  toast(`已加入购物车 ×${quantity}`);
}

function getCartQty(productId, specId) {
  const item = cart.find(
    (row) =>
      String(row.productId) === String(productId) &&
      String(row.specId) === String(specId),
  );
  return Number(item?.quantity || 0);
}

function updateCartQty(key, delta) {
  const item = cart.find((row) => row.key === key);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter((row) => row.key !== key);
  }
  saveCart();
  renderCart();
  if (activeTab === "products") renderProducts();
}

function removeCartItem(key) {
  cart = cart.filter((row) => row.key !== key);
  saveCart();
  renderCart();
  if (activeTab === "products") renderProducts();
}

function getSelectedCartItems() {
  return cart.filter((item) => item.selected);
}

function updateCartTotal() {
  const total = getSelectedCartItems().reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );
  cartTotalEl.textContent = formatMoney(total);
}

function toggleCartSelect(key, checked) {
  const item = cart.find((row) => row.key === key);
  if (!item) return;
  item.selected = Boolean(checked);
  saveCart();
  updateCartTotal();
}

function renderProducts() {
  if (!pageCode) {
    productListEl.innerHTML =
      '<div class="empty-tip">缺少页面码，请从入口页输入标识码进入</div>';
    return;
  }

  const list = products.filter((item) => item.isValid !== false);
  if (!list.length) {
    productListEl.innerHTML = '<div class="empty-tip">暂无商品</div>';
    return;
  }

  productListEl.innerHTML = list
    .map((product) => {
      const specs = (product.specs || []).slice().sort(
        (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
      );
      const productCartQty = specs.reduce(
        (sum, spec) => sum + getCartQty(product.id, spec.id),
        0,
      );
      return `
        <article class="product-card">
          <div class="product-media">
            <h2>${escapeHtml(product.name)}</h2>
            <img src="${escapeHtml(product.coverImage || "")}" alt="" onerror="this.style.opacity=.25" />
          </div>
          <div class="product-meta">
            <p class="product-summary">${specs.length} 个规格可选${productCartQty > 0 ? ` · 已加购 ${productCartQty}` : ""}</p>
            <div class="spec-list">
              ${
                specs.length
                  ? specs
                      .map((spec) => {
                        const qty = getCartQty(product.id, spec.id);
                        return `
                  <div class="spec-row">
                    <div class="spec-media">
                      <img src="${escapeHtml(spec.image || product.coverImage || "")}" alt="" onerror="this.style.opacity=.25" />
                      ${qty > 0 ? `<div class="in-cart-qty">已加入 ${qty}</div>` : ""}
                    </div>
                    <div class="spec-info">
                      <div class="spec-name">${escapeHtml(spec.name || "默认规格")}</div>
                      <div class="price">¥${formatMoney(spec.price)}</div>
                    </div>
                    <div class="add-actions">
                      <div class="qty-ctrl">
                        <button type="button" data-add-qty-minus>-</button>
                        <input
                          class="add-qty-input"
                          type="number"
                          min="1"
                          step="1"
                          value="1"
                          data-add-qty-input
                        />
                        <button type="button" data-add-qty-plus>+</button>
                      </div>
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        data-add-cart
                        data-product-id="${product.id}"
                        data-spec-id="${spec.id}"
                      >加入购物车</button>
                    </div>
                  </div>`;
                      })
                      .join("")
                  : '<div class="empty-tip">暂无规格</div>'
              }
            </div>
          </div>
        </article>`;
    })
    .join("");
}

function renderCart() {
  cartFooter.hidden = false;
  if (!cart.length) {
    cartListEl.innerHTML = '<div class="empty-tip">购物车为空</div>';
    cartTotalEl.textContent = "0.00";
    return;
  }

  cartListEl.innerHTML = cart
    .map(
      (item) => `
      <article class="cart-row">
        <label class="cart-check">
          <input type="checkbox" data-cart-select="${item.key}" ${item.selected ? "checked" : ""} />
        </label>
        <div class="cart-media">
          <h3>${escapeHtml(item.productName)}</h3>
          <img src="${escapeHtml(item.image || "")}" alt="" onerror="this.style.opacity=.25" />
        </div>
        <div class="cart-meta">
          <p>${escapeHtml(item.specName || "默认规格")}</p>
          <p>¥${formatMoney(item.price)}</p>
          <div class="qty-ctrl">
            <button type="button" data-qty-minus="${item.key}">-</button>
            <span>${item.quantity}</span>
            <button type="button" data-qty-plus="${item.key}">+</button>
          </div>
        </div>
        <button type="button" class="btn btn-danger btn-sm cart-remove" data-remove-cart="${item.key}">删除</button>
      </article>`,
    )
    .join("");
  updateCartTotal();
}

function canEditShipping(status) {
  return status !== "shipped" && status !== "cancelled";
}

function renderOrders() {
  if (!pageCode) {
    orderListEl.innerHTML =
      '<div class="empty-tip">缺少页面码，请从入口页输入标识码进入</div>';
    return;
  }

  if (!orders.length) {
    orderListEl.innerHTML = '<div class="empty-tip">暂无订单</div>';
    return;
  }

  orderListEl.innerHTML = orders
    .map((order) => {
      const items = order.items || [];
      const amount = items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0,
      );
      const editable = canEditShipping(order.status);
      return `
        <article class="order-card">
          <div class="order-head">
            <div>
              <h3>${escapeHtml(order.orderNo)}</h3>
              <p>${formatDate(order.createdAt)}</p>
            </div>
            <span class="order-status status-${escapeHtml(order.status)}">${escapeHtml(order.statusLabel || order.status)}</span>
          </div>
          <div class="order-items">
            ${items
              .map(
                (item) => `
              <div class="order-item">
                <img src="${escapeHtml(item.image || "")}" alt="" onerror="this.style.opacity=.25" />
                <div>
                  <p>${escapeHtml(item.productName)}</p>
                  <p>${escapeHtml(item.specName || "-")} × ${item.quantity}</p>
                </div>
                <div class="price">¥${formatMoney(Number(item.price) * Number(item.quantity))}</div>
              </div>`,
              )
              .join("")}
          </div>
          <div class="order-shipping">
            <p>收货人：${escapeHtml(order.contactName || "-")} ${escapeHtml(order.contactPhone || "")}</p>
            <p>地址：${escapeHtml(order.address || "-")}</p>
          </div>
          <div class="order-footer">
            ${
              editable
                ? `<button type="button" class="btn btn-ghost btn-sm" data-edit-shipping="${order.id}">修改收货信息</button>`
                : `<span></span>`
            }
            <p class="order-total">合计：¥${formatMoney(amount)}</p>
          </div>
        </article>`;
    })
    .join("");
}

function openEditShippingModal(orderId) {
  const order = orders.find((item) => String(item.id) === String(orderId));
  if (!order) {
    toast("订单不存在", true);
    return;
  }
  if (!canEditShipping(order.status)) {
    toast("当前订单状态不可修改收货信息", true);
    return;
  }

  modal.innerHTML = `
    <h2>修改收货信息</h2>
    <p class="sub">订单 ${escapeHtml(order.orderNo)}</p>
    <form class="form-grid" id="shipping-form">
      <div class="form-row">
        <label>联系人</label>
        <input name="contactName" required maxlength="64" value="${escapeHtml(order.contactName || "")}" />
      </div>
      <div class="form-row">
        <label>联系电话</label>
        <input name="contactPhone" required maxlength="32" value="${escapeHtml(order.contactPhone || "")}" />
      </div>
      <div class="form-row">
        <label>地址</label>
        <input name="address" required maxlength="255" value="${escapeHtml(order.address || "")}" />
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>取消</button>
        <button type="submit" class="btn btn-primary" id="shipping-submit-btn">保存</button>
      </div>
    </form>
  `;
  modalMask.classList.add("open");

  document.getElementById("shipping-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById("shipping-submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "保存中…";

    try {
      const updated = await api(`/orders/${order.id}/shipping`, {
        method: "PATCH",
        body: JSON.stringify({
          pageCode,
          contactName: form.contactName.value.trim(),
          contactPhone: form.contactPhone.value.trim(),
          address: form.address.value.trim(),
        }),
      });
      const index = orders.findIndex((item) => String(item.id) === String(order.id));
      if (index >= 0) orders[index] = updated;
      toast("收货信息已更新");
      closeModal();
      renderOrders();
    } catch (error) {
      toast(error.message, true);
      submitBtn.disabled = false;
      submitBtn.textContent = "保存";
    }
  });
}

function openCheckoutModal() {
  if (!pageCode) {
    toast("缺少页面码，请从入口页进入", true);
    return;
  }
  const selectedItems = getSelectedCartItems();
  if (!selectedItems.length) {
    toast("请先勾选要结算的商品", true);
    return;
  }

  modal.innerHTML = `
    <h2>提交订单</h2>
    <p class="sub">填写收货信息后提交，当前勾选 ${selectedItems.length} 种商品。</p>
    <form class="form-grid" id="checkout-form">
      <div class="form-row">
        <label>联系人</label>
        <input name="contactName" required maxlength="64" />
      </div>
      <div class="form-row">
        <label>联系电话</label>
        <input name="contactPhone" required maxlength="32" />
      </div>
      <div class="form-row">
        <label>地址</label>
        <input name="address" required maxlength="255" />
      </div>
      <div class="form-row">
        <label>备注</label>
        <textarea name="remark" rows="3" maxlength="512"></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>取消</button>
        <button type="submit" class="btn btn-primary" id="submit-btn">确认提交</button>
      </div>
    </form>
  `;
  modalMask.classList.add("open");

  document.getElementById("checkout-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "提交中…";

    try {
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          pageCode,
          contactName: form.contactName.value.trim(),
          contactPhone: form.contactPhone.value.trim(),
          address: form.address.value.trim(),
          remark: form.remark.value.trim(),
          items: selectedItems.map((item) => ({
            productId: item.productId,
            specId: item.specId,
            quantity: item.quantity,
          })),
        }),
      });
      const selectedKeys = new Set(selectedItems.map((item) => item.key));
      cart = cart.filter((item) => !selectedKeys.has(item.key));
      saveCart();
      toast("订单已提交");
      closeModal();
      switchTab("orders");
      await loadOrders();
    } catch (error) {
      toast(error.message, true);
      submitBtn.disabled = false;
      submitBtn.textContent = "确认提交";
    }
  });
}

async function loadProducts() {
  products = await api("/products");
  renderProducts();
}

async function loadOrders() {
  if (!pageCode) {
    renderOrders();
    return;
  }
  try {
    orders = await api(`/orders?pageCode=${encodeURIComponent(pageCode)}`);
    renderOrders();
  } catch (error) {
    orderListEl.innerHTML = `<div class="empty-tip">${escapeHtml(error.message)}</div>`;
  }
}

document.addEventListener("change", (event) => {
  const select = event.target.closest("[data-cart-select]");
  if (!select) return;
  toggleCartSelect(select.dataset.cartSelect, select.checked);
});

document.addEventListener("click", (event) => {
  const tabBtn = event.target.closest("[data-nav]");
  if (tabBtn && tabBtn.closest(".custom-nav")) {
    switchTab(tabBtn.dataset.nav);
    return;
  }

  if (event.target.closest("[data-close-modal]") || event.target === modalMask) {
    closeModal();
    return;
  }

  const qtyMinus = event.target.closest("[data-add-qty-minus]");
  if (qtyMinus) {
    const input = qtyMinus.parentElement?.querySelector("[data-add-qty-input]");
    if (input) {
      const next = Math.max(1, Number(input.value || 1) - 1);
      input.value = String(next);
    }
    return;
  }

  const qtyPlus = event.target.closest("[data-add-qty-plus]");
  if (qtyPlus) {
    const input = qtyPlus.parentElement?.querySelector("[data-add-qty-input]");
    if (input) {
      const next = Math.max(1, Number(input.value || 1) + 1);
      input.value = String(next);
    }
    return;
  }

  const addBtn = event.target.closest("[data-add-cart]");
  if (addBtn) {
    const product = products.find((item) => item.id === addBtn.dataset.productId);
    const spec = product?.specs?.find((item) => item.id === addBtn.dataset.specId);
    if (!product || !spec) return;
    const input = addBtn
      .closest(".add-actions")
      ?.querySelector("[data-add-qty-input]");
    const quantity = Math.max(1, Math.floor(Number(input?.value || 1)));
    if (input) input.value = String(quantity);
    addToCart(product, spec, quantity);
    return;
  }

  const minus = event.target.closest("[data-qty-minus]");
  if (minus) {
    updateCartQty(minus.dataset.qtyMinus, -1);
    return;
  }

  const plus = event.target.closest("[data-qty-plus]");
  if (plus) {
    updateCartQty(plus.dataset.qtyPlus, 1);
    return;
  }

  const remove = event.target.closest("[data-remove-cart]");
  if (remove) {
    removeCartItem(remove.dataset.removeCart);
    return;
  }

  if (event.target.closest("#checkout-btn")) {
    openCheckoutModal();
    return;
  }

  const editShipping = event.target.closest("[data-edit-shipping]");
  if (editShipping) {
    openEditShippingModal(editShipping.dataset.editShipping);
  }
});

(async function init() {
  const ok = await ensurePageCode();
  if (!ok) return;

  syncCartBadge();
  cartTotalEl.textContent = "0.00";
  try {
    await loadProducts();
  } catch (error) {
    productListEl.innerHTML = `<div class="empty-tip">${escapeHtml(error.message)}</div>`;
  }
})();
