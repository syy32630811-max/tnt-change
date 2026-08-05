const ICONS = {
  edit: `<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  detail: `<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

const PAGE_TYPES = [
  { value: "admin", label: "管理页面" },
  { value: "exchange", label: "物料互换" },
  { value: "custom", label: "物料定制" },
];

const ORDER_STATUSES = [
  { value: "submitted", label: "已提交" },
  { value: "paid", label: "已支付" },
  { value: "customizing", label: "定制中" },
  { value: "shipped", label: "已发货" },
  { value: "cancelled", label: "已取消" },
];

const pageCode =
  new URLSearchParams(window.location.search).get("code")?.trim() || "";
const EXPECTED_PAGE_TYPE = "admin";
const ENTRY_URL = "/page/";

const state = {
  view: "materials",
  materials: [],
  materialRecords: [],
  products: [],
  orders: [],
  pageCodes: [],
  editingId: null,
  productSpecs: [{ name: "", image: "", price: "" }],
};

const els = {
  views: [...document.querySelectorAll(".view")],
  navButtons: [...document.querySelectorAll("[data-nav]")],
  toast: document.getElementById("toast"),
  modalMask: document.getElementById("modal-mask"),
  modal: document.getElementById("modal"),
};

function toast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.classList.toggle("error", isError);
  els.toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => els.toast.classList.remove("show"), 2400);
}

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const raw = data.message;
    const message = Array.isArray(raw) ? raw[0] : raw || "请求失败";
    throw new Error(message);
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
        `该页面码属于${data.pageTypeLabel || "其他类型"}，无法进入管理页`,
      );
      return false;
    }
    return true;
  } catch (error) {
    redirectToEntry(error.message || "页面码无效或不存在");
    return false;
  }
}

async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  return api("/uploads", { method: "POST", body: form });
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

function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
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
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function closeModal() {
  els.modalMask.classList.remove("open");
  els.modal.innerHTML = "";
  state.editingId = null;
}

function openModal(html, wide = false) {
  els.modal.classList.toggle("wide", wide);
  els.modal.innerHTML = html;
  els.modalMask.classList.add("open");
}

function switchView(view) {
  state.view = view;
  els.views.forEach((node) => {
    node.classList.toggle("active", node.dataset.view === view);
  });
  els.navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === view);
  });
  loadCurrentView();
}

async function loadCurrentView() {
  try {
    if (state.view === "materials") {
      state.materials = await api("/materials");
      renderMaterials();
    } else if (state.view === "material-records") {
      state.materialRecords = await api("/material-exchange-records");
      renderMaterialRecords();
    } else if (state.view === "products") {
      state.products = await api("/products");
      renderProducts();
    } else if (state.view === "orders") {
      state.orders = await api("/orders");
      renderOrders();
    } else if (state.view === "page-codes") {
      state.pageCodes = await api("/page-entry-codes");
      renderPageCodes();
    }
  } catch (error) {
    toast(error.message, true);
  }
}

function renderMaterials() {
  const body = document.getElementById("materials-body");
  if (!state.materials.length) {
    body.innerHTML = `<tr><td colspan="6"><div class="empty">暂无物料，点击右上角新增</div></td></tr>`;
    return;
  }

  body.innerHTML = state.materials
    .map(
      (item) => `
      <tr>
        <td><img class="thumb" src="${item.image || ""}" alt="" onerror="this.style.opacity=.2"/></td>
        <td>${escapeHtml(item.name)}</td>
        <td>${item.quantity}</td>
        <td>${formatDate(item.expireAt)}</td>
        <td><span class="badge ${item.isValid ? "valid" : "invalid"}">${item.isValid ? "有效" : "无效"}</span></td>
        <td>
          <button class="icon-btn" title="编辑" data-edit-material="${item.id}">${ICONS.edit}</button>
        </td>
      </tr>`,
    )
    .join("");
}

function renderMaterialRecords() {
  const body = document.getElementById("material-records-body");
  if (!state.materialRecords.length) {
    body.innerHTML = `<tr><td colspan="7"><div class="empty">暂无有效期内物料的互换记录</div></td></tr>`;
    return;
  }

  body.innerHTML = state.materialRecords
    .map(
      (item) => `
      <tr>
        <td><code>${escapeHtml(item.pageCode || "-")}</code></td>
        <td>${escapeHtml(item.materialName)}</td>
        <td>${escapeHtml(item.platform)}</td>
        <td>${escapeHtml(item.platformUserId)}</td>
        <td>${escapeHtml(item.redeemCode || "-")}</td>
        <td>${formatDate(item.materialExpireAt)}</td>
        <td>${formatDate(item.createdAt)}</td>
      </tr>`,
    )
    .join("");
}

