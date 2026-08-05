const listEl = document.getElementById("material-list");
const modalMask = document.getElementById("modal-mask");
const modal = document.getElementById("modal");
const toastEl = document.getElementById("toast");
const myRecordBtn = document.getElementById("my-record-btn");

const pageCode = new URLSearchParams(window.location.search).get("code")?.trim() || "";

const EXPECTED_PAGE_TYPE = "exchange";
const ENTRY_URL = "/page/";

let materials = [];
let myRecord = null;
let selectedMaterial = null;

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
        `该页面码属于${data.pageTypeLabel || "其他类型"}，无法进入物料互换页`,
      );
      return false;
    }
    return true;
  } catch (error) {
    redirectToEntry(error.message || "页面码无效或不存在");
    return false;
  }
}

function closeModal() {
  modalMask.classList.remove("open");
  modal.innerHTML = "";
  selectedMaterial = null;
}

function platformRadios(selected = "🍠") {
  return `
    <div class="platform-options">
      <label>
        <input type="radio" name="platform" value="🍠" required ${selected === "🍠" ? "checked" : ""} />
        <span>🍠</span>
      </label>
      <label>
        <input type="radio" name="platform" value="🫘" required ${selected === "🫘" ? "checked" : ""} />
        <span>🫘</span>
      </label>
    </div>
  `;
}

function openAlreadySelectedModal() {
  modal.innerHTML = `
    <h2>无法选择</h2>
    <p class="sub">您已经选择过物料，请先取消当前选择，再选择其他物料。</p>
    <div class="form-actions">
      <button type="button" class="btn btn-ghost" data-close-modal>知道了</button>
      <button type="button" class="btn btn-primary" data-go-cancel>去取消选择</button>
    </div>
  `;
  modalMask.classList.add("open");
}