function renderProducts() {
  const body = document.getElementById("products-body");
  if (!state.products.length) {
    body.innerHTML = `<tr><td colspan="5"><div class="empty">暂无商品，点击右上角新增</div></td></tr>`;
    return;
  }

  body.innerHTML = state.products
    .map(
      (item) => `
      <tr>
        <td><img class="thumb" src="${item.coverImage || ""}" alt="" onerror="this.style.opacity=.2"/></td>
        <td>${escapeHtml(item.name)}</td>
        <td>${(item.specs || []).length} 个规格</td>
        <td><span class="badge ${item.isValid ? "valid" : "invalid"}">${item.isValid ? "有效" : "无效"}</span></td>
        <td>
          <button class="icon-btn" title="编辑" data-edit-product="${item.id}">${ICONS.edit}</button>
        </td>
      </tr>`,
    )
    .join("");
}

function renderOrders() {
  const body = document.getElementById("orders-body");
  if (!state.orders.length) {
    body.innerHTML = `<tr><td colspan="6"><div class="empty">暂无订单</div></td></tr>`;
    return;
  }

  body.innerHTML = state.orders
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.orderNo)}</td>
        <td>
          <select class="status-select" data-order-status="${item.id}">
            ${ORDER_STATUSES.map(
              (status) =>
                `<option value="${status.value}" ${status.value === item.status ? "selected" : ""}>${status.label}</option>`,
            ).join("")}
          </select>
        </td>
        <td>${escapeHtml(item.trackingNo || "-")}</td>
        <td>${escapeHtml(item.contactName || "-")}</td>
        <td>${formatDate(item.createdAt)}</td>
        <td>
          <button class="icon-btn" title="详情" data-detail-order="${item.id}">${ICONS.detail}</button>
          <button class="icon-btn" title="编辑快递单号" data-edit-order="${item.id}">${ICONS.edit}</button>
        </td>
      </tr>`,
    )
    .join("");
}

async function updateOrderStatus(orderId, status) {
  await api(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  toast("订单状态已更新");
  await loadCurrentView();
}

function renderPageCodes() {
  const body = document.getElementById("page-codes-body");
  if (!state.pageCodes.length) {
    body.innerHTML = `<tr><td colspan="5"><div class="empty">暂无页面码，点击右上角新增</div></td></tr>`;
    return;
  }

  body.innerHTML = state.pageCodes
    .map(
      (item) => `
      <tr>
        <td><code>${escapeHtml(item.code)}</code></td>
        <td>${escapeHtml(item.pageTypeLabel || item.pageType)}</td>
        <td><span class="badge ${item.isValid ? "valid" : "invalid"}">${item.isValid ? "有效" : "无效"}</span></td>
        <td>${formatDate(item.createdAt)}</td>
        <td>
          <button class="icon-btn" title="切换有效状态" data-toggle-code="${item.id}" data-valid="${item.isValid ? "1" : "0"}">${ICONS.edit}</button>
        </td>
      </tr>`,
    )
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function materialFormHtml(item) {
  const isEdit = Boolean(item);
  return `
    <h2>${isEdit ? "编辑物料" : "新增物料"}</h2>
    <form class="form-grid" id="material-form">
      <div class="form-row">
        <label>名称</label>
        <input name="name" required maxlength="128" value="${escapeHtml(item?.name || "")}" />
      </div>
      <div class="form-row">
        <label>图片</label>
        <div class="upload-box">
          <img class="preview" id="material-preview" src="${item?.image || ""}" alt="" />
          <input type="hidden" name="image" id="material-image" value="${escapeHtml(item?.image || "")}" required />
          <input type="file" id="material-file" accept="image/*" />
        </div>
      </div>
      <div class="form-row">
        <label>总量</label>
        <input name="quantity" type="number" min="0" required value="${item?.quantity ?? 0}" />
      </div>
      <div class="form-row">
        <label>到期时间</label>
        <input name="expireAt" type="datetime-local" required value="${toDatetimeLocal(item?.expireAt)}" />
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>取消</button>
        <button type="submit" class="btn btn-primary">保存</button>
      </div>
    </form>
  `;
}

function renderSpecEditor() {
  const box = document.getElementById("specs-editor");
  if (!box) return;
  box.innerHTML = state.productSpecs
    .map(
      (spec, index) => `
      <div class="spec-item" data-spec-index="${index}">
        <img class="preview" src="${spec.image || ""}" alt="" />
        <div class="spec-fields">
          <input type="text" maxlength="128" placeholder="规格名称" value="${escapeHtml(spec.name || "")}" data-spec-name="${index}" />
          <input type="file" accept="image/*" data-spec-file="${index}" />
          <input type="number" min="0" step="0.01" placeholder="价格" value="${spec.price}" data-spec-price="${index}" />
        </div>
        <button type="button" class="btn btn-ghost" data-remove-spec="${index}">删除</button>
      </div>`,
    )
    .join("");
}

function productFormHtml(item) {
  const isEdit = Boolean(item);
  return `
    <h2>${isEdit ? "编辑商品" : "新增商品"}</h2>
    <form class="form-grid" id="product-form">
      <div class="form-row">
        <label>名称</label>
        <input name="name" required maxlength="128" value="${escapeHtml(item?.name || "")}" />
      </div>
      <div class="form-row">
        <label>封面图片</label>
        <div class="upload-box">
          <img class="preview" id="product-cover-preview" src="${item?.coverImage || ""}" alt="" />
          <input type="hidden" name="coverImage" id="product-cover" value="${escapeHtml(item?.coverImage || "")}" required />
          <input type="file" id="product-cover-file" accept="image/*" />
        </div>
      </div>
      <div class="form-row">
        <label>规格（名称 + 图片 + 价格）</label>
        <div class="specs-list" id="specs-editor"></div>
        <button type="button" class="btn btn-ghost" id="add-spec-btn">添加规格</button>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>取消</button>
        <button type="submit" class="btn btn-primary">保存</button>
      </div>
    </form>
  `;
}

function pageCodeFormHtml() {
  return `
    <h2>新增页面码</h2>
    <form class="form-grid" id="page-code-form">
      <div class="form-row">
        <label>页面类型</label>
        <select name="pageType" required>
          ${PAGE_TYPES.map((item) => `<option value="${item.value}">${item.label}</option>`).join("")}
        </select>
      </div>
      <p style="margin:0;color:var(--mist);font-size:.9rem">保存后将自动生成 12 位随机页面码。</p>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>取消</button>
        <button type="submit" class="btn btn-primary">生成并保存</button>
      </div>
    </form>
  `;
}

function orderDetailHtml(order) {
  const items = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td><img class="thumb sm" src="${item.image || ""}" alt="" /></td>
        <td>${escapeHtml(item.productName)}</td>
        <td>¥${item.price}</td>
        <td>x${item.quantity}</td>
      </tr>`,
    )
    .join("");

  return `
    <h2>订单详情</h2>
    <div class="detail-block">
      <div class="row"><span>订单号</span><span>${escapeHtml(order.orderNo)}</span></div>
      <div class="row"><span>联系人</span><span>${escapeHtml(order.contactName || "-")}</span></div>
      <div class="row"><span>电话</span><span>${escapeHtml(order.contactPhone || "-")}</span></div>
      <div class="row"><span>地址</span><span>${escapeHtml(order.address || "-")}</span></div>
      <div class="row"><span>快递单号</span><span>${escapeHtml(order.trackingNo || "-")}</span></div>
      <div class="row"><span>创建时间</span><span>${formatDate(order.createdAt)}</span></div>
    </div>
    <div class="form-row">
      <label>订单状态</label>
      <select id="order-status">
        ${ORDER_STATUSES.map(
          (item) =>
            `<option value="${item.value}" ${item.value === order.status ? "selected" : ""}>${item.label}</option>`,
        ).join("")}
      </select>
    </div>
    <div class="table-wrap" style="margin-top:16px">
      <table class="data-table">
        <thead><tr><th>图</th><th>商品</th><th>价格</th><th>数量</th></tr></thead>
        <tbody>${items || `<tr><td colspan="4"><div class="empty">无明细</div></td></tr>`}</tbody>
      </table>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-ghost" data-close-modal>关闭</button>
      <button type="button" class="btn btn-primary" data-save-order-status="${order.id}">保存状态</button>
    </div>
  `;
}

function orderTrackingHtml(order) {
  return `
    <h2>编辑快递单号</h2>
    <form class="form-grid" id="tracking-form">
      <div class="form-row">
        <label>订单号</label>
        <input value="${escapeHtml(order.orderNo)}" disabled />
      </div>
      <div class="form-row">
        <label>快递单号</label>
        <input name="trackingNo" required maxlength="128" value="${escapeHtml(order.trackingNo || "")}" />
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>取消</button>
        <button type="submit" class="btn btn-primary">保存</button>
      </div>
    </form>
  `;
}

async function openMaterialModal(id) {
  const item = id ? state.materials.find((row) => row.id === id) : null;
  state.editingId = id || null;
  openModal(materialFormHtml(item));

  document.getElementById("material-file")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadFile(file);
      document.getElementById("material-image").value = uploaded.url;
      document.getElementById("material-preview").src = uploaded.url;
    } catch (error) {
      toast(error.message, true);
    }
  });

  document.getElementById("material-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const payload = {
      name: form.name.value.trim(),
      image: form.image.value,
      quantity: Number(form.quantity.value),
      expireAt: new Date(`${form.expireAt.value}:00+08:00`).toISOString(),
    };

    if (!payload.image) {
      toast("请上传图片", true);
      return;
    }

    try {
      if (state.editingId) {
        await api(`/materials/${state.editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast("物料已更新");
      } else {
        await api("/materials", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast("物料已创建");
      }
      closeModal();
      await loadCurrentView();
    } catch (error) {
      toast(error.message, true);
    }
  });
}

async function openProductModal(id) {
  const item = id ? state.products.find((row) => row.id === id) : null;
  state.editingId = id || null;
  state.productSpecs = item?.specs?.length
    ? item.specs.map((spec) => ({
        name: spec.name || "",
        image: spec.image,
        price: Number(spec.price),
      }))
    : [{ name: "", image: "", price: "" }];

  openModal(productFormHtml(item), true);
  renderSpecEditor();

  document.getElementById("product-cover-file")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadFile(file);
      document.getElementById("product-cover").value = uploaded.url;
      document.getElementById("product-cover-preview").src = uploaded.url;
    } catch (error) {
      toast(error.message, true);
    }
  });

  document.getElementById("add-spec-btn")?.addEventListener("click", () => {
    state.productSpecs.push({ name: "", image: "", price: "" });
    renderSpecEditor();
  });

  document.getElementById("specs-editor")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-remove-spec]");
    if (!btn) return;
    const index = Number(btn.dataset.removeSpec);
    if (state.productSpecs.length <= 1) {
      toast("至少保留一个规格", true);
      return;
    }
    state.productSpecs.splice(index, 1);
    renderSpecEditor();
  });

  document.getElementById("specs-editor")?.addEventListener("change", async (event) => {
    const fileInput = event.target.closest("[data-spec-file]");
    const priceInput = event.target.closest("[data-spec-price]");
    const nameInput = event.target.closest("[data-spec-name]");

    if (nameInput) {
      const index = Number(nameInput.dataset.specName);
      state.productSpecs[index].name = nameInput.value;
    }

    if (fileInput) {
      const index = Number(fileInput.dataset.specFile);
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        const uploaded = await uploadFile(file);
        state.productSpecs[index].image = uploaded.url;
        renderSpecEditor();
      } catch (error) {
        toast(error.message, true);
      }
    }

    if (priceInput) {
      const index = Number(priceInput.dataset.specPrice);
      state.productSpecs[index].price = priceInput.value;
    }
  });

  document.getElementById("specs-editor")?.addEventListener("input", (event) => {
    const nameInput = event.target.closest("[data-spec-name]");
    if (!nameInput) return;
    const index = Number(nameInput.dataset.specName);
    state.productSpecs[index].name = nameInput.value;
  });

  document.getElementById("product-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const coverImage = form.coverImage.value;
    const specs = state.productSpecs.map((spec) => ({
      name: String(spec.name || "").trim(),
      image: spec.image,
      price: Number(spec.price),
    }));

    if (!coverImage) {
      toast("请上传封面图片", true);
      return;
    }
    if (
      specs.some(
        (spec) =>
          !spec.name ||
          !spec.image ||
          Number.isNaN(spec.price) ||
          spec.price < 0,
      )
    ) {
      toast("请完善每个规格的名称、图片和价格", true);
      return;
    }

    const payload = {
      name: form.name.value.trim(),
      coverImage,
      specs,
    };

    try {
      if (state.editingId) {
        await api(`/products/${state.editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast("商品已更新");
      } else {
        await api("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast("商品已创建");
      }
      closeModal();
      await loadCurrentView();
    } catch (error) {
      toast(error.message, true);
    }
  });
}