function openSelectModal(material) {
  if (!pageCode) {
    toast("缺少页面码，请从入口页进入", true);
    return;
  }
  if (myRecord) {
    openAlreadySelectedModal();
    return;
  }

  selectedMaterial = material;
  modal.innerHTML = `
    <h2>选择互换</h2>
    <p class="sub">物料：${escapeHtml(material.name)}</p>
    <form class="form-grid" id="exchange-form">
      <div class="form-row">
        <label>平台</label>
        ${platformRadios()}
      </div>
      <div class="form-row">
        <label>ID</label>
        <input name="platformUserId" type="text" maxlength="128" required placeholder="请输入平台 ID" autocomplete="off" />
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>取消</button>
        <button type="submit" class="btn btn-primary" id="submit-btn">提交</button>
      </div>
    </form>
  `;
  modalMask.classList.add("open");

  document.getElementById("exchange-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById("submit-btn");
    const platformUserId = form.platformUserId.value.trim();

    if (!platformUserId) {
      toast("请输入 ID", true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "提交中…";

    try {
      myRecord = await api("/material-exchange-records", {
        method: "POST",
        body: JSON.stringify({
          pageCode,
          materialId: selectedMaterial.id,
          platform: form.platform.value,
          platformUserId,
        }),
      });
      toast("提交成功");
      closeModal();
      await refresh();
    } catch (error) {
      toast(error.message, true);
      submitBtn.disabled = false;
      submitBtn.textContent = "提交";
    }
  });
}

async function cancelSelection() {
  if (!pageCode || !myRecord) return;

  try {
    await api(
      `/material-exchange-records/by-code/${encodeURIComponent(pageCode)}`,
      { method: "DELETE" },
    );
    myRecord = null;
    toast("已取消选择");
    closeModal();
    await refresh();
  } catch (error) {
    toast(error.message, true);
  }
}

function openMyRecordModal() {
  if (!myRecord) {
    toast("暂无提交记录", true);
    return;
  }

  modal.innerHTML = `
    <h2>我的记录</h2>
    <p class="sub">查看兑换二维码</p>
    <div class="qr-panel">
      ${
        myRecord.qrCodeUrl
          ? `<img class="qr-image" src="${escapeHtml(myRecord.qrCodeUrl)}" alt="兑换二维码" />`
          : `<div class="empty-tip">暂无二维码</div>`
      }
    </div>
    <p class="sub">可在下方修改领取信息</p>
    <form class="form-grid" id="record-form">
      <div class="form-row">
        <label>当前物料</label>
        <input value="${escapeHtml(myRecord.materialName)}" disabled />
      </div>
      <div class="form-row">
        <label>平台</label>
        ${platformRadios(myRecord.platform)}
      </div>
      <div class="form-row">
        <label>ID</label>
        <input name="platformUserId" type="text" maxlength="128" required value="${escapeHtml(myRecord.platformUserId)}" />
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-close-modal>关闭</button>
        <button type="button" class="btn btn-ghost" data-cancel-select>取消选择</button>
        <button type="submit" class="btn btn-primary" id="submit-btn">保存修改</button>
      </div>
    </form>
  `;
  modalMask.classList.add("open");

  document.getElementById("record-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById("submit-btn");
    const platformUserId = form.platformUserId.value.trim();
    const platform = form.platform.value;

    if (!platformUserId) {
      toast("请输入 ID", true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "保存中…";

    try {
      myRecord = await api(
        `/material-exchange-records/by-code/${encodeURIComponent(pageCode)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ platform, platformUserId }),
        },
      );
      toast("领取信息已更新");
      closeModal();
      await refresh();
    } catch (error) {
      toast(error.message, true);
      submitBtn.disabled = false;
      submitBtn.textContent = "保存修改";
    }
  });
}

function getOrderedMaterials() {
  if (!myRecord) return materials;

  const selected = [];
  const others = [];
  for (const item of materials) {
    if (String(item.id) === String(myRecord.materialId)) {
      selected.push(item);
    } else {
      others.push(item);
    }
  }
  return [...selected, ...others];
}

function renderMaterials() {
  if (!pageCode) {
    listEl.innerHTML = `<div class="empty-tip">缺少页面码，请从入口页输入标识码进入</div>`;
    return;
  }

  if (!materials.length) {
    listEl.innerHTML = `<div class="empty-tip">暂无可互换物料</div>`;
    return;
  }

  const ordered = getOrderedMaterials();

  listEl.innerHTML = ordered
    .map((item) => {
      const isCurrent = String(myRecord?.materialId) === String(item.id);
      const noStock = Number(item.quantity) <= 0;
      let disabled = false;
      let label = "选择";
      let actionAttr = `data-select-id="${item.id}"`;
      let btnClass = "select-btn";

      if (isCurrent) {
        label = "取消选择";
        actionAttr = `data-cancel-id="${item.id}"`;
        btnClass = "select-btn cancel-btn";
      } else if (noStock) {
        disabled = true;
        label = "已兑完";
      }

      return `
        <article class="material-row ${isCurrent ? "is-current" : ""}">
          <img src="${escapeHtml(item.image || "")}" alt="" onerror="this.style.opacity=.25" />
          <div class="material-meta">
            <h2>${escapeHtml(item.name)}</h2>
            <p>剩余数量：${item.quantity}</p>
          </div>
          <button
            type="button"
            class="${btnClass}"
            ${actionAttr}
            ${disabled ? "disabled" : ""}
          >${label}</button>
        </article>
      `;
    })
    .join("");
}

function syncRecordButton() {
  myRecordBtn.hidden = !myRecord;
}

async function refresh() {
  materials = await api("/exchange-materials");
  if (pageCode) {
    const result = await api(
      `/material-exchange-records/by-code/${encodeURIComponent(pageCode)}`,
    );
    myRecord = result?.record ?? null;
  } else {
    myRecord = null;
  }
  syncRecordButton();
  renderMaterials();
}

document.addEventListener("click", async (event) => {
  if (event.target.closest("[data-close-modal]") || event.target === modalMask) {
    closeModal();
    return;
  }

  if (event.target.closest("[data-go-cancel]")) {
    closeModal();
    const currentBtn = document.querySelector("[data-cancel-id]");
    currentBtn?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (event.target.closest("#my-record-btn")) {
    openMyRecordModal();
    return;
  }

  if (event.target.closest("[data-cancel-select]") || event.target.closest("[data-cancel-id]")) {
    await cancelSelection();
    return;
  }

  const selectBtn = event.target.closest("[data-select-id]");
  if (!selectBtn || selectBtn.disabled) return;

  const material = materials.find((item) => item.id === selectBtn.dataset.selectId);
  if (!material) return;
  openSelectModal(material);
});

(async function init() {
  const ok = await ensurePageCode();
  if (!ok) return;

  try {
    await refresh();
  } catch (error) {
    listEl.innerHTML = `<div class="empty-tip">${escapeHtml(error.message)}</div>`;
  }
})();