function openPageCodeModal() {
  openModal(pageCodeFormHtml());
  document.getElementById("page-code-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    try {
      const created = await api("/page-entry-codes", {
        method: "POST",
        body: JSON.stringify({ pageType: form.pageType.value }),
      });
      toast(`已生成页面码：${created.code}`);
      closeModal();
      await loadCurrentView();
    } catch (error) {
      toast(error.message, true);
    }
  });
}

async function openOrderDetail(id) {
  try {
    const order = await api(`/orders/${id}`);
    openModal(orderDetailHtml(order), true);
  } catch (error) {
    toast(error.message, true);
  }
}

async function openOrderTracking(id) {
  try {
    const order = await api(`/orders/${id}`);
    state.editingId = id;
    openModal(orderTrackingHtml(order));
    document.getElementById("tracking-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const trackingNo = event.target.trackingNo.value.trim();
      try {
        await api(`/orders/${state.editingId}/tracking`, {
          method: "PATCH",
          body: JSON.stringify({ trackingNo }),
        });
        toast("快递单号已更新");
        closeModal();
        await loadCurrentView();
      } catch (error) {
        toast(error.message, true);
      }
    });
  } catch (error) {
    toast(error.message, true);
  }
}

document.addEventListener("change", async (event) => {
  const statusSelect = event.target.closest("[data-order-status]");
  if (!statusSelect) return;

  const orderId = statusSelect.dataset.orderStatus;
  const status = statusSelect.value;
  const previous = state.orders.find((item) => item.id === orderId)?.status;

  try {
    await updateOrderStatus(orderId, status);
  } catch (error) {
    if (previous) statusSelect.value = previous;
    toast(error.message, true);
  }
});

document.addEventListener("click", async (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    switchView(nav.dataset.nav);
    return;
  }

  if (event.target.closest("[data-close-modal]") || event.target === els.modalMask) {
    closeModal();
    return;
  }

  if (event.target.closest("#add-material-btn")) {
    openMaterialModal();
    return;
  }
  if (event.target.closest("#add-product-btn")) {
    openProductModal();
    return;
  }
  if (event.target.closest("#add-page-code-btn")) {
    openPageCodeModal();
    return;
  }

  const editMaterial = event.target.closest("[data-edit-material]");
  if (editMaterial) {
    openMaterialModal(editMaterial.dataset.editMaterial);
    return;
  }

  const editProduct = event.target.closest("[data-edit-product]");
  if (editProduct) {
    openProductModal(editProduct.dataset.editProduct);
    return;
  }

  const detailOrder = event.target.closest("[data-detail-order]");
  if (detailOrder) {
    openOrderDetail(detailOrder.dataset.detailOrder);
    return;
  }

  const editOrder = event.target.closest("[data-edit-order]");
  if (editOrder) {
    openOrderTracking(editOrder.dataset.editOrder);
    return;
  }

  const saveStatus = event.target.closest("[data-save-order-status]");
  if (saveStatus) {
    const status = document.getElementById("order-status")?.value;
    try {
      await updateOrderStatus(saveStatus.dataset.saveOrderStatus, status);
      closeModal();
    } catch (error) {
      toast(error.message, true);
    }
    return;
  }

  const toggleCode = event.target.closest("[data-toggle-code]");
  if (toggleCode) {
    const nextValid = toggleCode.dataset.valid !== "1";
    try {
      await api(`/page-entry-codes/${toggleCode.dataset.toggleCode}`, {
        method: "PATCH",
        body: JSON.stringify({ isValid: nextValid }),
      });
      toast(nextValid ? "页面码已启用" : "页面码已停用");
      await loadCurrentView();
    } catch (error) {
      toast(error.message, true);
    }
  }
});

(async function init() {
  const ok = await ensurePageCode();
  if (!ok) return;
  switchView("materials");
})();
